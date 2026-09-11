"""Make a seamless 32x32 (or --size) terrain tile from a generated texture and
render a repeat preview to check seams.

Steps: center-crop to square, area-downscale to --size, quantize, then blend a
narrow band at the edges (wrap-around cross-fade) so the tile repeats without
a hard seam. Outputs the tile and a --repeat x --repeat preview at --zoom.

Usage:
  python tools/tile_check.py raw.png --out assets/sprites/terrain/grass_spring.png --size 32 --repeat 3 --zoom 4
"""
import argparse
import os
import sys
import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
from slice_grid import pixelize  # noqa: E402


def make_seamless(arr, band):
    """Wrap-around cross-fade over `band` pixels on each axis (arr: HxWx3 float)."""
    h, w, _ = arr.shape
    out = arr.copy()
    for i in range(band):
        t = (i + 1) / (band + 1)          # 0 -> hard edge, 1 -> far side
        out[:, i] = arr[:, i] * (0.5 + t / 2) + arr[:, w - 1 - i] * (0.5 - t / 2)
        out[:, w - 1 - i] = arr[:, w - 1 - i] * (0.5 + t / 2) + arr[:, i] * (0.5 - t / 2)
    arr2 = out.copy()
    for i in range(band):
        t = (i + 1) / (band + 1)
        out[i] = arr2[i] * (0.5 + t / 2) + arr2[h - 1 - i] * (0.5 - t / 2)
        out[h - 1 - i] = arr2[h - 1 - i] * (0.5 + t / 2) + arr2[i] * (0.5 - t / 2)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("--out", required=True)
    ap.add_argument("--size", type=int, default=32)
    ap.add_argument("--repeat", type=int, default=3)
    ap.add_argument("--zoom", type=int, default=4)
    ap.add_argument("--band", type=int, default=2)
    ap.add_argument("--max-colors", type=int, default=16)
    ap.add_argument("--crop", type=int, default=0, help="center-crop to this many source px first")
    ap.add_argument("--punch", type=float, default=1.0, help="amplify deviation from the median color")
    a = ap.parse_args()

    img = Image.open(a.src).convert("RGB")
    side = a.crop or min(img.size)
    x0, y0 = (img.width - side) // 2, (img.height - side) // 2
    sq = img.crop((x0, y0, x0 + side, y0 + side)).resize((a.size, a.size), Image.BOX)
    arr = np.array(sq).astype(np.float32)
    if a.punch != 1.0:
        med = np.median(arr.reshape(-1, 3), axis=0)
        arr = np.clip(med + (arr - med) * a.punch, 0, 255)
    if a.band > 0:
        arr = make_seamless(arr, a.band)
    rgba = Image.fromarray(np.dstack([arr.astype(np.uint8), np.full((a.size, a.size), 255, np.uint8)]))
    tile = pixelize(rgba, a.max_colors)
    os.makedirs(os.path.dirname(a.out) or ".", exist_ok=True)
    tile.save(a.out)

    n = a.repeat
    prev = Image.new("RGBA", (a.size * n, a.size * n))
    for j in range(n):
        for i in range(n):
            prev.paste(tile, (i * a.size, j * a.size))
    prev = prev.resize((prev.width * a.zoom, prev.height * a.zoom), Image.NEAREST)
    pv = os.path.splitext(a.out)[0] + f"_repeat{n}.png"
    prev.save(pv)
    print(f"ok {a.out} {tile.size}; preview {pv}")


if __name__ == "__main__":
    main()
