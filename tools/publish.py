"""Susun folder `dist/` berisi HANYA yang dibutuhkan peramban.

Server kerja (`serve.py` tanpa `--root`) menyajikan seluruh folder projek. Di
laptop sendiri itu tidak apa-apa. Di VPS itu berarti siapa pun bisa mengunduh
`var/chat.db` — lengkap dengan daftar username dan sidik kunci sesi — juga 435 MB
berkas mentah di `assets/_raw`, seluruh isi `tools/`, dan `.git`. Jadi yang
diunggah bukan folder projek, melainkan keluaran skrip ini.

Daftar berkasnya tidak ditulis tangan. Sprite diambil dari `assets/manifest.json`
supaya aset yang baru ditambahkan ikut terbawa tanpa ada yang perlu ingat
memperbarui daftar di sini — dan setiap berkas yang disebut manifest diperiksa
ada, karena sprite yang hilang baru ketahuan setelah pemain membuka gamenya.

    python tools/publish.py            # -> dist/
    python tools/publish.py --out /tmp/lk --zip
"""
import argparse
import json
import os
import shutil
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Berkas dan folder yang selalu ikut. `src/` ikut seluruhnya: `main.js` memuat
# `src/data/*.json` saat jalan, jadi kode dan datanya memang harus tersaji.
ALWAYS = [
    "index.html",
    "game.html",
    "src",
    "assets/manifest.json",
    "assets/homepage",
]

# Sengaja TIDAK ikut, masing-masing dengan alasannya:
#   assets/_raw     berkas mentah hasil generate, ratusan MB, tidak dipakai game
#   assets/audio    musik dan efek disintesis Web Audio; berkasnya tidak pernah dimuat
#   assets/scale.json, PROVENANCE.md, scene_batchA.png  alat bantu kerja
#   tools, var, docs, *.md, .git                        bukan urusan peramban
SKIP_NOTE = "assets/_raw, assets/audio, tools/, var/, docs/, *.md, .git"


def sprite_files(manifest):
    """Setiap berkas yang disebut manifest, relatif terhadap akar projek."""
    out = []
    for name, spr in manifest.get("sprites", {}).items():
        f = spr.get("file")
        if f:
            out.append(("assets/" + f, name))
    return out


def copy(rel, dist):
    src, dst = os.path.join(ROOT, rel), os.path.join(dist, rel)
    if not os.path.exists(src):
        return 0, 0
    if os.path.isdir(src):
        shutil.copytree(src, dst, dirs_exist_ok=True)
        n = sum(len(fs) for _, _, fs in os.walk(dst))
        size = sum(os.path.getsize(os.path.join(d, f)) for d, _, fs in os.walk(dst) for f in fs)
        return n, size
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    shutil.copy2(src, dst)
    return 1, os.path.getsize(dst)


def human(n):
    for unit in ("B", "KB", "MB", "GB"):
        if n < 1024:
            return f"{n:.0f} {unit}"
        n /= 1024
    return f"{n:.1f} TB"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=os.path.join(ROOT, "dist"))
    ap.add_argument("--zip", action="store_true", help="sekalian buat dist.zip untuk diunggah")
    a = ap.parse_args()

    dist = os.path.abspath(a.out)
    if os.path.exists(dist):
        shutil.rmtree(dist)
    os.makedirs(dist)

    manifest = json.load(open(os.path.join(ROOT, "assets/manifest.json"), encoding="utf-8"))
    files, total = 0, 0
    for rel in ALWAYS:
        n, s = copy(rel, dist)
        files += n
        total += s
        print(f"  {rel:28s} {n:4d} berkas  {human(s)}")

    missing = []
    n_spr = s_spr = 0
    for rel, name in sprite_files(manifest):
        n, s = copy(rel, dist)
        if n == 0:
            missing.append(f"{name} -> {rel}")
        n_spr += n
        s_spr += s
    files += n_spr
    total += s_spr
    print(f"  {'sprite (dari manifest)':28s} {n_spr:4d} berkas  {human(s_spr)}")

    if missing:
        raise SystemExit("manifest menyebut berkas yang tidak ada:\n  " + "\n  ".join(missing))

    # Periksa ulang dari sisi dist: yang disebut manifest harus benar-benar
    # sampai ke sana. Menyalin bisa gagal diam-diam kalau jalurnya salah kapital.
    for rel, name in sprite_files(manifest):
        if not os.path.exists(os.path.join(dist, rel)):
            raise SystemExit(f"{name}: {rel} tidak sampai ke dist/")

    print(f"\nok {dist}")
    print(f"   {files} berkas, {human(total)}  (tidak diikutkan: {SKIP_NOTE})")

    if a.zip:
        zpath = dist + ".zip"
        with zipfile.ZipFile(zpath, "w", zipfile.ZIP_DEFLATED) as z:
            for d, _, fs in os.walk(dist):
                for f in fs:
                    p = os.path.join(d, f)
                    z.write(p, os.path.relpath(p, dist))
        print(f"   {zpath}  {human(os.path.getsize(zpath))}")


if __name__ == "__main__":
    main()
