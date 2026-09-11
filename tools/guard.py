"""Penjaga untuk seluruh endpoint API: batas laju per-IP dan pemeriksaan bentuk.

Kenapa per-IP dan bukan per-token: `token` dibuat sendiri oleh peramban dan
dikirim apa adanya, jadi siapa pun yang ingin membanjiri server tinggal
mengarang token baru tiap permintaan. Batas per-token tetap ada karena berguna
untuk mengerem pemain sungguhan yang menahan tombol kirim, tapi yang benar-benar
menahan penyalahgunaan adalah batas per-IP di sini.

Ini bukan pengganti autentikasi. Tanpa kata sandi, tidak ada satu pun lapisan di
sini yang bisa membuktikan seseorang benar pemilik username tertentu — yang bisa
dilakukan hanya membuat penyalahgunaan jadi mahal dan berisik.
"""
import json
import threading
import time

# (jendela detik, maksimal permintaan) per kunci
RULES = {
    "chat_poll":      [(60, 150), (3600, 3000)],
    "chat_post":      [(60, 25), (3600, 400)],
    "player_read":    [(60, 30), (3600, 300)],
    "player_write":   [(60, 20), (3600, 200)],
    "player_create":  [(3600, 8), (86400, 25)],
}

MAX_BODY = 512 * 1024      # 512 KB; simpanan permainan yang wajar jauh di bawah ini


class RateLimiter:
    """Penghitung jendela geser sederhana, di memori dan per proses.

    Batas laju memang pantas hilang saat server dimatikan — ia melindungi dari
    banjir yang sedang berlangsung, bukan menyimpan riwayat pelanggaran.
    """

    def __init__(self, rules=RULES):
        self.rules = rules
        self.hits = {}                 # (bucket, ip) -> [timestamp, ...]
        self.lock = threading.Lock()
        self._swept = 0.0

    def check(self, bucket, ip):
        """None kalau boleh lanjut, atau pesan kesalahan kalau sudah kelewat."""
        rules = self.rules.get(bucket)
        if not rules:
            return None
        now = time.time()
        widest = max(w for w, _ in rules)
        key = (bucket, ip)
        with self.lock:
            self._sweep(now)
            stamps = [t for t in self.hits.get(key, ()) if t > now - widest]
            for window, limit in rules:
                if sum(1 for t in stamps if t > now - window) >= limit:
                    return f"Terlalu banyak permintaan. Coba lagi sebentar lagi."
            stamps.append(now)
            self.hits[key] = stamps
        return None

    def _sweep(self, now):
        """Buang kunci yang sudah lama diam supaya dict tidak tumbuh selamanya."""
        if now - self._swept < 300:
            return
        self._swept = now
        for key, stamps in list(self.hits.items()):
            widest = max(w for w, _ in self.rules[key[0]])
            if not stamps or stamps[-1] < now - widest:
                del self.hits[key]


limiter = RateLimiter()


def client_ip(handler):
    """Alamat pemanggil. Di belakang proxy, header X-Forwarded-For yang benar."""
    fwd = handler.headers.get("X-Forwarded-For")
    if fwd:
        return fwd.split(",")[0].strip()
    return handler.client_address[0] if handler.client_address else "?"


def parse_json(body, limit=MAX_BODY):
    """(data, error). Menolak apa pun yang bukan objek JSON."""
    if body is None:
        return {}, None
    if len(body) > limit:
        return None, "Permintaan terlalu besar."
    if not body:
        return {}, None
    try:
        data = json.loads(body)
    except (ValueError, UnicodeDecodeError):
        return None, "Permintaan tidak terbaca."
    if not isinstance(data, dict):
        return None, "Bentuk permintaan salah."
    return data, None


def text_field(data, key, limit):
    """Ambil satu field string, dipotong panjangnya. Tipe lain jadi string kosong."""
    v = data.get(key)
    return v[:limit] if isinstance(v, str) else ""


def send(handler, payload, status=200):
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(body)))
    handler.send_header("X-Content-Type-Options", "nosniff")
    handler.end_headers()
    handler.wfile.write(body)
