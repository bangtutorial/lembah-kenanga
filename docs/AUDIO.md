# AUDIO — Prompt Backsound Lembah Kenanga

Panduan untuk menggenerate musik latar sendiri (Suno, Udio, Sonilo, ElevenLabs Music, dll).
Prompt ditulis dalam bahasa Inggris karena generator musik jauh lebih patuh pada English; penjelasan dan catatan dalam Bahasa Indonesia.

---

## 1. Spesifikasi Teknis (wajib, biar langsung bisa dipasang)

| Hal | Nilai | Alasan |
|-----|-------|--------|
| Format | **OGG Vorbis** utama + **MP3** cadangan | OGG lebih kecil & loop-nya bersih; MP3 untuk Safari lama |
| Sample rate | 44.1 kHz stereo | standar web |
| Bitrate | OGG q4–q5 (±128 kbps) | trek 90 detik ≈ 1,4 MB |
| Durasi per trek | **60–120 detik** | cukup panjang agar tidak terasa berulang, cukup pendek agar unduhannya ringan |
| Loudness | sekitar **−18 LUFS** | musik latar harus di bawah SFX; kalau terlalu keras, semua efek tenggelam |
| Silence di awal/akhir | **0 detik** | satu celah senyap saja membuat loop terdengar "patah" |
| Dinamika | rata, tanpa build-up besar | trek diputar berjam-jam; crescendo dramatis cepat melelahkan |
| Vokal | tidak ada | lirik menarik perhatian dari gameplay |

**Loop mulus** adalah bagian tersulit. Tiga cara, urut dari yang paling gampang:

1. Minta generator membuat trek yang **berakhir di akor yang sama dengan pembukaannya**, lalu potong ekor gaungnya.
2. Kalau ada sisa gaung, potong 1–2 detik terakhir dan crossfade ke awal (Audacity: *Effect → Cross Fade Out/In*).
3. Kalau tetap terdengar sambungannya, pilih titik potong di **awal ketukan pertama sebuah bar**, bukan di tengah frasa.

Uji: putar file berulang 3× di pemutar musik. Kalau kamu bisa menunjuk kapan trek mengulang, loop-nya belum bersih.

**Tempat file:**

```
assets/audio/music/<id>.ogg
assets/audio/music/<id>.mp3
```

`<id>` memakai nama pada tabel di §2 (mis. `spring_day.ogg`). Nanti saya sambungkan lewat `assets/audio.json`.

---

## 2. Daftar Trek & Kapan Diputar

| Prioritas | id | Dipakai saat | Durasi |
|-----------|-----|--------------|--------|
| 1 | `spring_day` | Siang hari di lembah, musim Semi | 90 dtk |
| 1 | `night` | Pukul 19:00–02:00, semua musim | 90 dtk |
| 1 | `theme` | Homepage & layar judul | 60 dtk |
| 2 | `village` | Saat pemain berada di area plaza desa | 80 dtk |
| 2 | `rain` | Cuaca hujan (menimpa musik musim) | 80 dtk |
| 3 | `summer_day` | Siang, musim Panas | 90 dtk |
| 3 | `autumn_day` | Siang, musim Gugur | 90 dtk |
| 3 | `winter_day` | Siang, musim Dingin | 90 dtk |

Kalau mau hemat, **tiga trek prioritas 1 sudah cukup** untuk membuat game terasa hidup: siang, malam, dan tema homepage.

---

## 3. Prompt

### 3.1 Benang merah (tempelkan ke semua prompt)

Ini yang menjaga kedelapan trek terdengar seperti satu keluarga:

```
STYLE ANCHOR: cozy 16-bit farming game soundtrack, SNES-era instrumentation, warm and
nostalgic, gentle acoustic guitar and soft marimba over mellow synth pads, light hand
percussion, subtle Indonesian gamelan bell colour (saron/bonang) used sparingly as accent,
never as the lead. Simple diatonic melody that stays out of the way. Mixed soft and warm,
low dynamic range, no harsh highs.

TECHNICAL: instrumental only, no vocals, no lyrics, no spoken word. Seamless loop: end on
the same chord the piece opens with, no fade-in, no fade-out, no silence at the start or
end. Steady tempo, no rubato, no dramatic build-up, no drops, no risers, no cinematic
climax. Keep the arrangement thin — three or four instruments at once at most.
```

---

### 3.2 `spring_day` — Siang di Ladang, Musim Semi *(prioritas 1)*

```
Cozy 16-bit farming game soundtrack for a bright spring morning on a small Indonesian
village farm. Warm fingerpicked acoustic guitar carries a simple, hopeful melody in C
major; soft marimba doubles it an octave up on alternate bars; mellow analog synth pad
underneath; light shaker and a soft wooden clave on the off-beat; a few gentle gamelan
bell notes as sparkle every eight bars. Feels like sunlight on wet grass and the smell of
soil. Relaxed, unhurried, quietly optimistic.

Tempo 92 BPM. Key C major. Duration 90 seconds.

STYLE ANCHOR: cozy 16-bit farming game soundtrack, SNES-era instrumentation, warm and
nostalgic, gentle acoustic guitar and soft marimba over mellow synth pads, light hand
percussion, subtle Indonesian gamelan bell colour used sparingly as accent, never as the
lead. Simple diatonic melody that stays out of the way. Mixed soft and warm, low dynamic
range, no harsh highs.

TECHNICAL: instrumental only, no vocals, no lyrics. Seamless loop: end on the same chord
it opens with, no fade-in, no fade-out, no silence at start or end. Steady tempo, no
build-up, no drops, no risers, no cinematic climax. Three or four instruments at most.
```

---

### 3.3 `night` — Malam *(prioritas 1)*

```
Quiet night-time loop for a cozy 16-bit farming game. Very sparse: a slow felt-piano
motif of four or five notes with long gaps between phrases, a low warm synth pad breathing
underneath, occasional soft vibraphone note, and a distant low gamelan gong once every
sixteen bars. Suggests crickets, cool air and a lamp in the window without using field
recordings. Calm, safe, a little wistful — the feeling of a day's work finished.

Tempo 68 BPM. Key A minor. Duration 90 seconds.

STYLE ANCHOR: cozy 16-bit farming game soundtrack, SNES-era instrumentation, warm and
nostalgic, mellow synth pads, subtle Indonesian gamelan bell colour used sparingly as
accent. Mixed soft and warm, low dynamic range, no harsh highs.

TECHNICAL: instrumental only, no vocals. Seamless loop, ending on the same chord it opens
with, no fade-in or fade-out, no silence at start or end. Steady tempo, no build-up, no
percussion kit, no drums beyond a single soft heartbeat-like pulse if any at all. Two or
three instruments at most — emptiness is the point.
```

---

### 3.4 `theme` — Homepage / Layar Judul *(prioritas 1)*

```
Main theme for a cozy 16-bit Indonesian village farming game, played on the title screen.
The warmest and most melodic track of the set: acoustic guitar and marimba state a clear,
singable eight-bar melody, answered by soft flute (suling) and backed by a gentle synth
pad and light hand percussion; gamelan bells accent the end of each phrase. Nostalgic and
welcoming, like being handed the keys to your grandfather's farm. Slightly fuller
arrangement than the in-game tracks, but still gentle.

Tempo 88 BPM. Key G major. Duration 60 seconds.

STYLE ANCHOR: cozy 16-bit farming game soundtrack, SNES-era instrumentation, warm and
nostalgic, acoustic guitar and marimba over mellow synth pads, light hand percussion,
Indonesian suling flute and gamelan bell colour as accent. Mixed soft and warm.

TECHNICAL: instrumental only, no vocals. Seamless loop, no fade-in or fade-out, no silence
at start or end. Steady tempo, no dramatic climax. Four or five instruments at most.
```

---

### 3.5 `village` — Pusat Desa *(prioritas 2)*

```
Village square loop for a cozy 16-bit farming game. Livelier and more social than the farm
theme: a bouncy marimba and pizzicato-style plucked melody trade phrases, upright-bass-ish
low synth walks along underneath, light tambourine and woodblock keep a friendly shuffle,
and gamelan bonang answers the melody at the end of each phrase. Suggests a small market
morning: people chatting, shop doors opening, a fountain running. Cheerful but polite,
never loud.

Tempo 104 BPM. Key F major. Duration 80 seconds.

STYLE ANCHOR: cozy 16-bit farming game soundtrack, SNES-era instrumentation, warm and
nostalgic, marimba and plucked strings over mellow synth pads, light hand percussion,
Indonesian gamelan bonang as accent. Mixed soft and warm, low dynamic range.

TECHNICAL: instrumental only, no vocals. Seamless loop, no fade-in or fade-out, no silence
at start or end. Steady tempo, no build-up, no drops. Four instruments at most.
```

---

### 3.6 `rain` — Cuaca Hujan *(prioritas 2)*

```
Rainy-day loop for a cozy 16-bit farming game. Soft electric piano plays a slow, slightly
melancholy melody in a minor key; warm pad underneath; muted plucked guitar marks the
beat; a single vibraphone note answers each phrase. Cosy rather than sad — the feeling of
staying indoors and watching the fields drink. No actual rain sound effects: the rain
noise is handled by the game, so the music must stay clear of the high frequencies where
rain sits.

Tempo 76 BPM. Key D minor. Duration 80 seconds.

STYLE ANCHOR: cozy 16-bit farming game soundtrack, SNES-era instrumentation, warm and
nostalgic, electric piano and mellow synth pads. Mixed soft and warm, low dynamic range,
no bright cymbals, no hi-hats, nothing sizzly above 8 kHz.

TECHNICAL: instrumental only, no vocals, no rain or thunder sound effects. Seamless loop,
no fade-in or fade-out, no silence at start or end. Steady tempo, no build-up. Three
instruments at most.
```

---

### 3.7 `summer_day` — Musim Panas *(prioritas 3)*

```
Cozy 16-bit farming game loop for a hot, bright summer afternoon. Same instrument family
as the spring theme but sunnier and a touch busier: bright marimba leads, acoustic guitar
strums lightly on the off-beat, shaker and bongo-ish hand drum keep a lazy groove, warm
pad underneath, gamelan bells sparkle on phrase ends. Feels like heat shimmer over ripe
fields — energetic but too warm to hurry.

Tempo 100 BPM. Key D major. Duration 90 seconds.

STYLE ANCHOR: cozy 16-bit farming game soundtrack, SNES-era instrumentation, warm and
nostalgic, marimba and acoustic guitar over mellow synth pads, light hand percussion,
subtle gamelan bell accents. Mixed soft and warm, low dynamic range.

TECHNICAL: instrumental only, no vocals. Seamless loop, no fade-in or fade-out, no silence
at start or end. Steady tempo, no build-up, no drops. Four instruments at most.
```

---

### 3.8 `autumn_day` — Musim Gugur *(prioritas 3)*

```
Cozy 16-bit farming game loop for a golden autumn afternoon. Mellower and rounder than the
summer theme: warm nylon guitar carries the melody, soft flute answers it, vibraphone adds
colour, brushed light percussion, deep warm pad. A hint of bittersweetness — the harvest is
in, the days are getting shorter. Gentle, grateful, slightly slower breathing.

Tempo 84 BPM. Key A major with occasional minor colour. Duration 90 seconds.

STYLE ANCHOR: cozy 16-bit farming game soundtrack, SNES-era instrumentation, warm and
nostalgic, nylon guitar and flute over mellow synth pads, soft percussion, subtle gamelan
bell accents. Mixed soft and warm, low dynamic range.

TECHNICAL: instrumental only, no vocals. Seamless loop, no fade-in or fade-out, no silence
at start or end. Steady tempo, no build-up. Four instruments at most.
```

---

### 3.9 `winter_day` — Musim Dingin *(prioritas 3)*

```
Cozy 16-bit farming game loop for a still, cold winter day. The sparsest daytime track:
music box and glockenspiel state a simple, slightly fragile melody; a wide, soft pad holds
long chords underneath; a low warm bass note anchors each bar; almost no percussion,
perhaps a single soft tap per bar. Quiet, crystalline, peaceful — snow muffling every
sound. Not sad, just still.

Tempo 72 BPM. Key E minor resolving to G major. Duration 90 seconds.

STYLE ANCHOR: cozy 16-bit farming game soundtrack, SNES-era instrumentation, warm and
nostalgic, music box and glockenspiel over wide soft synth pads. Mixed soft and warm, low
dynamic range, no harsh highs despite the bell instruments.

TECHNICAL: instrumental only, no vocals. Seamless loop, no fade-in or fade-out, no silence
at start or end. Steady tempo, no build-up. Three instruments at most.
```

---

## 3.10 Status: TIDAK DIPAKAI LAGI — audio kini disintesis

Sejak audio dipindah ke sintesis Web Audio (lihat `DESIGN.md` §7, kode di `src/systems/audio.js`, diadopsi dari proyek **Game Cozy**), tidak ada file musik yang dimuat. Catatan di bawah disimpan sebagai arsip, kalau suatu saat mau kembali ke musik berbasis file — `tools/make_loop.py` dan `theme.ogg` masih ada di disk.

`Morning in Pixel Valley.mp3` dulu dipasang sebagai satu-satunya backsound:

- Sumber disimpan apa adanya di `assets/_raw/audio/morning_in_pixel_valley.mp3`.
- Diproses `python tools/make_loop.py` → `assets/audio/music/theme.ogg` (383 KB) + `.mp3` cadangan.
- 26,07 dtk → **24,87 dtk** setelah senyap dipangkas dan ekornya di-cross-fade 1,2 dtk ke kepala (equal-power), sehingga sambungan loop tidak terdengar.
- Dinormalisasi ke **−18 LUFS** supaya nanti tidak menenggelamkan SFX.
- Diputar lewat `AudioBufferSourceNode` dengan `loop = true` — sample-accurate, tanpa celah yang muncul kalau memakai tag `<audio loop>`.
- Volume default waktu itu 30 %; sekarang default musik **15 %** dan efek **60 %**, keduanya di menu jeda → Pengaturan.

Untuk menambah trek lain nanti, tinggal jalankan `make_loop.py` dengan `--out assets/audio/music/<id>`.

## 4. Setelah Trek Jadi

1. Taruh file di `assets/audio/music/` dengan nama sesuai tabel §2.
2. Beri tahu saya trek mana saja yang sudah ada — saya sambungkan ke engine: pemilihan trek berdasarkan waktu/musim/cuaca/lokasi, crossfade 1,5 detik saat berganti, bus musik terpisah dari SFX, dan `AudioContext` yang di-unlock pada klik pertama (browser memblokir audio sebelum ada interaksi pengguna).
3. Catat sumber tiap trek (generator, tanggal, prompt) di `assets/PROVENANCE.md` — sama seperti aset gambar.

**Catatan lisensi**: pastikan layanan yang kamu pakai memberi hak komersial atas hasilnya kalau game ini nanti dirilis publik. Suno dan Udio membedakan paket gratis dan berbayar untuk ini.

---

## 5. SFX (belum dibuat)

Efek suara belum masuk lingkup ini. Kalau nanti mau, ada dua jalan:

- **Digenerate** seperti musik (butuh ±12 klip pendek: langkah, cangkul, siram, panen, tebang, pecah batu, sabit, koin, klik UI, tidur, ayam, sapi), atau
- **Disintesis di browser** dengan Web Audio API — tanpa file, tanpa lisensi, bunyinya retro dan cocok dengan pixel art. Ini yang saya sarankan untuk SFX karena jumlahnya banyak dan durasinya sangat pendek.

Bilang saja kalau mau saya kerjakan salah satunya.
