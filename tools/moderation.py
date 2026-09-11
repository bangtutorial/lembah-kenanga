"""Penyaring kata kasar untuk obrolan, bahasa Indonesia dan Inggris.

Pesannya **disensor, bukan ditolak**. Menolak pesan hanya membuat pengirimnya
mencoba lagi dengan ejaan lain sampai lolos; menyensor membuat usahanya sia-sia
sejak awal dan orang lain tetap melihat maksud kalimatnya.

Dua hal yang membuat daftar kata sederhana biasanya gagal, dan cara keduanya
ditangani di sini:

1. **Penyamaran.** "k0nt0l", "b4bi", "anjiiiing" lolos dari pencocokan lurus.
   Teks dinormalkan dulu — angka yang menyamar jadi huruf dikembalikan, huruf
   berulang dirapatkan — dan pencocokan dilakukan di teks hasil normalisasi.
2. **Kata sah yang mengandung kata kasar** (masalah Scunthorpe). Pencocokan
   memakai batas kata, jadi "sialan" kena tapi "spesial" tidak, dan pemetaan
   posisi dijaga supaya yang disensor persis kata itu saja.

Daftarnya sengaja pendek dan hanya berisi yang tidak ambigu. Menambah kata yang
"kadang kasar" akan lebih sering menyensor kalimat biasa daripada menangkap
yang dimaksud.
"""
import re

WORDS = [
    # Indonesia
    "anjing", "anjg", "asu", "babi", "bangsat", "bajingan", "kontol", "memek",
    "ngentot", "entot", "jancok", "jancuk", "cok", "kimak", "kampret", "keparat",
    "brengsek", "bego", "goblok", "tolol", "idiot", "sialan", "bangke", "tai",
    "taik", "pepek", "peler", "coli", "pelacur", "lonte", "jablay", "bencong",
    "banci", "monyet", "setan", "iblis", "bacot", "kntl", "mmk", "ngtd",
    # Inggris
    "fuck", "fucking", "fucker", "shit", "bullshit", "bitch", "bastard", "cunt",
    "dick", "asshole", "motherfucker", "whore", "slut", "retard", "nigger",
    "faggot", "prick", "wanker", "twat",
]

# Angka yang lazim menyamar jadi huruf. Selalu dipetakan: angka di tengah kata
# hampir selalu penyamaran, dan batas kata mengurus sisanya.
DIGITS = {"0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "8": "b", "9": "g"}

# Tanda baca yang juga dipakai menyamar. Ini hanya dipetakan kalau berada DI
# DALAM kata — diapit huruf di kiri dan kanan. Tanpa syarat itu, "BANGSAT!!!"
# berubah jadi "bangsati" dan justru lolos dari batas kata.
SYMBOLS = {"!": "i", "|": "i", "@": "a", "$": "s"}

_PATTERN = re.compile(r"(?<![a-z0-9])(" + "|".join(sorted(WORDS, key=len, reverse=True)) + r")(?![a-z0-9])")


def _normalise(text):
    """Kembalikan (teks ternormalisasi, peta indeks ke teks asli).

    Petanya wajib: setelah huruf berulang dirapatkan, posisi di teks hasil tidak
    lagi sama dengan posisi di teks asli, dan yang harus disensor adalah potongan
    di teks asli.
    """
    out, index = [], []
    prev = ""
    for i, ch in enumerate(text):
        c = ch.lower()
        if c in DIGITS:
            c = DIGITS[c]
        elif c in SYMBOLS:
            left = text[i - 1].isalnum() if i > 0 else False
            right = text[i + 1].isalnum() if i + 1 < len(text) else False
            c = SYMBOLS[c] if (left and right) else c
        # rapatkan huruf berulang: "anjiiiing" -> "anjing"
        if c == prev and c.isalpha():
            continue
        out.append(c)
        index.append(i)
        prev = c
    index.append(len(text))
    return "".join(out), index


def clean(text):
    """(teks tersensor, jumlah kata yang kena)."""
    if not text:
        return text, 0
    norm, index = _normalise(text)
    spans = []
    for m in _PATTERN.finditer(norm):
        start = index[m.start()]
        end = index[m.end()] if m.end() < len(index) else len(text)
        spans.append((start, end))
    if not spans:
        return text, 0
    out = list(text)
    for start, end in spans:
        for i in range(start, min(end, len(out))):
            if not out[i].isspace():
                out[i] = "*"
    return "".join(out), len(spans)


def has_profanity(text):
    return clean(text)[1] > 0
