"""Akun pemain: username unik tanpa kata sandi, plus simpanan permainannya.

Ini MVP dan disengaja tanpa kata sandi, jadi perlu jelas apa yang ia berikan dan
apa yang tidak:

- yang DIBERIKAN: **keunikan**. Satu username dipegang satu orang, dan simpanan
  permainannya bisa diambil lagi dari peramban mana pun cukup dengan mengetik
  username itu.
- yang TIDAK diberikan: **pembuktian**. Tanpa kata sandi, siapa pun yang tahu
  username orang lain bisa mengetiknya dan mengambil alih simpanan sekaligus
  identitas obrolannya. Itu bukan celah yang bisa ditambal di lapisan ini;
  obatnya kata sandi atau tautan masuk, bukan tabel tambahan.

Kolom `secret` sudah disediakan tapi dibiarkan kosong. Saat kata sandi
ditambahkan nanti, isinya cukup diganti hash dan alur masuknya menyesuaikan —
tabelnya tidak perlu dibongkar dan simpanan yang sudah ada tidak perlu
dipindahkan.

Endpoint:

    POST /api/player/check    {"username"}            -> {ok, available, reason}
    POST /api/player/register {"username", "profile"} -> {ok, error}
    POST /api/player/resume   {"username"}            -> {ok, profile, save}
    POST /api/player/save     {"username", "profile", "save"} -> {ok}
"""
import hashlib
import json
import os
import re
import secrets
import sqlite3
import threading
import time

import guard

# Huruf dan angka saja: tidak ada spasi, tanda baca, atau emoji. Aturannya ketat
# supaya username bisa diketik ulang orang lain tanpa salah — itu satu-satunya
# cara masuk kembali ke permainannya.
USERNAME_RE = re.compile(r"^[A-Za-z0-9]{3,16}$")
MAX_SAVE = 256 * 1024          # satu simpanan permainan, dibatasi 256 KB

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.environ.get("LK_CHAT_DB") or os.path.join(ROOT, "var", "chat.db")

SCHEMA = """
CREATE TABLE IF NOT EXISTS players (
  username   TEXT PRIMARY KEY COLLATE NOCASE,
  profile    TEXT NOT NULL,
  save       TEXT,
  secret     TEXT,
  key_hash   TEXT,
  created_at REAL NOT NULL,
  saved_at   REAL
);
"""


def _hash(key):
    return hashlib.sha256(key.encode("utf-8")).hexdigest()


def validate(username):
    """Kembalikan pesan kesalahan, atau None kalau bentuknya sah."""
    if not isinstance(username, str) or not username.strip():
        return "Username belum diisi."
    u = username.strip()
    if len(u) < 3:
        return "Username minimal 3 karakter."
    if len(u) > 16:
        return "Username maksimal 16 karakter."
    if not USERNAME_RE.match(u):
        return "Username hanya boleh huruf dan angka, tanpa spasi."
    return None


class Players:
    def __init__(self, path=DB_PATH):
        self.path = path
        self._local = threading.local()
        os.makedirs(os.path.dirname(path), exist_ok=True)
        db = self._db()
        db.execute("PRAGMA journal_mode=WAL")
        db.executescript(SCHEMA)

    def _db(self):
        db = getattr(self._local, "db", None)
        if db is None:
            db = sqlite3.connect(self.path, timeout=10, isolation_level=None)
            db.row_factory = sqlite3.Row
            self._local.db = db
        return db

    def get(self, username):
        return self._db().execute(
            "SELECT * FROM players WHERE username = ?", (username,)).fetchone()

    def register(self, username, profile):
        err = validate(username)
        if err:
            return {"ok": False, "error": err}
        u = username.strip()
        key = secrets.token_urlsafe(24)
        try:
            self._db().execute(
                "INSERT INTO players (username, profile, key_hash, created_at) VALUES (?, ?, ?, ?)",
                (u, json.dumps(profile or {}, ensure_ascii=False), _hash(key), time.time()))
        except sqlite3.IntegrityError:
            # COLLATE NOCASE pada kunci utama: "Iqbal" dan "iqbal" orang yang sama,
            # supaya tidak ada dua nama yang terbaca sama tapi berbeda pemilik.
            return {"ok": False, "error": f"Username \"{u}\" sudah dipakai. Coba yang lain."}
        return {"ok": True, "username": u, "key": key}

    def resume(self, username):
        err = validate(username)
        if err:
            return {"ok": False, "error": err}
        row = self.get(username.strip())
        if not row:
            return {"ok": False, "error": "Username itu belum terdaftar."}
        # Melanjutkan permainan menerbitkan kunci sesi baru dan mencabut yang
        # lama. Ini BUKAN pembuktian identitas — tanpa kata sandi siapa pun bisa
        # melakukannya — tapi ia menutup penulisan simpanan langsung ke API oleh
        # yang sekadar menebak username, dan pemilik sah akan melihat sesinya
        # tiba-tiba ditolak menyimpan kalau ada yang mengambil alih.
        key = secrets.token_urlsafe(24)
        self._db().execute("UPDATE players SET key_hash = ? WHERE username = ?",
                           (_hash(key), row["username"]))
        return {
            "ok": True,
            "username": row["username"],
            "key": key,
            "profile": json.loads(row["profile"] or "{}"),
            "save": json.loads(row["save"]) if row["save"] else None,
        }

    def store(self, username, key, profile, save):
        err = validate(username)
        if err:
            return {"ok": False, "error": err}
        if not isinstance(save, dict):
            return {"ok": False, "error": "Bentuk simpanan salah."}
        blob = json.dumps(save, ensure_ascii=False)
        if len(blob) > MAX_SAVE:
            return {"ok": False, "error": "Simpanan terlalu besar."}
        row = self.get(username.strip())
        if not row:
            return {"ok": False, "error": "Username itu belum terdaftar."}
        # compare_digest, bukan ==: perbandingan string biasa berhenti di karakter
        # pertama yang beda, dan selisih waktunya bisa dipakai menebak kunci.
        if not row["key_hash"] or not secrets.compare_digest(row["key_hash"], _hash(key or "")):
            return {"ok": False, "error": "Sesi tidak sah. Muat ulang halaman."}
        self._db().execute(
            "UPDATE players SET profile = ?, save = ?, saved_at = ? WHERE username = ?",
            (json.dumps(profile or {}, ensure_ascii=False), blob, time.time(), row["username"]))
        return {"ok": True}


players = Players()


def handle(handler, method, path, query, body):
    """Tangani satu permintaan /api/player/*. True kalau sudah ditangani."""
    if not path.startswith("/api/player/"):
        return False
    if method != "POST":
        _send(handler, {"ok": False, "error": "Metode tidak didukung."}, 405)
        return True

    data, err = guard.parse_json(body)
    if err:
        _send(handler, {"ok": False, "error": err}, 400)
        return True

    action = path[len("/api/player/"):]
    ip = guard.client_ip(handler)
    bucket = {"check": "player_read", "resume": "player_read",
              "register": "player_create", "save": "player_write"}.get(action)
    blocked = guard.limiter.check(bucket, ip) if bucket else None
    if blocked:
        _send(handler, {"ok": False, "error": blocked}, 429)
        return True

    username = guard.text_field(data, "username", 32)

    if action == "check":
        err = validate(username)
        if err:
            _send(handler, {"ok": True, "available": False, "reason": err})
        elif players.get(username.strip()):
            _send(handler, {"ok": True, "available": False,
                            "reason": f"Username \"{username.strip()}\" sudah dipakai."})
        else:
            _send(handler, {"ok": True, "available": True, "reason": ""})
        return True

    if action == "register":
        r = players.register(username, data.get("profile"))
        _send(handler, r, 200 if r["ok"] else 409)
        return True

    if action == "resume":
        r = players.resume(username)
        _send(handler, r, 200 if r["ok"] else 404)
        return True

    if action == "save":
        r = players.store(username, guard.text_field(data, "key", 128),
                          data.get("profile"), data.get("save"))
        _send(handler, r, 200 if r["ok"] else 403)
        return True

    _send(handler, {"ok": False, "error": "Tidak dikenal."}, 404)
    return True


_send = guard.send
