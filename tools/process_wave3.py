"""One-off processing for Batch A waves 3-4 (animals, town buildings, props,
pine/bridge, terrain, interior, fx, homepage). Kept as a record of the exact
parameters used; safe to re-run.
"""
import os
import subprocess
import sys
import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
from chroma_key import chroma_key  # noqa: E402
from collapse_gaps import collapse  # noqa: E402
from normalize import normalize  # noqa: E402
from slice_grid import spans, largest_n, bbox, pixelize  # noqa: E402
from tile_check import make_seamless  # noqa: E402

RAW, OUT = "assets/_raw", "assets/sprites"
PY = sys.executable


def run(*args):
    r = subprocess.run([PY, "-W", "ignore", *args], capture_output=True, text=True)
    print((r.stdout or r.stderr).strip().splitlines()[0] if (r.stdout or r.stderr) else "ok")


def key(src, dst):
    chroma_key(Image.open(src), (0, 255, 0), 60, True).save(dst)


def mk(p):
    os.makedirs(p, exist_ok=True)


# --- town buildings: key, collapse floating roof gaps, normalize
for name, size in [("blacksmith", "160x160"), ("town_hall", "224x192"), ("warung", "160x128"), ("store", "192x160")]:
    src = f"{RAW}/buildings/{name}.png"
    if not os.path.exists(src):
        print("skip", name); continue
    keyed = f"{RAW}/buildings/{name}_keyed.png"
    key(src, keyed)
    img, removed = collapse(Image.open(keyed))
    img.save(keyed)
    print(name, "gap rows removed:", removed)
    run("tools/normalize.py", keyed, f"{OUT}/buildings/{name}.png", "--size", size, "--pivot", "bottom-center", "--max-colors", "32")

# --- animals
mk(f"{OUT}/animals")
key(f"{RAW}/animals/chicken.png", f"{RAW}/animals/chicken_keyed.png")
run("tools/slice_grid.py", f"{RAW}/animals/chicken_keyed.png", "--cols", "4", "--rows", "1", "--cell", "32x32", "--out", f"{OUT}/animals/chicken", "--name", "chicken", "--auto-bbox", "--uniform-scale", "--max-colors", "16")
key(f"{RAW}/animals/cow.png", f"{RAW}/animals/cow_keyed.png")
run("tools/slice_grid.py", f"{RAW}/animals/cow_keyed.png", "--cols", "2", "--rows", "2", "--cell", "48x48", "--out", f"{OUT}/animals/cow", "--name", "cow", "--auto-bbox", "--uniform-scale", "--max-colors", "16")
key(f"{RAW}/animals/dog.png", f"{RAW}/animals/dog_keyed.png")
run("tools/slice_grid.py", f"{RAW}/animals/dog_keyed.png", "--cols", "4", "--rows", "2", "--cell", "48x48", "--out", f"{OUT}/animals/dog", "--name", "dog", "--auto-bbox", "--uniform-scale", "--max-colors", "16")
s = Image.new("RGBA", (192, 48))
for i in range(4):
    s.paste(Image.open(f"{OUT}/animals/cow/cow_r{i // 2}c{i % 2}.png"), (i * 48, 0))
s.save(f"{OUT}/animals/cow/cow_sheet.png")
s = Image.new("RGBA", (192, 48))
for i in range(4):
    s.paste(Image.open(f"{OUT}/animals/dog/dog_r0c{i}.png"), (i * 48, 0))
s.save(f"{OUT}/animals/dog/dog_sheet.png")
print("animal strips ok")

# --- town props (notice board, fountain, lamp)
key(f"{RAW}/buildings/town_props.png", f"{RAW}/buildings/town_props_keyed.png")
run("tools/slice_grid.py", f"{RAW}/buildings/town_props_keyed.png", "--cols", "3", "--rows", "1", "--cell", "64x64", "--out", f"{OUT}/buildings/town_props", "--name", "town_props", "--auto-bbox", "--uniform-scale", "--max-colors", "24")

# --- pine (2) + bridge, custom cell sizes
key(f"{RAW}/nature/pine_bridge.png", f"{RAW}/nature/pine_bridge_keyed.png")
im = Image.open(f"{RAW}/nature/pine_bridge_keyed.png")
a = np.array(im)[..., 3]
cols = largest_n(spans(a.sum(0), 4), 3)
rows = largest_n(spans(a.sum(1), 4), 1)
cells = [im.crop((c[0], rows[0][0], c[1], rows[0][1])) for c in cols]
normalize(cells[0], 80, 112, "bottom-center", "contain", 24).save(f"{OUT}/nature/pine_summer.png")
normalize(cells[1], 80, 112, "bottom-center", "contain", 24).save(f"{OUT}/nature/pine_winter.png")
normalize(cells[2], 96, 64, "bottom-center", "contain", 24).save(f"{OUT}/nature/bridge.png")
s = Image.new("RGBA", (160, 112))
s.paste(Image.open(f"{OUT}/nature/pine_summer.png"), (0, 0))
s.paste(Image.open(f"{OUT}/nature/pine_winter.png"), (80, 0))
s.save(f"{OUT}/nature/pine.png")
print("pine/bridge ok")

# --- terrain
run("tools/tile_check.py", f"{RAW}/terrain/sand.png", "--out", f"{OUT}/terrain/sand.png", "--size", "32", "--crop", "256", "--repeat", "4", "--zoom", "4", "--max-colors", "8", "--punch", "1.5")
run("tools/tile_check.py", f"{RAW}/terrain/plaza.png", "--out", f"{OUT}/terrain/plaza.png", "--size", "32", "--crop", "320", "--repeat", "4", "--zoom", "4", "--max-colors", "8")
im = Image.open(f"{RAW}/terrain/floor_wall.png").convert("RGB")
arr = np.array(im).astype(int)
dark = arr.max(-1) < 50
div = np.where(dark.sum(0) > dark.shape[0] * 0.5)[0]
x = int(div.mean()) if len(div) else im.width // 2
floor = im.crop((0, 0, x - 4, im.height))
side = min(floor.size)
f = floor.crop(((floor.width - side) // 2, 0, (floor.width - side) // 2 + side, side)).resize((32, 32), Image.BOX)
farr = make_seamless(np.array(f).astype(np.float32), 2)
pixelize(Image.fromarray(np.dstack([farr.astype(np.uint8), np.full((32, 32), 255, np.uint8)])), 8).save(f"{OUT}/terrain/wood_floor.png")
wall = im.crop((x + 6, 0, im.width, im.height)).resize((32, 64), Image.BOX)
warr = np.array(wall).astype(np.float32)
for i in range(2):  # horizontal seam only
    t = (i + 1) / 3
    l, r = warr[:, i].copy(), warr[:, 31 - i].copy()
    warr[:, i] = l * (0.5 + t / 2) + r * (0.5 - t / 2)
    warr[:, 31 - i] = r * (0.5 + t / 2) + l * (0.5 - t / 2)
pixelize(Image.fromarray(np.dstack([warr.astype(np.uint8), np.full((64, 32), 255, np.uint8)])), 8).save(f"{OUT}/terrain/wall.png")
print("floor/wall ok, divider x =", x)

# --- interior, fx
mk(f"{OUT}/interior"); mk(f"{OUT}/fx")
key(f"{RAW}/interior/furniture.png", f"{RAW}/interior/furniture_keyed.png")
run("tools/slice_grid.py", f"{RAW}/interior/furniture_keyed.png", "--cols", "4", "--rows", "2", "--cell", "64x96", "--out", f"{OUT}/interior/furniture", "--name", "furniture", "--auto-bbox", "--uniform-scale", "--max-colors", "24")
key(f"{RAW}/interior/shop_props.png", f"{RAW}/interior/shop_props_keyed.png")
run("tools/slice_grid.py", f"{RAW}/interior/shop_props_keyed.png", "--cols", "4", "--rows", "1", "--cell", "96x80", "--out", f"{OUT}/interior/shop_props", "--name", "shop_props", "--auto-bbox", "--uniform-scale", "--max-colors", "24")
key(f"{RAW}/fx/particles.png", f"{RAW}/fx/particles_keyed.png")
run("tools/slice_grid.py", f"{RAW}/fx/particles_keyed.png", "--cols", "8", "--rows", "1", "--cell", "16x16", "--out", f"{OUT}/fx/particles", "--name", "particles", "--auto-bbox", "--uniform-scale", "--pivot", "center", "--max-colors", "12")

# --- homepage: ornaments, logo (kept near raw resolution), hero (downscaled + quantized)
mk("assets/homepage")
key(f"{RAW}/homepage/ornaments.png", f"{RAW}/homepage/ornaments_keyed.png")
key(f"{RAW}/homepage/logo.png", f"{RAW}/homepage/logo_keyed.png")
im = Image.open(f"{RAW}/homepage/ornaments_keyed.png")
a = np.array(im)[..., 3]
cols = largest_n(spans(a.sum(0), 8), 4)
for n, c in zip(["sign", "divider", "rope", "leaves"], cols):
    cell = im.crop((c[0], 0, c[1], im.height))
    cell.crop(bbox(np.array(cell)[..., 3])).save(f"assets/homepage/orn_{n}.png")
lg = Image.open(f"{RAW}/homepage/logo_keyed.png")
lg.crop(bbox(np.array(lg)[..., 3])).save("assets/homepage/logo.png")
hero = Image.open(f"{RAW}/homepage/hero.png").convert("RGB").resize((1920, 1072), Image.LANCZOS)
hero.quantize(256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).save("assets/homepage/hero.png", optimize=True)
print("homepage:", {f: os.path.getsize("assets/homepage/" + f) // 1024 for f in os.listdir("assets/homepage")})
