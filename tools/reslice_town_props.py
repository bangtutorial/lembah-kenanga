"""Re-slice the town prop sheet into three separately sized sprites.

The first pass packed all three into one 64x64 grid with a shared scale, so the
tall street lamp set the scale and the fountain came out far too small for a
plaza centrepiece. Each prop now gets a canvas sized from DESIGN.md's nominal
object table (a 32x48 character is the reference height).
"""
import os
import sys
import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
from slice_grid import spans, largest_n, bbox  # noqa: E402
from normalize import normalize  # noqa: E402
from strip_ground import strip_ground  # noqa: E402

SRC = "assets/_raw/buildings/town_props_keyed.png"
OUT = "assets/sprites/buildings"

# name, canvas WxH (tiles are 32px; the player sprite is 32x48)
PIECES = [
    ("notice_board", 56, 56),   # waist-high board, ~1.5 tiles
    ("fountain", 96, 66),       # 3x2 tiles: a plaza centrepiece must read as big
    ("street_lamp", 32, 80),    # ~1.6x player height
]


def main():
    im = Image.open(SRC).convert("RGBA")
    a = np.array(im)[..., 3]
    cols = largest_n(spans(a.sum(0), 6), len(PIECES))
    os.makedirs(OUT, exist_ok=True)
    for (name, w, h), c in zip(PIECES, cols):
        cell = im.crop((c[0], 0, c[1], im.height))
        cell = cell.crop(bbox(np.array(cell)[..., 3]))
        cell, _ = strip_ground(cell, band=0.10)  # drop the baked grass tuft
        normalize(cell, w, h, "bottom-center", "contain", 24).save(f"{OUT}/{name}.png")
        print(f"ok {name}.png {w}x{h} (source {cell.width}x{cell.height})")


if __name__ == "__main__":
    main()
