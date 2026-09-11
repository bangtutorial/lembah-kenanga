"""Remove a baked grass/ground strip the model drew under an object.

Looks at the bottom `--band` fraction of the object's bounding box and clears
pixels whose green channel dominates (grass) — the object's own colors stay.

Usage: python tools/strip_ground.py in.png out.png [--band 0.06] [--thr 25]
"""
import argparse
import numpy as np
from PIL import Image


def strip_ground(img: Image.Image, band=0.06, thr=25):
    arr = np.array(img.convert("RGBA"))
    ys = np.where(arr[..., 3] > 0)[0]
    if len(ys) == 0:
        return img, 0
    y0, y1 = ys.min(), ys.max()
    start = int(y1 - (y1 - y0) * band)
    sub = arr[start:y1 + 1]
    r, g, b = (sub[..., i].astype(int) for i in range(3))
    grass = (g - np.maximum(r, b)) > thr
    sub[..., 3][grass] = 0
    arr[start:y1 + 1] = sub
    return Image.fromarray(arr), int(grass.sum())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("dst")
    ap.add_argument("--band", type=float, default=0.06)
    ap.add_argument("--thr", type=int, default=25)
    a = ap.parse_args()
    out, n = strip_ground(Image.open(a.src), a.band, a.thr)
    out.save(a.dst)
    print(f"ok stripped {n} grass px")


if __name__ == "__main__":
    main()
