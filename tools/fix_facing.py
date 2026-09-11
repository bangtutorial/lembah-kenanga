"""Perbaiki BARIS yang digambar menghadap arah yang salah.

`slice_grid.py --fix-flips` menangani satu frame yang terbalik di tengah barisnya
— ia membandingkan tiap frame dengan frame diam di baris yang sama. Yang tidak
bisa ia tangkap: satu baris penuh digambar menghadap arah yang keliru, karena di
dalam baris itu sendiri semuanya konsisten dan tidak ada yang terlihat janggal.

Akibatnya di layar: karakter berjalan ke kanan sambil menghadap ke kiri.

Deteksinya membandingkan frame diam baris kiri dengan frame diam baris kanan:

- kalau keduanya mirip **apa adanya**, baris kanan digambar menghadap kiri juga
  dan seluruh barisnya perlu dicerminkan;
- kalau keduanya mirip **setelah salah satu dicerminkan**, arahnya sudah benar.

    python tools/fix_facing.py              # periksa semua, laporkan saja
    python tools/fix_facing.py --apply      # perbaiki yang salah
    python tools/fix_facing.py player_m2 --apply
"""
import argparse
import glob
import os

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHARS = os.path.join(ROOT, "assets/sprites/characters")
LEFT_ROW, RIGHT_ROW = 1, 2


def _diff(a, b):
    """Selisih warna rata-rata di piksel yang salah satunya tidak transparan."""
    a = a.astype(int)
    b = b.astype(int)
    mask = (a[..., 3] > 0) | (b[..., 3] > 0)
    if not mask.any():
        return 999.0
    return float(np.abs(a[..., :3] - b[..., :3])[mask].mean())


def inspect(path, cols=4, rows=4):
    im = Image.open(path).convert("RGBA")
    a = np.array(im)
    ch, cw = im.height // rows, im.width // cols
    left = a[LEFT_ROW * ch:(LEFT_ROW + 1) * ch, 0:cw]
    right = a[RIGHT_ROW * ch:(RIGHT_ROW + 1) * ch, 0:cw]
    same = _diff(left, right)
    mirrored = _diff(left, right[:, ::-1])
    return im, a, ch, cw, same, mirrored


def fix(path, apply=False):
    im, a, ch, cw, same, mirrored = inspect(path)
    wrong = same < mirrored
    if wrong and apply:
        r0, r1 = RIGHT_ROW * ch, (RIGHT_ROW + 1) * ch
        a[r0:r1] = a[r0:r1, ::-1]
        Image.fromarray(a).save(path)
        # tulis ulang juga potongan per frame supaya sheet dan frame tetap sama
        name = os.path.basename(os.path.dirname(path))
        for c in range(a.shape[1] // cw):
            cell = a[r0:r1, c * cw:(c + 1) * cw]
            Image.fromarray(cell).save(os.path.join(os.path.dirname(path), f"{name}_r{RIGHT_ROW}c{c}.png"))
    return wrong, same, mirrored


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("names", nargs="*")
    ap.add_argument("--apply", action="store_true", help="cerminkan baris yang salah arah")
    args = ap.parse_args()

    for d in sorted(glob.glob(os.path.join(CHARS, "*/"))):
        n = os.path.basename(os.path.normpath(d))
        if args.names and n not in args.names:
            continue
        p = os.path.join(d, f"{n}_sheet.png")
        if not os.path.exists(p):
            continue
        wrong, same, mirrored = fix(p, args.apply)
        tag = ("DIPERBAIKI" if args.apply else "SALAH ARAH") if wrong else "ok"
        print(f"{n:12s} {tag:11s} (apa adanya {same:5.1f} vs dicerminkan {mirrored:5.1f})")


if __name__ == "__main__":
    main()
