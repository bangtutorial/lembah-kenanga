"""Slice the 6-frame fountain strip into an engine-ready sprite sheet.

The generated frames share one basin but differ in total height (the jet grows),
so a per-frame "fit to canvas" would make the stone bob up and down. Instead a
single scale is derived from the widest BASIN and every frame is placed with the
same bottom baseline.

Baseline yang sama saja ternyata belum cukup. Modelnya menggambar ulang
batunya di setiap frame: tepi kolam bergeser satu piksel, balok-baloknya tidak
persis di tempat yang sama, lebar tiangnya berubah. Diputar delapan frame per
detik, air mancurnya jadi terlihat berdenyut. Karena itu ada tahap kedua,
`lock_stone`: batu diambil dari SATU frame saja, dan yang boleh berganti tiap
frame hanya airnya — riak di dalam kolam dan pancaran di atas tiang.

Pelajarannya berlaku umum untuk aset animasi hasil generate: yang diam harus
dikunci di kode, bukan diharapkan konsisten dari modelnya.

Canvas: 128x176 (4 tiles wide, basin footprint 4x2; the jet overhangs upward).

Usage: python tools/build_fountain.py
"""
import json
import os
import sys
import numpy as np
from PIL import Image
from scipy import ndimage

sys.path.insert(0, os.path.dirname(__file__))
from slice_grid import spans, largest_n, bbox, pixelize  # noqa: E402

SRC = "assets/_raw/buildings/fountain_gpt6_keyed.png"
OUT = "assets/sprites/buildings/fountain.png"
FRAMES = 6
W, H = 128, 176          # 4 tiles wide; tall enough for the highest jet
BASIN_TARGET = 122       # basin spans just under 4 tiles so it sits inside them


BASE_FRAME = 0        # frame air tenang; batunya yang dipakai untuk semua frame
WATER_BR = 30         # air kebiruan: biru minus merah minimal segini
                      # (batu abu-abu paling jauh hanya sampai ~26 di garis gelapnya)


def disk(r):
    y, x = np.ogrid[-r:r + 1, -r:r + 1]
    return x * x + y * y <= r * r


def blue(cell):
    """Piksel air yang jelas kebiruan. Inti putih pancaran TIDAK termasuk."""
    a = np.array(cell).astype(int)
    return (a[..., 3] > 0) & (a[..., 2] - a[..., 0] >= WATER_BR)


def close(mask, r):
    """
    Tutup celah tipis di dalam sebuah wilayah.

    Air dikenali dari birunya, padahal sorotan riak dan inti pancaran hampir
    putih — sama tak berwarnanya dengan batu. Menambal celahnya lebih aman
    daripada melonggarkan ambang warna, karena melonggarkan ambang akan mulai
    menarik garis gelap di sela balok batu ikut terhitung sebagai air.
    """
    return ndimage.binary_closing(mask, disk(r), border_value=0)


def biggest(mask):
    lab, n = ndimage.label(mask)
    if n == 0:
        return mask
    sizes = ndimage.sum(mask, lab, range(1, n + 1))
    return lab == (int(np.argmax(sizes)) + 1)


def jet_region(cell, rim_top):
    """
    Pancaran air dan percikannya: gumpalan air yang menjulur ke atas tepi kolam.

    Diambil sebagai komponen tersambung, bukan sebagai kotak koordinat, supaya
    pancaran yang melebar di frame puncak tetap utuh tanpa ikut menyeret satu
    piksel pun batu tepi kolam.
    """
    lab, n = ndimage.label(blue(cell))
    keep = np.zeros(n + 1, bool)
    for i in range(1, n + 1):
        keep[i] = np.where(lab == i)[0].min() < rim_top
    return close(keep[lab], 3)


def pool_region(cell):
    """Permukaan air di dalam tepi kolam, tanpa tiang di tengahnya."""
    lab, n = ndimage.label(blue(cell))
    sizes = ndimage.sum(blue(cell), lab, range(1, n + 1))
    pool = lab == (int(np.argmax(sizes)) + 1)
    # Jari-jari 4 cukup untuk menyambung garis riak yang tebalnya 1-2 piksel,
    # dan masih jauh lebih kecil daripada tiang, jadi tiangnya tidak ikut
    # tertutup dan tetap diambil dari frame acuan.
    return close(pool, 4)


def lock_stone(sheet):
    """
    Bekukan batunya: tiap frame memakai batu milik `BASE_FRAME`, dan hanya
    airnya yang berganti.

    Riak dibatasi ke permukaan kolam milik frame acuan, jadi tepi kolam tidak
    pernah bergeser walau frame aslinya menggambarnya sedikit berbeda. Di atas
    tepi kolam tidak ada apa-apa selain air, jadi bagian itu diambil apa adanya.
    """
    cells = [sheet.crop((i * W, 0, (i + 1) * W, H)) for i in range(FRAMES)]
    base = cells[BASE_FRAME]
    base_a = np.array(base)

    rows = (base_a[..., 3] > 0).sum(1)
    rim_top = int(np.argmax(rows > 20))          # baris pertama tepi kolam terlihat
    above = np.zeros(base_a.shape[:2], bool)
    above[:rim_top] = True
    pool = pool_region(base) & ~above
    base_jet = jet_region(base, rim_top)

    out = Image.new("RGBA", sheet.size, (0, 0, 0, 0))
    for i, cell in enumerate(cells):
        arr = np.array(cell)
        canvas = base_a.copy()
        canvas[above | base_jet] = 0             # air frame acuan dibuang dulu
        move = above | pool | jet_region(cell, rim_top)
        canvas[move] = arr[move]
        gap = ~above & (canvas[..., 3] == 0) & (base_a[..., 3] > 0)
        canvas[gap] = base_a[gap]                # tak ada lubang yang tertinggal
        out.paste(Image.fromarray(canvas), (i * W, 0))
        print(f"  frame {i + 1}: air {int(move.sum())} piksel"
              + ("  <- batu acuan" if i == BASE_FRAME else ""))
    return out


def main():
    im = Image.open(SRC).convert("RGBA")
    a = np.array(im)[..., 3]
    cols = largest_n(spans(a.sum(0), 8), FRAMES)
    if len(cols) != FRAMES:
        raise SystemExit(f"expected {FRAMES} frames, found {len(cols)}")

    cells, basins = [], []
    for c0, c1 in cols:
        cell = im.crop((c0, 0, c1, im.height))
        cell = cell.crop(bbox(np.array(cell)[..., 3]))
        alpha = np.array(cell)[..., 3]
        widths = [(alpha[y] > 0).sum() for y in range(alpha.shape[0])]
        basins.append(max(widths[len(widths) // 2:]))   # widest row in the lower half
        cells.append(cell)

    scale = BASIN_TARGET / max(basins)
    sheet = Image.new("RGBA", (W * FRAMES, H), (0, 0, 0, 0))
    for i, cell in enumerate(cells):
        nw, nh = max(1, round(cell.width * scale)), max(1, round(cell.height * scale))
        small = pixelize(cell.resize((nw, nh), Image.BOX), 28)
        frame = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        frame.paste(small, ((W - nw) // 2, H - nh))     # shared bottom baseline
        sheet.paste(frame, (i * W, 0))
        print(f"  frame {i + 1}: {nw}x{nh}")
    sheet = lock_stone(sheet)
    sheet.save(OUT)
    print(f"ok {OUT} {sheet.size} ({FRAMES} frames, scale {scale:.3f})")

    for path, patch in (
        ("assets/manifest.json", lambda d: d["sprites"].__setitem__("fountain", {
            "file": "sprites/buildings/fountain.png", "frame": [W, H], "cols": FRAMES, "rows": 1,
            "fps": 8, "pivot": "bottom-center", "animated": True, "status": "approved"})),
        ("assets/scale.json", lambda d: d.__setitem__("fountain", {
            "px": [W, H], "tiles": [4, 5.5], "anchor": "bottom-center", "faces": "none",
            "footprint": [4, 2], "frames": FRAMES, "fps": 8,
            "note": "pusat plaza; basin 4 tile, pancaran air menjulang ke atas"})),
    ):
        data = json.load(open(path, encoding="utf-8"))
        patch(data)
        json.dump(data, open(path, "w", encoding="utf-8"), indent=2, ensure_ascii=False)
    print("manifest + scale.json updated")


if __name__ == "__main__":
    main()
