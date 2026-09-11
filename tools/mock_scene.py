"""Compose a mock game scene from approved sprites, at game scale, to judge
cohesion before wiring assets into the engine.

Usage: python tools/mock_scene.py [--zoom 2] [--out assets/scene_test.png]
"""
import argparse
import json
import random
from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument("--zoom", type=int, default=2)
ap.add_argument("--out", default="assets/scene_test.png")
a = ap.parse_args()

M = json.load(open("assets/manifest.json"))["sprites"]
TILE = 32
W, H = 34 * TILE, 20 * TILE          # 1088 x 640 logical
sc = Image.new("RGBA", (W, H))
random.seed(7)


def img(name):
    return Image.open("assets/" + M[name]["file"]).convert("RGBA")


def frame(name, col=0, row=0):
    d = M[name]
    fw, fh = d["frame"]
    return img(name).crop((col * fw, row * fh, (col + 1) * fw, (row + 1) * fh))


def fill(name, x0, y0, x1, y1):
    t = img(name)
    for y in range(y0, y1, TILE):
        for x in range(x0, x1, TILE):
            sc.paste(t, (x, y))


def put(im, cx, by):                  # bottom-center anchor, in pixels
    sc.alpha_composite(im, (int(cx - im.width / 2), int(by - im.height)))


# --- ground: grass everywhere, a dirt road down the middle, plaza on the right
fill("grass_spring", 0, 0, W, H)
fill("dirt", 15 * TILE, 0, 18 * TILE, H)
fill("plaza", 18 * TILE, 0, W, 11 * TILE)
fill("sand", 0, 18 * TILE, 15 * TILE, H)

# --- farm side: tilled field with crops at several stages
for i, (crop, stages) in enumerate([("crop_turnip", [4, 4, 3]), ("crop_potato", [2, 3, 4]), ("crop_tomato", [1, 2, 4])]):
    for j, st in enumerate(stages):
        x, y = (2 + j) * TILE, (9 + i * 2) * TILE
        sc.paste(img("tilled_wet" if j == 0 else "tilled_dry"), (x, y))
        put(frame(crop, st), x + TILE // 2, y + TILE)

# --- farm buildings
put(img("house_lv1"), 5 * TILE, 7 * TILE)
put(img("coop"), 10 * TILE, 6 * TILE)
put(img("barn"), 10.5 * TILE, 13 * TILE)
put(img("well"), 13.5 * TILE, 8 * TILE)
put(img("shipping_bin"), 7.5 * TILE, 9 * TILE)
put(frame("props", 0), 2 * TILE, 6 * TILE)          # mailbox

# fence along the farm's right edge
for r in range(3, 17):
    put(frame("fence", 1), 14.5 * TILE, (r + 1) * TILE)

# --- town side
put(img("town_hall"), 25 * TILE, 6 * TILE)
put(img("store"), 20 * TILE, 11 * TILE)
put(img("warung"), 30 * TILE, 11 * TILE)
put(img("blacksmith"), 25.5 * TILE, 16 * TILE)
put(frame("town_props", 1), 21.5 * TILE, 15 * TILE)  # fountain
put(frame("town_props", 2), 19 * TILE, 14 * TILE)    # lamp
put(frame("town_props", 0), 29 * TILE, 15 * TILE)    # notice board

# --- trees & nature
for x, y in [(1, 4), (1, 12), (12, 3), (16.5, 4), (16.5, 12), (33, 4), (33, 13), (28, 3)]:
    put(frame("oak", 0), x * TILE, y * TILE)
put(frame("pine", 0), 3 * TILE, 17 * TILE)
put(frame("pine", 0), 12 * TILE, 19 * TILE)
for x, y, c in [(6, 11.5, 1), (8, 15, 0), (18, 17, 0), (31, 17, 1)]:
    put(frame("bush", c), x * TILE, y * TILE)
for x, y, c in [(4, 16, 0), (9, 17, 1), (13, 16, 2), (20, 18, 3), (27, 18, 0)]:
    put(frame("weeds", c), x * TILE, y * TILE)
for x, y, c in [(2, 14, 0), (11, 18, 1), (23, 18, 2)]:
    put(frame("rocks", c), x * TILE, y * TILE)
put(frame("props", 2), 14 * TILE, 18 * TILE)         # stump
put(frame("props", 3), 6 * TILE, 19 * TILE)          # log

# --- characters & animals
put(frame("player_m", 0, 0), 7.5 * TILE, 8 * TILE)
put(frame("player_f", 2, 2), 17 * TILE, 10 * TILE)
put(frame("npc_harun", 1, 3), 24 * TILE, 12 * TILE)
put(frame("npc_sari", 0, 0), 20.5 * TILE, 13 * TILE)
for i, (x, y) in enumerate([(9, 8), (10.5, 8.6), (12, 8.2)]):
    put(frame("chicken", i % 3), x * TILE, y * TILE)
put(frame("cow", 0), 9 * TILE, 15 * TILE)
put(frame("cow", 3), 12 * TILE, 15.5 * TILE)
put(frame("dog", 3), 6.5 * TILE, 10 * TILE)

sc.convert("RGB").resize((W * a.zoom, H * a.zoom), Image.NEAREST).save(a.out)
print(f"ok {a.out} {W * a.zoom}x{H * a.zoom} (logical {W}x{H}, zoom x{a.zoom})")
