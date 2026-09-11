"""Buat varian warna sebuah tile terrain dari tile yang sudah ada.

Dipakai saat dua permukaan harus **sekeluarga tapi bisa dibedakan** — tanah
kebun dan tanah jalan, misalnya. Menggenerate tile kedua dari nol memberi
tekstur yang tidak sekeluarga, dan itu justru terbaca sebagai dua bahan berbeda,
bukan dua petak dari bahan yang sama.

Tingkat terang dinyatakan sebagai target, bukan faktor pengali, supaya urutan
terangnya bisa direncanakan langsung: rumput 138, jalan 132, kebun 118,
tercangkul 107, tercangkul basah 38. Angka-angka itu yang menentukan apakah
mencangkul membuat tanah terlihat lebih gelap — dan memang seharusnya begitu.

    python tools/tint_tile.py dirt.png garden_soil.png --luma 118 --warm 0.88
"""
import argparse
import os

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TERRAIN = os.path.join(ROOT, "assets/sprites/terrain")


def luma(a):
    return 0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("dst")
    ap.add_argument("--luma", type=float, required=True, help="target rata-rata terang 0-255")
    ap.add_argument("--warm", type=float, default=1.0,
                    help="<1 mengurangi kehangatan: merah turun, biru naik")
    ap.add_argument("--gain", default="",
                    help="pengali per kanal 'r,g,b' sebelum terang disetel, mis. 1.7,1.15,0.5")
    ap.add_argument("--desat", type=float, default=0.0,
                    help="0..1 menarik tiap piksel ke abu-abunya sendiri; 1 = tanpa warna sama sekali")
    ap.add_argument("--flatten", type=float, default=0.0,
                    help="0..1 menarik tiap piksel ke warna rata-rata tile; meredam kontras")
    a = ap.parse_args()

    img = Image.open(os.path.join(TERRAIN, a.src)).convert("RGBA")
    arr = np.array(img).astype(float)
    rgb = arr[..., :3]

    # Hilangkan warnanya dulu kalau diminta. Untuk salju di atas rumput, ini
    # operasi yang benar: teksturnya tetap tekstur tanah berumput, yang hilang
    # hanya hijaunya. Menaikkan kanal merah dan biru untuk "memutihkan" hijau
    # justru menghasilkan merah muda — kanal hijaunya jauh lebih tinggi dari
    # dua lainnya, jadi mengalikannya tidak pernah bertemu di putih.
    if a.desat > 0:
        grey = luma(rgb)[..., None]
        rgb += (grey - rgb) * a.desat

    # Geser warnanya lebih dulu, baru terangnya disetel — kalau dibalik,
    # pergeseran warna ikut mengubah terang dan targetnya meleset.
    if a.gain:
        g = [float(v) for v in a.gain.split(",")]
        for i in range(3):
            rgb[..., i] *= g[i]
    if a.warm != 1.0:
        rgb[..., 0] *= a.warm
        rgb[..., 2] *= 2 - a.warm

    # Meredam kontras dilakukan setelah warnanya diatur dan sebelum terang
    # disetel. Untuk salju ini penting: permukaannya memang nyaris rata, dan
    # tekstur yang menonjol membuat pola ubinnya langsung terbaca sebagai
    # kotak-kotak berulang di seluruh peta.
    if a.flatten > 0:
        rgb += (rgb.reshape(-1, 3).mean(0) - rgb) * a.flatten

    cur = luma(rgb).mean()
    rgb *= (a.luma / max(1.0, cur))

    arr[..., :3] = np.clip(rgb, 0, 255)
    out = Image.fromarray(arr.astype(np.uint8))
    out.save(os.path.join(TERRAIN, a.dst))
    print(f"ok {a.dst} — terang {cur:.0f} -> {luma(np.array(out).astype(float)).mean():.0f}")


if __name__ == "__main__":
    main()
