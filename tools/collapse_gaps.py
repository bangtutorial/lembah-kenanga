"""Remove fully transparent horizontal bands inside an object (e.g. a roof the
model drew floating above its wall). Rows with no opaque pixels between the
object's top and bottom are deleted, pulling the parts together; the canvas
height is kept and the object stays bottom-anchored.

Usage: python tools/collapse_gaps.py in.png out.png [--min-gap 4]
"""
import argparse
import numpy as np
from PIL import Image


def collapse(img: Image.Image, min_gap=4):
    arr = np.array(img.convert("RGBA"))
    rows = (arr[..., 3] > 0).any(1)
    ys = np.where(rows)[0]
    if len(ys) == 0:
        return img, 0
    y0, y1 = ys.min(), ys.max()
    keep = np.ones(arr.shape[0], bool)
    gap = 0
    for y in range(y0, y1 + 1):
        if rows[y]:
            if gap >= min_gap:
                keep[y - gap:y] = False
            gap = 0
        else:
            gap += 1
    removed = int((~keep).sum())
    out = np.vstack([np.zeros((removed, arr.shape[1], 4), np.uint8), arr[keep]])
    return Image.fromarray(out), removed


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("dst")
    ap.add_argument("--min-gap", type=int, default=4)
    a = ap.parse_args()
    out, removed = collapse(Image.open(a.src), a.min_gap)
    out.save(a.dst)
    print(f"ok removed {removed} gap rows")


if __name__ == "__main__":
    main()
