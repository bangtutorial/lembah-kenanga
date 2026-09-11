"""Hapus rumput/bayangan hijau yang ikut terpanggang di kaki sprite karakter.

Nano Banana Pro sering menggambar seberkas rumput di bawah sepatu. Warnanya
bukan chroma #00FF00 melainkan hijau rumput biasa, jadi `chroma_key.py`
melewatkannya — dan karena berada di bawah garis sepatu, `--auto-bbox` ikut
menghitungnya sehingga baseline sprite melorot beberapa piksel.

Skrip ini bekerja pada sheet yang SUDAH di-key, sebelum dipotong: untuk tiap sel
grid, hanya pita bawah yang disapu (setinggi `--band` dari tinggi sel), lalu
piksel yang hijaunya dominan dibuang. Membatasi ke pita bawah penting supaya
pakaian berwarna hijau — gaun Rani, misalnya — tidak ikut terhapus.

  python tools/strip_grass.py in_keyed.png out.png --cols 4 --rows 4
"""
import argparse
import numpy as np
from PIL import Image


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("dst")
    ap.add_argument("--cols", type=int, default=4)
    ap.add_argument("--rows", type=int, default=4)
    ap.add_argument("--band", type=float, default=0.24, help="tinggi pita bawah sel yang disapu")
    ap.add_argument("--margin", type=int, default=24, help="selisih minimum G atas R dan B")
    args = ap.parse_args()

    im = Image.open(args.src).convert("RGBA")
    a = np.array(im).astype(np.int16)
    h, w = a.shape[:2]
    ch, cw = h // args.rows, w // args.cols

    r, g, b, alpha = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    greenish = (g - r > args.margin) & (g - b > args.margin) & (alpha > 0)

    band = np.zeros((h, w), bool)
    for row in range(args.rows):
        y1 = (row + 1) * ch
        y0 = int(y1 - ch * args.band)
        band[y0:y1, :] = True

    kill = greenish & band
    a[..., 3] = np.where(kill, 0, alpha)
    Image.fromarray(a.astype(np.uint8), "RGBA").save(args.dst)
    print(f"ok {args.dst} — {int(kill.sum())} piksel rumput dihapus")


if __name__ == "__main__":
    main()
