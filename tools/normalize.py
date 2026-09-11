"""Normalize a single keyed (RGBA) object into a fixed canvas.

Crops to alpha bbox, scales (area-average) so the object fits --size (or so
its height == H with --fit height / width == W with --fit width), quantizes to
--max-colors with binary alpha, and places it by --pivot.

Usage:
  python tools/normalize.py in.png out.png --size 160x160 --pivot bottom-center [--fit contain|height|width] [--max-colors 48]
"""
import argparse
import sys
import os
import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
from slice_grid import bbox, pixelize  # noqa: E402


def normalize(img, W, H, pivot="bottom-center", fit="contain", max_colors=48):
    img = img.convert("RGBA")
    bb = bbox(np.array(img)[..., 3])
    obj = img.crop(bb)
    ow, oh = obj.size
    if fit == "height":
        s = H / oh
    elif fit == "width":
        s = W / ow
    else:
        s = min(W / ow, H / oh)
    nw, nh = max(1, round(ow * s)), max(1, round(oh * s))
    small = pixelize(obj.resize((nw, nh), Image.BOX), max_colors)
    canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    vert, horiz = pivot.split("-") if "-" in pivot else (pivot, "center")
    x = {"left": 0, "center": (W - nw) // 2, "right": W - nw}[horiz]
    y = {"top": 0, "center": (H - nh) // 2, "bottom": H - nh}[vert]
    canvas.paste(small, (x, y))
    return canvas


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("dst")
    ap.add_argument("--size", required=True)
    ap.add_argument("--pivot", default="bottom-center")
    ap.add_argument("--fit", default="contain", choices=["contain", "height", "width"])
    ap.add_argument("--max-colors", type=int, default=48)
    a = ap.parse_args()
    W, H = map(int, a.size.lower().split("x"))
    out = normalize(Image.open(a.src), W, H, a.pivot, a.fit, a.max_colors)
    out.save(a.dst)
    print(f"ok {a.dst} {out.size}")


if __name__ == "__main__":
    main()
