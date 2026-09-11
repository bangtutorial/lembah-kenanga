"""Static dev server for the game, plus the public chat endpoint.

Plain `http.server` lets the browser cache ES modules, so edits silently do not
show up. This adds no-store headers and the right MIME types.

Usage:
    python tools/serve.py [port] [--host HOST] [--root DIR] [--cache SECONDS]

The default host is 127.0.0.1, so only this machine can reach it. Pass
`--host 0.0.0.0` to let others on the same network join the chat — that also
exposes every file under the project folder to the network, so only do it on a
network you trust.

`--root` menentukan folder yang disajikan, dan bawaannya akar projek. Itu benar
untuk bekerja — satu perintah, tanpa langkah membangun — tapi SALAH di server:
akar projek berisi `var/chat.db` (daftar username dan sidik kunci sesi), 435 MB
berkas mentah di `assets/_raw`, dan seluruh isi `tools/`. Di server, sajikan
keluaran `tools/publish.py`:

    python tools/publish.py
    python tools/serve.py 47311 --root dist --cache 3600

Balasan /api/ tidak pernah ikut di-cache berapa pun nilai `--cache`.
"""
import argparse
import http.server
import os
import socketserver
from urllib.parse import urlparse, parse_qs

import chat
import guard
import players

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".js": "text/javascript",
        ".mjs": "text/javascript",
        ".json": "application/json",
    }
    serve_root = ROOT
    cache_seconds = 0
    url_base = ""          # mis. "/lembah-kenanga" kalau dipasang di subfolder

    def __init__(self, *a, **kw):
        super().__init__(*a, directory=self.serve_root, **kw)

    # -- routing ------------------------------------------------------------
    def _rebase(self):
        """
        Buang awalan subfolder dari `self.path`.

        Di belakang Nginx, awalan itu sudah dipotong sebelum sampai ke sini.
        Tanpa Nginx — dan saat menguji pemasangan di subfolder — pemotongannya
        harus dilakukan sendiri, kalau tidak setiap jalur akan meleset satu
        tingkat dan /api/ tidak pernah cocok.

        Mengembalikan False kalau alamatnya di luar subfolder itu.
        """
        b = self.url_base
        if not b:
            return True
        if self.path == b:
            self.send_response(301)
            self.send_header("Location", b + "/")
            self.end_headers()
            return False
        if not self.path.startswith(b + "/"):
            self.send_error(404)
            return False
        self.path = self.path[len(b):]
        return True

    def _api(self, method):
        u = urlparse(self.path)
        if not u.path.startswith("/api/"):
            return False
        try:
            length = int(self.headers.get("Content-Length") or 0)
        except ValueError:
            length = 0
        # Ditolak SEBELUM dibaca: membaca dulu baru menolak berarti penyerang
        # tetap bisa memaksa server menampung berapa pun yang ia kirim.
        if length > guard.MAX_BODY:
            guard.send(self, {"ok": False, "error": "Permintaan terlalu besar."}, 413)
            return True
        body = self.rfile.read(length) if length else b""
        q = parse_qs(u.query)
        return chat.handle(self, method, u.path, q, body) or players.handle(self, method, u.path, q, body)

    def do_GET(self):
        if not self._rebase():
            return
        if self._api("GET"):
            return
        super().do_GET()

    def do_POST(self):
        if not self._rebase():
            return
        if not self._api("POST"):
            self.send_error(405)

    # -- headers ------------------------------------------------------------
    def end_headers(self):
        # Balasan API tidak pernah boleh disimpan: daftar pesan obrolan dan
        # keadaan simpanan pemain berubah setiap detik, dan sebagiannya milik
        # satu orang saja.
        if self.cache_seconds and not self.path.startswith("/api/"):
            self.send_header("Cache-Control", f"public, max-age={self.cache_seconds}")
        else:
            self.send_header("Cache-Control", "no-store, max-age=0")
            self.send_header("Pragma", "no-cache")
        super().end_headers()

    def log_message(self, fmt, *args):  # quieter output
        if "404" in (fmt % args):
            super().log_message(fmt, *args)


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("port", nargs="?", type=int, default=47311)
    ap.add_argument("--host", default="127.0.0.1",
                    help="0.0.0.0 supaya bisa diakses dari perangkat lain di jaringan yang sama")
    ap.add_argument("--root", default=ROOT,
                    help="folder yang disajikan; di server pakai keluaran tools/publish.py")
    ap.add_argument("--cache", type=int, default=0, metavar="DETIK",
                    help="umur cache berkas statis; 0 (bawaan) berarti tidak disimpan sama sekali")
    ap.add_argument("--base", default="", metavar="/subfolder",
                    help="kalau game dipasang di subfolder dan skrip ini yang melayaninya langsung "
                         "(tanpa Nginx di depannya)")
    args = ap.parse_args()

    Handler.serve_root = os.path.abspath(args.root)
    Handler.cache_seconds = max(0, args.cache)
    Handler.url_base = "/" + args.base.strip("/") if args.base.strip("/") else ""

    with Server((args.host, args.port), Handler) as httpd:
        where = "localhost" if args.host in ("127.0.0.1", "localhost") else args.host
        print(f"Lembah Kenanga: http://{where}:{args.port}{Handler.url_base}/  (root: {Handler.serve_root})")
        if Handler.serve_root == ROOT and args.host != "127.0.0.1":
            print("PERINGATAN: yang disajikan adalah akar projek — var/chat.db, assets/_raw,")
            print("            dan tools/ ikut terbuka. Di server, pakai --root dist.")
        httpd.serve_forever()
