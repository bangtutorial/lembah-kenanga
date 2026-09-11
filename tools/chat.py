"""Obrolan publik untuk pemain yang sedang online, disimpan di SQLite.

Sengaja memakai HTTP long-poll, bukan WebSocket: server game ini sudah berupa
`ThreadingTCPServer` dari pustaka standar, jadi long-poll tidak menambah satu
pun dependensi dan tetap terasa seketika (poll digantung sampai 20 detik dan
dibangunkan begitu ada pesan masuk). WebSocket baru sepadan kalau nanti ada
posisi pemain yang perlu disiarkan puluhan kali per detik.

Penyimpanannya SQLite, juga dari pustaka standar. Berkasnya satu, di
`var/chat.db`, dibuat sendiri saat pertama dijalankan. Yang didapat dari
memindahkannya keluar dari memori:

- riwayat obrolan selamat dari server yang dimatikan;
- pembatasan laju dihitung dari pesan yang benar-benar tersimpan, bukan dari
  catatan terpisah yang ikut hilang tiap restart;
- kalau nanti di-hosting dengan lebih dari satu proses, yang perlu berubah cuma
  alamat koneksinya — bentuk tabel dan kuerinya tetap.

Yang TIDAK didapat: identitas yang bisa dipercaya. `token` hanyalah string acak
buatan browser dan nama ikut dikirim di tiap pesan, jadi siapa pun yang tahu
alamat API-nya bisa mengirim atas nama siapa saja. Itu urusan sistem akun, bukan
urusan basis data.

Endpoint:

    GET  /api/chat?since=<id>&token=<t>&name=<n>&avatar=<a>
         Menunggu sampai ada pesan dengan id > since, lalu mengembalikan
         {"messages": [...], "last": id, "online": n}.

    POST /api/chat        body JSON {"token","name","avatar","text"}
         Menambah satu pesan. {"ok": true} atau {"ok": false, "error": "..."}

    POST /api/chat/bye    body JSON {"token"} — dikirim saat tab ditutup
"""
import json
import os
import sqlite3
import threading
import time

import guard
import moderation

SERVE = 40             # pesan yang dikirim sekaligus ke klien
KEEP = 2000            # pesan yang disimpan di berkas sebelum dipangkas
MAX_TEXT = 160         # karakter per pesan
MAX_NAME = 20
COOLDOWN = 1.2         # detik antar pesan dari satu orang
BURST = 20             # pesan per menit dari satu orang
# Jendela kehadiran harus lebih panjang dari satu long-poll, kalau tidak klien
# yang sedang menggantung terhitung pergi. Selisih 10 detik sudah cukup, dan
# menyempitkan keduanya membuat angka online menyusut lebih cepat saat ada yang
# pergi tanpa sempat pamit (browser ditutup paksa, jaringan putus).
ONLINE_WINDOW = 30     # dianggap online kalau terlihat dalam sekian detik
POLL_TIMEOUT = 20      # lama satu long-poll digantung

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.environ.get("LK_CHAT_DB") or os.path.join(ROOT, "var", "chat.db")

SCHEMA = """
CREATE TABLE IF NOT EXISTS messages (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  token  TEXT NOT NULL,
  name   TEXT NOT NULL,
  avatar TEXT NOT NULL,
  text   TEXT NOT NULL,
  ts     REAL NOT NULL
);
CREATE INDEX IF NOT EXISTS messages_token_ts ON messages (token, ts);

CREATE TABLE IF NOT EXISTS presence (
  token   TEXT PRIMARY KEY,
  name    TEXT,
  avatar  TEXT,
  seen_at REAL NOT NULL
);
CREATE INDEX IF NOT EXISTS presence_seen ON presence (seen_at);
"""


def _clean(s, limit):
    """Buang karakter kendali, rapatkan spasi, potong panjangnya."""
    if not isinstance(s, str):
        return ""
    out = "".join(ch for ch in s if ch == " " or (ch.isprintable() and ch not in "\r\n\t"))
    return " ".join(out.split())[:limit]


class ChatRoom:
    def __init__(self, path=DB_PATH):
        self.path = path
        self.cond = threading.Condition()
        # Satu koneksi per thread. Server melayani tiap permintaan di thread-nya
        # sendiri dan objek sqlite3.Connection tidak boleh berpindah thread;
        # `threading.local` menyelesaikannya tanpa kunci global yang akan
        # menyerialkan seluruh long-poll.
        self._local = threading.local()
        os.makedirs(os.path.dirname(path), exist_ok=True)
        db = self._db()
        # WAL supaya satu penulis tidak memblokir pembaca — dan di sini
        # pembacanya banyak, karena tiap klien menggantung satu poll.
        db.execute("PRAGMA journal_mode=WAL")
        db.execute("PRAGMA synchronous=NORMAL")
        db.executescript(SCHEMA)

    def _db(self):
        db = getattr(self._local, "db", None)
        if db is None:
            # isolation_level=None: autocommit. Tulisannya satu baris sekali
            # jalan, jadi transaksi eksplisit hanya menambah kunci yang ditahan
            # lebih lama daripada perlunya.
            db = sqlite3.connect(self.path, timeout=10, isolation_level=None)
            db.row_factory = sqlite3.Row
            self._local.db = db
        return db

    # -- presence -----------------------------------------------------------
    def touch(self, token, name, avatar):
        if not token:
            return
        self._db().execute(
            "INSERT INTO presence (token, name, avatar, seen_at) VALUES (?, ?, ?, ?) "
            "ON CONFLICT(token) DO UPDATE SET "
            "name = excluded.name, avatar = excluded.avatar, seen_at = excluded.seen_at",
            (token, name, avatar, time.time()))

    def leave(self, token):
        if token:
            self._db().execute("DELETE FROM presence WHERE token = ?", (token,))

    def online(self):
        row = self._db().execute(
            "SELECT COUNT(*) AS n FROM presence WHERE seen_at >= ?",
            (time.time() - ONLINE_WINDOW,)).fetchone()
        return row["n"] if row else 0

    # -- messages -----------------------------------------------------------
    def post(self, token, name, avatar, text):
        name = _clean(name, MAX_NAME) or "Petani"
        text = _clean(text, MAX_TEXT)
        if not text:
            return {"ok": False, "error": "Pesannya kosong."}
        # Disensor, bukan ditolak: menolak hanya mengundang percobaan ejaan lain
        # sampai lolos, sementara menyensor sudah menggagalkan maksudnya.
        text, hits = moderation.clean(text)
        if hits and not text.strip("* "):
            return {"ok": False, "error": "Pesannya tidak bisa dikirim."}
        if not token:
            return {"ok": False, "error": "Sesi tidak dikenal."}

        db = self._db()
        now = time.time()
        # Pembatasan laju dibaca dari pesan yang tersimpan, bukan dari catatan
        # terpisah: satu sumber kebenaran, dan ia ikut selamat dari restart.
        row = db.execute(
            "SELECT COUNT(*) AS n, MAX(ts) AS last FROM messages WHERE token = ? AND ts > ?",
            (token, now - 60)).fetchone()
        if row["last"] is not None and now - row["last"] < COOLDOWN:
            return {"ok": False, "error": "Sabar sebentar..."}
        if row["n"] >= BURST:
            return {"ok": False, "error": "Terlalu banyak pesan. Istirahat sejenak."}

        cur = db.execute(
            "INSERT INTO messages (token, name, avatar, text, ts) VALUES (?, ?, ?, ?, ?)",
            (token, name, avatar, text, now))
        new_id = cur.lastrowid
        self.touch(token, name, avatar)
        self._prune(db)
        # Bangunkan semua poll yang sedang menggantung, setelah barisnya benar
        # benar tersimpan — kalau dibalik, mereka bangun dan tidak menemukan apa-apa.
        with self.cond:
            self.cond.notify_all()
        return {"ok": True, "id": new_id}

    def _prune(self, db):
        db.execute("DELETE FROM messages WHERE id <= (SELECT MAX(id) FROM messages) - ?", (KEEP,))
        db.execute("DELETE FROM presence WHERE seen_at < ?", (time.time() - ONLINE_WINDOW * 8,))

    def poll(self, since, token, timeout=POLL_TIMEOUT):
        """Pesan setelah `since`; menunggu sampai ada atau sampai waktunya habis."""
        deadline = time.time() + timeout
        db = self._db()
        while True:
            if since == 0:
                # Klien baru: kirim ekor riwayat sebagai konteks.
                rows = db.execute(
                    "SELECT * FROM (SELECT * FROM messages ORDER BY id DESC LIMIT ?) ORDER BY id",
                    (SERVE,)).fetchall()
            else:
                rows = db.execute(
                    "SELECT * FROM messages WHERE id > ? ORDER BY id LIMIT ?",
                    (since, SERVE)).fetchall()
            if rows or time.time() >= deadline:
                last = db.execute("SELECT MAX(id) AS m FROM messages").fetchone()["m"] or 0
                return {"messages": [self._public(r, token) for r in rows],
                        "last": last, "online": self.online()}
            with self.cond:
                self.cond.wait(min(1.0, max(0.05, deadline - time.time())))

    @staticmethod
    def _public(row, token):
        """Bentuk yang boleh dilihat klien: tanpa token siapa pun.

        `own` dihitung di sini, bukan di klien, supaya pesan sendiri tetap
        dikenali setelah halaman dimuat ulang — daftar id yang dikirim tab ini
        hilang saat reload, tapi tokennya tidak.
        """
        return {
            "id": row["id"], "name": row["name"], "avatar": row["avatar"],
            "text": row["text"], "ts": row["ts"],
            "own": bool(token) and row["token"] == token,
        }


room = ChatRoom()


def handle(handler, method, path, query, body):
    """Tangani satu permintaan /api/chat*. Kembalikan True kalau sudah ditangani."""
    if path == "/api/chat/bye":
        # Dikirim lewat sendBeacon saat tab ditutup: tidak ada yang menunggu
        # jawabannya, yang penting tokennya langsung dicoret dari daftar hadir.
        data, err = guard.parse_json(body)
        if not err:
            room.leave(guard.text_field(data, "token", 64))
        _send(handler, {"ok": True})
        return True

    if path != "/api/chat":
        return False

    ip = guard.client_ip(handler)
    token = (query.get("token") or [""])[0][:64]
    name = (query.get("name") or [""])[0][:MAX_NAME * 2]
    avatar = (query.get("avatar") or [""])[0][:40]

    if method == "GET":
        # Batas per-IP, bukan per-token: token dibuat sendiri oleh peramban, jadi
        # pembanjir tinggal mengarang token baru tiap permintaan.
        blocked = guard.limiter.check("chat_poll", ip)
        if blocked:
            _send(handler, {"messages": [], "last": 0, "online": 0, "error": blocked}, 429)
            return True
        room.touch(token, _clean(name, MAX_NAME), _clean(avatar, 40))
        try:
            since = max(0, int((query.get("since") or ["0"])[0]))
        except ValueError:
            since = 0
        _send(handler, room.poll(since, token))
        return True

    if method == "POST":
        blocked = guard.limiter.check("chat_post", ip)
        if blocked:
            _send(handler, {"ok": False, "error": blocked}, 429)
            return True
        data, err = guard.parse_json(body)
        if err:
            _send(handler, {"ok": False, "error": err}, 400)
            return True
        result = room.post(
            guard.text_field(data, "token", 64),
            guard.text_field(data, "name", MAX_NAME * 2),
            guard.text_field(data, "avatar", 40),
            guard.text_field(data, "text", MAX_TEXT * 2),
        )
        _send(handler, result, 200 if result.get("ok") else 429)
        return True

    _send(handler, {"ok": False, "error": "Metode tidak didukung."}, 405)
    return True


_send = guard.send
