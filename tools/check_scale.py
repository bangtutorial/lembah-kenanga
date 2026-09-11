"""Verify every sprite matches the canonical size table in assets/scale.json.

Without this, sprites keep whatever size their generated bounding box happened
to produce — which is how the dog once ended up as large as the cow. Run after
any re-slice.

Usage: python tools/check_scale.py [--strict]
"""
import argparse
import json
import os
import sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--strict", action="store_true", help="exit 1 when anything mismatches")
    a = ap.parse_args()

    scale = json.load(open(os.path.join(ROOT, "assets/scale.json"), encoding="utf-8"))
    manifest = json.load(open(os.path.join(ROOT, "assets/manifest.json"), encoding="utf-8"))["sprites"]

    problems, checked = [], 0
    for name, spec in scale.items():
        if name.startswith("_"):
            continue
        entry = manifest.get(name)
        if not entry:
            problems.append(f"{name}: ada di scale.json tapi tidak ada di manifest")
            continue
        checked += 1
        want = spec["px"]
        got = entry.get("frame")
        if got != want:
            problems.append(f"{name}: frame {got} != skala kanonik {want}")
        path = os.path.join(ROOT, "assets", entry["file"])
        if not os.path.exists(path):
            problems.append(f"{name}: berkas hilang {entry['file']}")
            continue
        w, h = Image.open(path).size
        cols, rows = entry.get("cols", 1), entry.get("rows", 1)
        if (w, h) != (want[0] * cols, want[1] * rows):
            problems.append(f"{name}: berkas {w}x{h} != {want[0] * cols}x{want[1] * rows} ({cols}x{rows} frame)")

    for name in manifest:
        if name not in scale and not name.startswith("ui_") and not name.startswith("portrait_"):
            problems.append(f"{name}: ada di manifest tapi belum punya entri skala")

    print(f"diperiksa {checked} sprite, {len(problems)} masalah")
    for p in problems:
        print("  -", p)
    if a.strict and problems:
        sys.exit(1)


if __name__ == "__main__":
    main()
