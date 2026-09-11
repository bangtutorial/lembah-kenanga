"""Chroma-key a generated image: flat green background -> alpha, with despill.

Usage:
  python tools/chroma_key.py in.png out.png [--key 00ff00] [--tol 60] [--despill]
"""
import argparse
import numpy as np
from PIL import Image


def chroma_key(img: Image.Image, key=(0, 255, 0), tol=60, despill=True, greenness_cut=90,
               unspill=0) -> Image.Image:
    rgba = np.array(img.convert("RGBA")).astype(np.int16)
    rgb = rgba[..., :3]
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    # "greenness": how much green dominates the other channels
    greenness = g - np.maximum(r, b)
    dist = np.sqrt(((rgb - np.array(key)) ** 2).sum(-1))
    # `greenness_cut` menangkap latar yang tidak persis #00FF00 — bayangan dan
    # gradasi tipis di sekitarnya. Tapi ia bekerja LEPAS dari `tol`, jadi
    # dedaunan yang hijaunya pekat bisa ikut terhapus berapa pun toleransinya:
    # kanopi oak musim panas pernah bolong-bolong karena ini, dan menurunkan
    # `--tol` sama sekali tidak menolong. Naikkan `--greenness` untuk aset yang
    # subjeknya memang hijau.
    bg = (dist < tol) | (greenness > greenness_cut)
    alpha = np.where(bg, 0, 255).astype(np.uint8)
    # soft edge: partially green pixels near the object -> fade alpha
    edge_at = max(20, greenness_cut - 50)
    edge = (~bg) & (greenness > edge_at)
    alpha[edge] = np.clip(255 - (greenness[edge] - edge_at) * 4, 0, 255).astype(np.uint8)
    out = rgba.copy()
    if despill:
        # clamp green only on object pixels that touch the background (edge halo),
        # so genuinely green objects (foliage) keep their color
        from PIL import ImageFilter
        bgimg = Image.fromarray((bg * 255).astype(np.uint8), "L").filter(ImageFilter.MaxFilter(5))
        near_bg = np.array(bgimg) > 0
        spill = (~bg) & near_bg & (greenness > 20)
        out[..., 1][spill] = np.maximum(r, b)[spill] + (greenness[spill] // 4)
    if unspill:
        # Benda bening — gelas, botol, kaca jendela — tidak menutupi latar, jadi
        # hijaunya tembus sampai ke tengah benda, jauh dari tepi mana pun.
        # Despill di atas tidak pernah sampai ke sana: ia hanya bekerja di piksel
        # yang bertetangga dengan latar.
        #
        # Dominasi hijau saja tidak bisa memisahkan limbah ini dari hijau yang
        # memang digambar — daun bawang dan irisan timun sama dominannya. Yang
        # memisahkan keduanya adalah merah dan birunya. Hijau pigmen itu gelap
        # di kedua kanal lain (diukur: median r 51-59, b 31-49), sedangkan
        # limbah latar menempel pada benda yang pucat — kaca bening, piring
        # putih, jamu kuning — sehingga merah dan birunya tetap tinggi
        # (median r 121-146, b 100-143). Ambang 70 jatuh di celah itu.
        PALE = 70
        m = (~bg) & (greenness > unspill) & (np.minimum(r, b) >= PALE)
        out[..., 1][m] = np.maximum(r, b)[m] + (greenness[m] // 4)
    out[..., 3] = alpha
    return Image.fromarray(out.astype(np.uint8), "RGBA")


def harden(img: Image.Image) -> Image.Image:
    """
    Buang semua piksel yang tidak sepenuhnya buram.

    Dipakai untuk ikon item. Modelnya suka menggambar bayangan kontak
    setengah tembus di bawah tiap ikon; di dalam kotak inventori bayangan itu
    salah — ikonnya tidak berdiri di atas apa pun — dan garis hijau tipis di
    antara benda dan bayangannya ikut lolos dari chroma key.

    Keduanya setengah tembus, sedangkan badan ikonnya buram penuh, jadi satu
    ambang alfa memisahkannya bersih. Tepi bergerigi yang tersisa justru sesuai
    gaya: aset ini memang tanpa anti-aliasing.
    """
    arr = np.array(img)
    arr[..., 3] = np.where(arr[..., 3] == 255, 255, 0)
    return Image.fromarray(arr, "RGBA")


def keep_center_blob(img: Image.Image, seed=None, erode=0) -> Image.Image:
    """Keep only the opaque connected component containing `seed` (default: center).
    Removes stray objects the model added around the main subject. With `erode`>0,
    thin bridges to stray blobs are cut first (erode, label, then grow back inside
    the original mask)."""
    from scipy import ndimage
    arr = np.array(img)
    opaque = arr[..., 3] > 0
    work = ndimage.binary_erosion(opaque, iterations=erode) if erode else opaque
    labels, n = ndimage.label(work)
    h, w = opaque.shape
    sx, sy = seed or (w // 2, h // 2)
    if not opaque[sy, sx]:
        ys, xs = np.where(opaque)
        i = np.argmin((xs - sx) ** 2 + (ys - sy) ** 2)
        sx, sy = int(xs[i]), int(ys[i])
    if not work[sy, sx]:
        ys, xs = np.where(work)
        i = np.argmin((xs - sx) ** 2 + (ys - sy) ** 2)
        sx, sy = int(xs[i]), int(ys[i])
    keep = labels == labels[sy, sx]
    if erode:
        # grow back to the original silhouette, but never across the cut
        keep = ndimage.binary_dilation(keep, iterations=erode + 1, mask=opaque)
    arr[..., 3] = np.where(keep, arr[..., 3], 0)
    return Image.fromarray(arr, "RGBA")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("dst")
    ap.add_argument("--key", default="00ff00")
    ap.add_argument("--tol", type=int, default=60)
    ap.add_argument("--despill", action="store_true")
    ap.add_argument("--greenness", type=int, default=90,
                    help="ambang dominasi hijau yang dianggap latar; naikkan untuk subjek berdaun")
    ap.add_argument("--keep-center", action="store_true",
                    help="keep only the blob connected to the image center")
    ap.add_argument("--erode", type=int, default=0,
                    help="with --keep-center: cut thin bridges to stray blobs (px)")
    ap.add_argument("--unspill", type=int, default=0,
                    help="turunkan hijau di piksel yang dominasinya di atas ini, di mana pun — "
                         "untuk benda bening yang ditembus warna latar")
    ap.add_argument("--hard", action="store_true",
                    help="buang piksel setengah tembus: bayangan kontak dan halo tepi (ikon item)")
    a = ap.parse_args()
    key = tuple(int(a.key[i:i + 2], 16) for i in (0, 2, 4))
    out = chroma_key(Image.open(a.src), key, a.tol, a.despill, a.greenness, a.unspill)
    if a.hard:
        out = harden(out)
    if a.keep_center:
        out = keep_center_blob(out, erode=a.erode)
    out.save(a.dst)
    print(f"ok {a.dst} {out.size}")


if __name__ == "__main__":
    main()
