"""Pecah satu gambar gauge memancing jadi tiga keping siap pakai.

Model menggambar ketiganya berdampingan dalam satu gambar (hemat kredit), tapi
ukurannya berbeda-beda sehingga `slice_grid.py` yang memakai sel seragam tidak
cocok. Skrip ini memisahkannya lewat celah kolom transparan, lalu:

- keping 1 -> `fishing_track.png`, rangka kosong tempat ikan bergerak
- keping 2 -> `fishing_zone.png`, batang hijau yang dikendalikan pemain
- keping 3 -> `fishing_fill.png`, HANYA bagian amber-nya

Keping ketiga dipotong karena kapsul aslinya digambar terisi sekitar 70 %.
Kalau dipakai apa adanya, bar kemajuan tidak akan pernah terlihat penuh dan
tidak akan pernah terlihat kosong — isinya sudah terpanggang di gambar. Yang
dibutuhkan kode hanya badan ambernya, lalu tingginya diatur saat menggambar.

Usage: python tools/build_fishing_ui.py
"""
import os

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets/_raw/ui/fishing_ui_keyed.png")
OUT = os.path.join(ROOT, "assets/sprites/ui")

TARGET = {"track": (28, 176), "zone": (28, 44), "fill": (16, 160)}


def columns_with_pixels(alpha, gap=8):
    """Rentang kolom yang berisi piksel, dipisah oleh celah kosong >= gap."""
    filled = (alpha > 0).any(0)
    runs, start = [], None
    empty = 0
    for x, on in enumerate(filled):
        if on:
            if start is None:
                start = x
            empty = 0
        elif start is not None:
            empty += 1
            if empty >= gap:
                runs.append((start, x - empty))
                start = None
    if start is not None:
        runs.append((start, len(filled) - 1))
    return runs


def crop(img, x0, x1):
    a = np.array(img)[:, x0:x1 + 1]
    ys = np.where((a[..., 3] > 0).any(1))[0]
    xs = np.where((a[..., 3] > 0).any(0))[0]
    return Image.fromarray(a[ys.min():ys.max() + 1, xs.min():xs.max() + 1])


def amber_only(piece):
    """Baris-baris kapsul yang isinya oranye, bukan krem."""
    a = np.array(piece).astype(np.int16)
    r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    warm = (al > 0) & (r > 150) & (g > 80) & (g < 200) & (b < 110) & (r - b > 90)
    rows = np.where(warm.sum(1) > warm.shape[1] * 0.3)[0]
    if len(rows) < 8:
        return piece
    return piece.crop((0, rows.min(), piece.width, rows.max() + 1))


def main():
    img = Image.open(SRC).convert("RGBA")
    runs = columns_with_pixels(np.array(img)[..., 3])
    assert len(runs) == 3, f"harus ada 3 keping, ketemu {len(runs)}"
    track, zone, capsule = (crop(img, a, b) for a, b in runs)
    capsule = amber_only(capsule)

    os.makedirs(OUT, exist_ok=True)
    for name, piece in (("track", track), ("zone", zone), ("fill", capsule)):
        w, h = TARGET[name]
        out = piece.resize((w, h), Image.NEAREST)
        path = os.path.join(OUT, f"fishing_{name}.png")
        out.save(path)
        print(f"ok {path} ({w}x{h}, dari {piece.width}x{piece.height})")


if __name__ == "__main__":
    main()
