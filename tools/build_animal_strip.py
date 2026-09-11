"""Susun strip animasi hewan dari gambar yang tata letaknya tidak seragam.

`slice_grid.py` memotong dengan grid tetap. Untuk strip hewan itu tidak cukup:
model kerap memecah delapan frame yang diminta menjadi dua baris berisi empat,
dan sesekali menyelipkan satu frame berlebih. Grid tetap akan salah potong pada
keduanya.

Skrip ini mencari tiap objek lewat celah transparan — baris dulu, lalu kolom di
dalam baris — sehingga jumlah baris dan jumlah objek per baris tidak perlu
diketahui sebelumnya. Objek dibaca urut kiri-ke-kanan lalu atas-ke-bawah, persis
urutan yang diminta di prompt, lalu disusun ulang jadi satu baris.

Semua frame diskalakan dengan SATU faktor yang sama supaya hewannya tidak
berubah ukuran di tengah animasi, dan ditempel dengan jangkar bawah-tengah
supaya kakinya menapak di garis yang sama.

    python tools/build_animal_strip.py cow8_keyed.png cow --cell 60x40
    python tools/build_animal_strip.py chicken8_keyed.png chicken --cell 26x24 --keep 0,2,3,4,5,6,7,8
    python tools/build_animal_strip.py chicken8_keyed.png chicken --cell 26x24 --dump
"""
import argparse
import os

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def bands(mask, gap):
    """Rentang indeks yang berisi piksel, dipisah celah kosong >= gap."""
    out, start, empty = [], None, 0
    for i, on in enumerate(mask):
        if on:
            if start is None:
                start = i
            empty = 0
        elif start is not None:
            empty += 1
            if empty >= gap:
                out.append((start, i - empty))
                start = None
    if start is not None:
        out.append((start, len(mask) - 1))
    return out


def strip_grass(cell, band=0.22, margin=24):
    """Hapus rumput yang terpanggang di bawah kaki.

    Warnanya hijau rumput biasa, bukan chroma, jadi `chroma_key.py` melewatkannya.
    Hanya pita bawah tiap frame yang disapu supaya bagian tubuh yang kebetulan
    kehijauan tidak ikut hilang.
    """
    a = np.array(cell).astype(np.int16)
    h = a.shape[0]
    y0 = int(h * (1 - band))
    r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    green = (g - r > margin) & (g - b > margin) & (al > 0)
    green[:y0] = False
    a[..., 3] = np.where(green, 0, al)
    out = Image.fromarray(a.astype(np.uint8))
    # potong ulang: membuang rumput bisa menyisakan baris kosong di bawah
    arr = np.array(out)
    ys = np.where((arr[..., 3] > 0).any(1))[0]
    xs = np.where((arr[..., 3] > 0).any(0))[0]
    if not len(ys):
        return out
    return Image.fromarray(arr[ys.min():ys.max() + 1, xs.min():xs.max() + 1])


def find_frames(img, gap=20):
    a = np.array(img)
    out = []
    for y0, y1 in bands((a[..., 3] > 0).any(1), gap):
        strip = a[y0:y1 + 1]
        for x0, x1 in bands((strip[..., 3] > 0).any(0), gap):
            cell = strip[:, x0:x1 + 1]
            ys = np.where((cell[..., 3] > 0).any(1))[0]
            xs = np.where((cell[..., 3] > 0).any(0))[0]
            out.append(strip_grass(Image.fromarray(cell[ys.min():ys.max() + 1, xs.min():xs.max() + 1])))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src", help="berkas di assets/_raw/animals/")
    ap.add_argument("name", help="nama sprite, mis. cow")
    ap.add_argument("--cell", default="32x32", help="ukuran sel keluaran, mis. 60x40")
    ap.add_argument("--keep", default="", help="indeks frame yang dipakai, mis. 0,2,3,4,5,6,7,8")
    ap.add_argument("--dump", action="store_true", help="simpan pratinjau bernomor lalu berhenti")
    ap.add_argument("--flip", action="store_true",
                    help="cerminkan semua frame; dipakai kalau model menggambar hewannya menghadap kanan")
    a = ap.parse_args()

    src = os.path.join(ROOT, "assets/_raw/animals", a.src)
    frames = find_frames(Image.open(src).convert("RGBA"))
    print(f"{len(frames)} frame terdeteksi")

    if a.dump:
        z = 3
        w = sum(f.width for f in frames) * z + 10 * len(frames)
        h = max(f.height for f in frames) * z + 24
        sheet = Image.new("RGBA", (w, h), (40, 40, 48, 255))
        x = 0
        for i, f in enumerate(frames):
            big = f.resize((f.width * z, f.height * z), Image.NEAREST)
            sheet.paste(big, (x, 24), big)
            x += big.width + 10
        out = os.path.join(ROOT, "assets/_raw/animals", f"_{a.name}_frames.png")
        sheet.save(out)
        print("pratinjau:", out, "(nomor frame urut dari 0, kiri ke kanan)")
        return

    if a.keep:
        idx = [int(i) for i in a.keep.split(",")]
        frames = [frames[i] for i in idx]

    # Semua sheet hewan menghadap KIRI; sisi kanan dicerminkan saat menggambar.
    # Kalau satu sheet saja menyimpang, hewannya berjalan mundur — dan konvensi
    # campur jauh lebih sulit ditemukan daripada satu flag di sini.
    if a.flip:
        frames = [f.transpose(Image.FLIP_LEFT_RIGHT) for f in frames]

    cw, ch = (int(v) for v in a.cell.split("x"))
    # satu faktor untuk semua frame: hewannya tidak boleh berubah ukuran di
    # tengah animasi hanya karena satu pose kebetulan lebih tinggi
    scale = min(cw / max(f.width for f in frames), ch / max(f.height for f in frames))

    sheet = Image.new("RGBA", (cw * len(frames), ch), (0, 0, 0, 0))
    for i, f in enumerate(frames):
        w, h = max(1, round(f.width * scale)), max(1, round(f.height * scale))
        small = f.resize((w, h), Image.NEAREST)
        sheet.paste(small, (i * cw + (cw - w) // 2, ch - h), small)

    outdir = os.path.join(ROOT, "assets/sprites/animals", a.name)
    os.makedirs(outdir, exist_ok=True)
    sheet.save(os.path.join(outdir, f"{a.name}_sheet.png"))
    for i in range(len(frames)):
        sheet.crop((i * cw, 0, (i + 1) * cw, ch)).save(os.path.join(outdir, f"{a.name}_{i}.png"))
    print(f"ok {len(frames)} frame -> {a.name}_sheet.png ({cw * len(frames)}x{ch})")


if __name__ == "__main__":
    main()
