"""Turn a generated music file into a seamless game loop.

Three things break loops in practice and this fixes all of them:
  1. MP3 encoder padding — silent samples the encoder adds at both ends. We
     decode to raw PCM first, so the padding never reaches the game.
  2. Silence the composer left in — trimmed against a -60 dBFS threshold.
  3. The end not matching the beginning — the tail is cross-faded onto the head
     (a "wrap" fade), so the last sample flows into the first one.

Output is OGG (played by the game) plus an MP3 fallback for older Safari, both
loudness-normalised to about -18 LUFS so music sits under the sound effects.

Usage:
  python tools/make_loop.py "in.mp3" --out assets/audio/music/theme --xfade 1.2
"""
import argparse
import os
import subprocess
import sys
import wave

import numpy as np

FFMPEG = "ffmpeg"


def run(*args):
    r = subprocess.run([FFMPEG, "-v", "error", "-y", *args], capture_output=True, text=True)
    if r.returncode:
        sys.exit(f"ffmpeg gagal: {r.stderr.strip()[:400]}")


def read_wav(path):
    with wave.open(path, "rb") as w:
        rate, ch, n = w.getframerate(), w.getnchannels(), w.getnframes()
        raw = w.readframes(n)
    data = np.frombuffer(raw, dtype="<i2").astype(np.float32) / 32768.0
    return data.reshape(-1, ch), rate


def write_wav(path, data, rate):
    clipped = np.clip(data, -1.0, 1.0)
    pcm = (clipped * 32767.0).astype("<i2")
    with wave.open(path, "wb") as w:
        w.setnchannels(data.shape[1])
        w.setsampwidth(2)
        w.setframerate(rate)
        w.writeframes(pcm.tobytes())


def trim_silence(x, rate, floor_db=-60.0):
    """Drop leading/trailing samples quieter than `floor_db`."""
    amp = np.abs(x).max(axis=1)
    thr = 10 ** (floor_db / 20)
    loud = np.where(amp > thr)[0]
    if len(loud) == 0:
        return x
    return x[loud[0]:loud[-1] + 1]


def wrap_crossfade(x, rate, seconds):
    """Fold the tail onto the head with an equal-power fade.

    Equal-power (sqrt) rather than linear: a linear cross-fade dips in
    perceived loudness in the middle, which is audible as a dent every loop.
    """
    n = int(seconds * rate)
    if n <= 0 or len(x) <= n * 2:
        return x
    head, tail = x[:n].copy(), x[-n:].copy()
    t = np.linspace(0, 1, n, dtype=np.float32)[:, None]
    mixed = head * np.sqrt(t) + tail * np.sqrt(1 - t)
    out = x[:-n].copy()
    out[:n] = mixed
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("--out", required=True, help="output path without extension")
    ap.add_argument("--xfade", type=float, default=1.2, help="cross-fade seconds")
    ap.add_argument("--lufs", type=float, default=-18.0)
    ap.add_argument("--rate", type=int, default=44100)
    a = ap.parse_args()

    os.makedirs(os.path.dirname(a.out) or ".", exist_ok=True)
    tmp_in = a.out + "._decoded.wav"
    tmp_out = a.out + "._loop.wav"

    # decode + loudness normalise in one pass; strip any cover art stream
    run("-i", a.src, "-vn", "-map", "0:a:0",
        "-af", f"loudnorm=I={a.lufs}:TP=-1.5:LRA=11",
        "-ar", str(a.rate), "-ac", "2", "-c:a", "pcm_s16le", tmp_in)

    x, rate = read_wav(tmp_in)
    before = len(x) / rate
    x = trim_silence(x, rate)
    x = wrap_crossfade(x, rate, a.xfade)
    write_wav(tmp_out, x, rate)
    after = len(x) / rate

    run("-i", tmp_out, "-c:a", "libvorbis", "-q:a", "5", a.out + ".ogg")
    run("-i", tmp_out, "-c:a", "libmp3lame", "-b:a", "128k", a.out + ".mp3")
    os.remove(tmp_in)
    os.remove(tmp_out)

    sizes = {e: os.path.getsize(f"{a.out}.{e}") // 1024 for e in ("ogg", "mp3")}
    print(f"ok {a.out}.ogg / .mp3")
    print(f"  durasi {before:.2f}s -> {after:.2f}s (cross-fade {a.xfade}s)")
    print(f"  ukuran {sizes['ogg']} KB (ogg), {sizes['mp3']} KB (mp3), {rate} Hz stereo, ~{a.lufs} LUFS")


if __name__ == "__main__":
    main()
