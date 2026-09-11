"""Nearest-neighbor contact sheet over a checkerboard.

Usage:
  python tools/contact_sheet.py a.png b.png ... --out preview.png [--cell 128] [--scale 3] [--columns 4]
If --scale is given, each image is drawn at that integer zoom (cell grows to fit).
"""
import argparse
import glob
import math
from PIL import Image, ImageDraw


def checker(w, h, s=8):
    im = Image.new("RGBA", (w, h), (200, 200, 200, 255))
    d = ImageDraw.Draw(im)
    for y in range(0, h, s):
        for x in range(0, w, s):
            if (x // s + y // s) % 2:
                d.rectangle([x, y, x + s - 1, y + s - 1], fill=(150, 150, 150, 255))
    return im


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("files", nargs="+")
    ap.add_argument("--out", required=True)
    ap.add_argument("--cell", type=int, default=128)
    ap.add_argument("--scale", type=int, default=0)
    ap.add_argument("--columns", type=int, default=4)
    a = ap.parse_args()
    paths = []
    for f in a.files:
        paths.extend(sorted(glob.glob(f)) or [f])
    imgs = [Image.open(p).convert("RGBA") for p in paths]
    if a.scale:
        cell = max(max(i.width, i.height) for i in imgs) * a.scale + 8
    else:
        cell = a.cell
    cols = min(a.columns, len(imgs))
    rows = math.ceil(len(imgs) / cols)
    sheet = checker(cols * cell, rows * cell)
    for i, im in enumerate(imgs):
        if a.scale:
            im = im.resize((im.width * a.scale, im.height * a.scale), Image.NEAREST)
        else:
            s = min((cell - 8) / im.width, (cell - 8) / im.height)
            im = im.resize((max(1, int(im.width * s)), max(1, int(im.height * s))), Image.NEAREST)
        x = (i % cols) * cell + (cell - im.width) // 2
        y = (i // cols) * cell + (cell - im.height) // 2
        sheet.alpha_composite(im, (x, y))
    sheet.save(a.out)
    print(f"ok {a.out} {sheet.size} ({len(imgs)} images)")


if __name__ == "__main__":
    main()
