"""Rebuild the fence tile set so runs actually connect.

The generated sheet draws five nice-looking pieces, but they do not tile: the
vertical rail stops ~2px short of the tile edge and the corner/post pieces carry
no rails at all, so every joint shows a gap. This takes the *parts* of that art
(horizontal run, vertical rail, post) and composes 8 tiles that meet exactly at
tile borders.

Output: assets/sprites/nature/fence/fence_sheet.png, 8 columns of 32x32
  0 H  1 V  2 POST  3 corner TL  4 corner TR  5 corner BL  6 corner BR  7 GATE

Usage: python tools/build_fence.py
"""
import numpy as np
from PIL import Image

SRC = "assets/_raw/nature/fence_keyed.png"
OUT = "assets/sprites/nature/fence/fence_sheet.png"
S = 32
RAIL_Y = 15          # top of the horizontal rail in the source art
POST_X0, POST_X1 = 13, 19


def piece(sheet, i):
    """Slice piece i out of the raw 5-across art, normalized to 32x32."""
    a = np.array(sheet)[..., 3]
    cols = []
    on = a.any(0)
    start = None
    for x, v in enumerate(on):
        if v and start is None:
            start = x
        elif not v and start is not None:
            cols.append((start, x)); start = None
    if start is not None:
        cols.append((start, len(on)))
    cols = sorted(sorted(cols, key=lambda c: c[1] - c[0], reverse=True)[:5])
    x0, x1 = cols[i]
    ys = np.where(a.any(1))[0]
    cell = sheet.crop((x0, ys.min(), x1, ys.max() + 1))
    scale = S / max(cell.size)
    nw, nh = max(1, round(cell.width * scale)), max(1, round(cell.height * scale))
    small = cell.resize((nw, nh), Image.BOX)
    canvas = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    canvas.paste(small, ((S - nw) // 2, S - nh))
    return quantize(canvas)


def quantize(im, colors=14):
    arr = np.array(im)
    mask = arr[..., 3] >= 128
    rgb = Image.fromarray(arr[..., :3], "RGB").quantize(
        colors=colors, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert("RGB")
    return Image.fromarray(np.dstack([np.array(rgb), np.where(mask, 255, 0).astype(np.uint8)]), "RGBA")


def main():
    sheet = Image.open(SRC).convert("RGBA")
    H = piece(sheet, 0)
    V = piece(sheet, 1)
    POST = piece(sheet, 2)
    GATE = piece(sheet, 4)

    # --- parts -------------------------------------------------------------
    post = POST.crop((POST_X0, RAIL_Y, POST_X1, S))                 # 6 x 17
    rail_row = V.crop((POST_X0, 6, POST_X1, 7))                     # 1px slice of the vertical rail
    half_r = H.crop((S // 2, 0, S, S))                              # right half of a horizontal run
    half_l = H.crop((0, 0, S // 2, S))

    def vrail(y0, y1):
        """A vertical rail column spanning [y0, y1) of the tile."""
        strip = rail_row.resize((POST_X1 - POST_X0, max(1, y1 - y0)), Image.NEAREST)
        t = Image.new("RGBA", (S, S), (0, 0, 0, 0))
        t.paste(strip, (POST_X0, y0))
        return t

    def compose(*layers):
        t = Image.new("RGBA", (S, S), (0, 0, 0, 0))
        for l in layers:
            t.alpha_composite(l)
        return t

    def with_post(base):
        t = base.copy()
        t.alpha_composite(post_tile)
        return t

    post_tile = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    post_tile.paste(post, (POST_X0, RAIL_Y))

    right = Image.new("RGBA", (S, S), (0, 0, 0, 0)); right.paste(half_r, (S // 2, 0))
    left = Image.new("RGBA", (S, S), (0, 0, 0, 0)); left.paste(half_l, (0, 0))

    tiles = [
        H,                                                   # 0 horizontal run
        with_post(vrail(0, S)),                              # 1 vertical run (rail edge to edge)
        with_post(Image.new("RGBA", (S, S), (0, 0, 0, 0))),  # 2 lone post
        with_post(compose(vrail(RAIL_Y, S), right)),         # 3 corner: rail down + right
        with_post(compose(vrail(RAIL_Y, S), left)),          # 4 corner: rail down + left
        with_post(compose(vrail(0, RAIL_Y + 6), right)),     # 5 corner: rail up + right
        with_post(compose(vrail(0, RAIL_Y + 6), left)),      # 6 corner: rail up + left
        GATE,                                                # 7 gate
    ]

    out = Image.new("RGBA", (S * len(tiles), S), (0, 0, 0, 0))
    for i, t in enumerate(tiles):
        out.paste(t, (i * S, 0))
    out.save(OUT)
    print(f"ok {OUT} {out.size} ({len(tiles)} tiles)")

    # preview: a closed ring plus a T of runs, on grass
    grass = Image.open("assets/sprites/terrain/grass_spring.png").convert("RGBA")
    W, HH = 8, 6
    prev = Image.new("RGBA", (W * S, HH * S))
    for y in range(HH):
        for x in range(W):
            prev.paste(grass, (x * S, y * S))
    def put(c, r, i):
        prev.alpha_composite(tiles[i], (c * S, r * S))
    for c in range(1, W - 1):
        put(c, 0, 0); put(c, HH - 1, 0)
    for r in range(1, HH - 1):
        put(0, r, 1); put(W - 1, r, 1)
    put(0, 0, 3); put(W - 1, 0, 4); put(0, HH - 1, 5); put(W - 1, HH - 1, 6)
    put(4, HH - 1, 7)
    prev.resize((W * S * 4, HH * S * 4), Image.NEAREST).save("assets/_raw/_fence_ring.png")
    print("preview assets/_raw/_fence_ring.png")


if __name__ == "__main__":
    main()
