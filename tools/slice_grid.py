"""Slice a keyed (RGBA) sprite sheet into frames.

Two modes:
  --auto-bbox : detect rows/cols from alpha gaps (projection profiles), then
                each frame is the alpha bbox in that cell.
  default     : fixed grid of --cols x --rows equal cells.

Each frame is then normalized to --cell WxH with bottom-center pivot
(scaled so frame height == H, keeping aspect), nearest-neighbor, and saved as
out/<name>_r{row}c{col}.png plus a packed sheet out/<name>_sheet.png
(rows x cols of exact cells).

Usage:
  python tools/slice_grid.py sheet.png --cols 4 --rows 4 --cell 32x48 --out dir/ --auto-bbox
"""
import argparse
import os
import numpy as np
from PIL import Image


def spans(profile, min_gap=2):
    """Return [(start, end)] runs where profile > 0, merging gaps < min_gap."""
    on = profile > 0
    runs, start = [], None
    for i, v in enumerate(on):
        if v and start is None:
            start = i
        elif not v and start is not None:
            runs.append([start, i])
            start = None
    if start is not None:
        runs.append([start, len(on)])
    merged = []
    for r in runs:
        if merged and r[0] - merged[-1][1] < min_gap:
            merged[-1][1] = r[1]
        else:
            merged.append(r)
    return merged


def largest_n(runs, n):
    runs = sorted(runs, key=lambda r: r[1] - r[0], reverse=True)[:n]
    return sorted(runs)


def bbox(alpha):
    ys, xs = np.where(alpha > 0)
    if len(xs) == 0:
        return None
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


def pixelize(im: Image.Image, max_colors=32, alpha_threshold=128):
    """Binary alpha + palette quantization so downscaled art stays crisp pixel art."""
    arr = np.array(im)
    a = arr[..., 3]
    mask = a >= alpha_threshold
    rgb = Image.fromarray(arr[..., :3], "RGB")
    q = rgb.quantize(colors=max_colors, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert("RGB")
    out = np.dstack([np.array(q), np.where(mask, 255, 0).astype(np.uint8)])
    return Image.fromarray(out, "RGBA")


def fit_bottom_center(frame: Image.Image, w, h, scale=None, max_colors=32, pivot="bottom-center"):
    """Scale to CONTAIN inside w x h (never clips), then place by pivot."""
    fw, fh = frame.size
    s = scale if scale else min(w / fw, h / fh)
    nw, nh = max(1, round(fw * s)), max(1, round(fh * s))
    if nw > w or nh > h:  # a shared scale may still overflow: shrink to fit
        s = min(w / fw, h / fh); nw, nh = max(1, round(fw * s)), max(1, round(fh * s))
    small = frame.resize((nw, nh), Image.BOX)  # area-average first
    small = pixelize(small, max_colors)
    canvas = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    x = (w - nw) // 2
    y = h - nh if pivot.startswith("bottom") else (h - nh) // 2
    canvas.paste(small, (x, y))
    return canvas


def frame_diff(a, b):
    A = np.array(a).astype(int); B = np.array(b).astype(int)
    m = (A[..., 3] > 0) | (B[..., 3] > 0)
    return np.abs(A[..., :3] - B[..., :3]).sum(-1)[m].mean() if m.any() else 0.0


def fix_flips(frames, cols, ratio=0.85):
    """Image models sometimes mirror a side-view walk frame. For each row, a frame
    that matches the row's idle (col 0) better when mirrored is flipped back."""
    from PIL import ImageOps
    fixed = []
    for i, f in enumerate(frames):
        ri, ci = divmod(i, cols)
        idle = frames[ri * cols]
        if ci and frame_diff(idle, ImageOps.mirror(f)) < frame_diff(idle, f) * ratio:
            f = ImageOps.mirror(f)
            fixed.append(f"r{ri}c{ci}")
        frames[i] = f
    return fixed


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("--cols", type=int, required=True)
    ap.add_argument("--rows", type=int, required=True)
    ap.add_argument("--cell", required=True, help="WxH")
    ap.add_argument("--out", required=True)
    ap.add_argument("--name", default=None)
    ap.add_argument("--auto-bbox", action="store_true")
    ap.add_argument("--max-colors", type=int, default=32)
    ap.add_argument("--pivot", default="bottom-center", choices=["bottom-center", "center"])
    ap.add_argument("--fix-flips", action="store_true",
                    help="mirror side frames the model drew facing the wrong way")
    ap.add_argument("--uniform-scale", action="store_true",
                    help="use one scale for all frames (tallest frame -> H)")
    a = ap.parse_args()
    W, H = map(int, a.cell.lower().split("x"))
    name = a.name or os.path.splitext(os.path.basename(a.src))[0]
    os.makedirs(a.out, exist_ok=True)

    img = Image.open(a.src).convert("RGBA")
    alpha = np.array(img)[..., 3]

    cells = []
    if a.auto_bbox:
        rows = largest_n(spans(alpha.sum(1), 4), a.rows)
        cols = largest_n(spans(alpha.sum(0), 4), a.cols)
        if len(rows) != a.rows or len(cols) != a.cols:
            print(f"WARN detected rows={len(rows)} cols={len(cols)}; falling back to fixed grid")
            a.auto_bbox = False
        else:
            for r in rows:
                for c in cols:
                    cells.append((c[0], r[0], c[1], r[1]))
    if not a.auto_bbox:
        cw, ch = img.width / a.cols, img.height / a.rows
        for ri in range(a.rows):
            for ci in range(a.cols):
                cells.append((int(ci * cw), int(ri * ch), int((ci + 1) * cw), int((ri + 1) * ch)))

    frames = []
    for (x0, y0, x1, y1) in cells:
        cell = img.crop((x0, y0, x1, y1))
        bb = bbox(np.array(cell)[..., 3])
        frames.append(cell.crop(bb) if bb else cell)

    scale = None
    if a.uniform_scale:  # one scale for every frame, chosen so the largest frame still fits
        scale = min(W / max(f.width for f in frames), H / max(f.height for f in frames))

    norms = [fit_bottom_center(f, W, H, scale, a.max_colors, a.pivot) for f in frames]
    if a.fix_flips:
        flipped = fix_flips(norms, a.cols)
        if flipped:
            print("  mirrored back:", ", ".join(flipped))
    sheet = Image.new("RGBA", (W * a.cols, H * a.rows), (0, 0, 0, 0))
    for i, norm in enumerate(norms):
        ri, ci = divmod(i, a.cols)
        norm.save(os.path.join(a.out, f"{name}_r{ri}c{ci}.png"))
        sheet.paste(norm, (ci * W, ri * H))
    sheet_path = os.path.join(a.out, f"{name}_sheet.png")
    sheet.save(sheet_path)
    print(f"ok {len(frames)} frames -> {sheet_path} ({sheet.size[0]}x{sheet.size[1]})")
    for i, (x0, y0, x1, y1) in enumerate(cells):
        print(f"  cell{i}: {x0},{y0}-{x1},{y1} bbox={frames[i].size}")


if __name__ == "__main__":
    main()
