# ASSETS — Rencana Manifest Aset Gambar (Lembah Kenanga)

Semua aset digenerate dengan Higgsfield **Nano Banana Pro** memakai prompt card di bawah, latar chroma #00FF00, lalu dinormalisasi Python. **1 baris = 1 kali generate (1 gambar)** kecuali ditulis lain. Status: `planned` → `generated` → `approved`.

Fase **A** = wajib untuk MVP (M2). Fase **B** = pelengkap (M3–M4). Fase **C** = stretch.

---

## Prompt card (blok tetap, disalin ke setiap prompt)

```
STYLE LOCK: 16-bit pixel art, oblique top-down view (ground seen flat from above,
buildings show front face + roof leaning back, no perspective lines), crisp hard
pixel clusters, no anti-aliasing, 1px dark outline (#3a2a2a, not pure black),
3-band cel shading, light from top-left, soft contact shadow bottom-right, warm
saturated palette (grass #6abe30, wood #c8843a, roof red #b8432e, water #3f8fd6),
cozy farm-sim proportions.
BACKGROUND: solid flat chroma green #00FF00, nothing else.
EXCLUDE: text, letters, numbers, labels, watermark, signature, UI frame, mockup,
scenery, ground tiles under object, blur, gradients, duplicate objects, cropped edges.
```

Blok spesifik aset ditambahkan setelahnya: subjek, ukuran grid, jumlah frame,
pivot. Setelah gaya visualnya disetujui, gambar yang sudah jadi selalu
dilampirkan sebagai referensi pada generate berikutnya — tanpa itu gaya antar
batch pelan-pelan menyimpang.

Latar hijau dihapus dengan `tools/chroma_key.py` di komputer sendiri, bukan
dengan fitur hapus-latar milik layanan generatornya: hasilnya bisa diperiksa,
diulang, dan disetel per aset.

## 0. Visual Target (M1) — 4 generate
Dipakai sebagai seed referensi untuk semua batch berikutnya.

| # | Aset | Ukuran akhir | Catatan |
|---|------|--------------|---------|
| VT1 | Pemain ♂ sheet 4×4 | 32×48/frame | Menjadi seed karakter |
| VT2 | Rumah pemain lv1 | 160×160 | Seed bangunan (oblique top-down) |
| VT3 | Pohon oak strip 4 musim | 64×96/kolom | Seed pohon & musim |
| VT4 | Tekstur rumput semi (seamless) | 32×32 | Seed terrain |

## 1. Karakter — 20 generate (Fase A: 12 · B: 8)
Sheet 4×4 (idle + 3 walk, 4 arah). Portrait 96×96 setengah badan.

| Nama | Peran | Lokasi utama | Romansa | Sheet | Portrait | Fase |
|------|-------|--------------|---------|-------|----------|------|
| Pemain ♂ | pemain | Farm | – | VT1 | 1 | A |
| Pemain ♀ | pemain | Farm | – | 1 | 1 | A |
| Pak Lurah Harun | kepala desa, quest | Balai Desa | – | 1 | 1 | A |
| Bu Sari | toko kelontong (benih, jual) | Toko | – | 1 | 1 | A |
| Bang Jaka | pandai besi (upgrade alat) | Pandai Besi | – | 1 | 1 | A |
| Kang Dadang | warung kopi (makanan) | Warung | – | 1 | 1 | A |
| Dokter Ratna | klinik (energi/obat) | Klinik | – | 1 | 1 | B |
| Nenek Wulan | nelayan tua, umpan | Pantai | – | 1 | 1 | B |
| Rani | pembudidaya bunga | Hutan | ✔ | 1 | 1 | B |
| Bayu | nelayan muda | Pantai/Warung | ✔ | 1 | 1 | B |

Subtotal: 10 sheet + 10 portrait = **20** (VT1 dihitung di §0 → 19 baru).

## 2. Hewan — 7 generate (A: 3 · B: 4)
| Aset | Frame | Ukuran | Fase |
|------|-------|--------|------|
| Ayam (kiri: idle, walk1, walk2, patuk) — kanan di-mirror | strip 4 | 32×32 | A |
| Sapi (kiri: idle, walk1, walk2, makan) | strip 4 | 48×48 | A |
| Anjing peliharaan (kiri: idle, walk1, walk2, duduk) | strip 4 | 48×48 | A |
| Kucing (kiri: idle, walk1, walk2, tidur) | strip 4 | 32×32 | B |
| Kupu-kupu (2 warna × 2 frame) | strip 4 | 16×16 | B |
| Burung kecil (idle, terbang1, terbang2, patuk) | strip 4 | 16×16 | B |
| Bayangan ikan di air (2 frame) | strip 2 | 32×16 | B |

## 3. Bangunan (oblique top-down) — 23 generate (A: 11 · B: 11 · C: 1)
| Area | Bangunan | Ukuran | Fase |
|------|----------|--------|------|
| Farm | Rumah pemain lv1 | 160×160 | VT2 |
| Farm | Rumah pemain lv2 (diperluas) | 192×160 | B |
| Farm | Kandang ayam | 128×96 | A |
| Farm | Kandang sapi (lumbung) | 192×160 | A |
| Farm | Sumur | 64×64 | A |
| Farm | Kotak jual (shipping bin) | 64×48 | A |
| Town | Balai Desa (jam di tengah) | 224×192 | A |
| Town | Toko Kelontong Bu Sari | 192×160 | A |
| Town | Pandai Besi (cerobong) | 160×160 | A |
| Town | Warung Kopi Kang Dadang | 160×128 | A |
| Town | Klinik Dokter Ratna | 160×160 | B |
| Town | Rumah warga A (biru) | 128×128 | B |
| Town | Rumah warga B (coklat) | 128×128 | B |
| Town | Rumah warga C (hijau) | 128×128 | B |
| Town | Air mancur (3 frame air) | strip 3 × 64×64 | B |
| Town | Papan pengumuman | 48×48 | A |
| Town | Lampu jalan | 32×64 | B |
| Forest | Pondok bunga Rani | 128×112 | B |
| Forest | Jembatan kayu (horizontal) | 96×64 | A |
| Beach | Pondok Nenek Wulan | 128×112 | B |
| Beach | Dermaga (segmen tiling + ujung) | 32×96 + 64×64 (1 gambar) | B |
| Beach | Perahu kayu | 96×64 | B |
| Mine | Pintu tambang di tebing | 128×128 | C |

## 4. Pohon & Alam — 16 generate (A: 8 · B: 8)
| Aset | Isi 1 gambar | Ukuran | Fase |
|------|--------------|--------|------|
| Oak 4 musim | strip 4 | 64×96/kolom | VT3 |
| Pinus (hijau, bersalju) | strip 2 | 64×112 | A |
| Cherry 4 tahap (berbunga, hijau, berbuah, gundul) | strip 4 | 64×96 | B |
| Pohon kelapa (pantai) | 1 | 64×112 | B |
| Semak (hijau, berbuah beri, gundul) | strip 3 | 32×32 | A |
| Tunggul + batang kayu tumbang | strip 2 | 64×32 | A |
| Batu kecil, batu sedang, batu besar | strip 3 | 32×32 / 48×48 / 64×48 | A |
| Rumput liar / gulma 4 varian | strip 4 | 32×32 | A |
| Bunga liar 4 warna | strip 4 | 32×32 | B |
| Jamur 3 jenis | strip 3 | 32×32 | B |
| Pagar kayu (H, V, tiang, sudut, gerbang) | strip 5 | 32×32 | A |
| Orang-orangan sawah | 1 | 32×64 | B |
| Kotak surat + papan nama ladang | strip 2 | 32×48 | A |
| Kerang, bintang laut, rumput laut, kayu apung | strip 4 | 32×32 | B |
| Lili air + alang-alang (tepi kolam) | strip 2 | 32×32 | B |
| Tumpukan jerami + tong kayu + peti kayu | strip 3 | 32×32 | B |

## 5. Terrain (tekstur seamless 32×32) — 11 generate (A: 8 · B: 3)
| Aset | Fase |
|------|------|
| Rumput semi | VT4 |
| Rumput panas, gugur (strip 2) | B |
| Salju (musim dingin) | B |
| Tanah/jalan setapak | A |
| Tanah tercangkul kering | A |
| Tanah tercangkul basah | A |
| Pasir | A |
| Batu plaza desa | A |
| Air (3 frame animasi, strip) | A |
| Lantai kayu interior | A |
| Dinding interior (papan kayu, strip: tengah + tepi) | A |

Transisi antar terrain (rumput→tanah, rumput→pasir, pasir→air, dll.) **tidak digenerate** — dibuat prosedural oleh `tools/terrain_edges.py`.

## 6. Tanaman (strip 5 tahap, 32×48/tahap) — 8 generate (A: 4 · B: 4)
| Tanaman | Musim | Hari tumbuh | Fase |
|---------|-------|-------------|------|
| Lobak | Semi | 4 | A |
| Kentang | Semi | 6 | A |
| Stroberi | Semi | 8 (berulang) | B |
| Tomat | Panas | 10 (berulang) | A |
| Jagung | Panas–Gugur | 12 (berulang) | B |
| Cabai | Panas | 5 (berulang) | A |
| Labu | Gugur | 13 | B |
| Kubis | Gugur | 9 | B |

## 7. Ikon Item (grid 4×4 = 16 ikon/gambar, 32×32) — 4 generate (A: 3 · B: 1)
| Sheet | Isi (urutan kiri→kanan, atas→bawah) | Fase |
|-------|-------------------------------------|------|
| items_tools | cangkul, penyiram, kapak, beliung, sabit, pancing, kayu, batu, serat, bijih tembaga, bijih besi, batubara, telur, susu, wol*, pakan ternak | A |
| items_crops | 8 hasil panen (lobak…kubis) + 8 benihnya | A |
| items_forage_fish | jamur, beri, bunga, kerang, rumput laut, kayu apung, madu*, sarang* + 6 ikan (mujair, lele, gurame, kakap, tongkol, cumi) + sampah + umpan | A |
| items_food_misc | roti, nasi, sup, kopi, salad, jus, hadiah, surat, kunci, koin, jam, hati, bintang, peta, tas, buku | B |

(* = cadangan untuk fitur lanjutan.) ≈ 64 ikon.

## 8. UI — 9 generate (A: 6 · B: 3)
| Aset | Ukuran | Fase |
|------|--------|------|
| Panel kayu 9-slice | 96×96 | A |
| Tombol kayu 3 state (normal, hover, tekan) | strip 3 × 96×32 | A |
| Kotak dialog + bingkai portrait | 960×160 + 112×112 (1 gambar) | A |
| Slot inventori (kosong, terpilih) + slot hotbar | strip 3 × 40×40 | A |
| Bar energi vertikal (bingkai + isi) & ikon uang | 1 gambar | A |
| Ikon cuaca (cerah, hujan, salju, angin) + ikon 4 musim | strip 8 × 24×24 | A |
| Kursor (panah, tangan, target tile) | strip 3 × 24×24 | B |
| Bar mini-game memancing (bingkai + ikan + zona hijau) | 1 gambar | B |
| Ikon hati relasi (kosong, setengah, penuh) | strip 3 × 16×16 | B |

## 9. Interior — 3 generate (A: 2 · B: 1)
| Aset | Isi | Fase |
|------|-----|------|
| Furnitur rumah sheet A | tempat tidur, meja, kursi, lemari, TV, karpet, lampu, peti | A |
| Furnitur rumah sheet B | kompor/dapur, rak buku, jendela, pintu, jam dinding, pot bunga, perapian, bufet | B |
| Counter toko + rak barang + tungku pandai besi + ranjang klinik | strip 4 | A |

## 10. Efek — 2 generate (A: 1 · B: 1)
| Aset | Isi | Fase |
|------|-----|------|
| Partikel: tetes hujan, salju, daun gugur, kilau (4 × 2 frame) | strip 8 × 16×16 | A |
| Percikan air, debu langkah, "zzz" tidur, pukulan alat (4 × 3 frame) | strip 12 × 32×32 | B |

## 11. Homepage — 3 generate (A: 3)
| Aset | Ukuran | Catatan |
|------|--------|---------|
| Latar hero desa (pemandangan ladang + desa + gunung) | 1920×1080 | Boleh gaya "poster" seperti key art Stardew |
| Logo judul "Lembah Kenanga" (kayu + daun) | 1024×512 | Satu-satunya aset dengan teks |
| Ornamen tab/pembatas (papan kayu, tali, daun) | 1 gambar strip | |

---

## Rekap Jumlah Generate

| Kategori | Fase A | Fase B | Fase C | Total |
|----------|--------|--------|--------|-------|
| Visual target | 4 | – | – | 4 |
| Karakter (sheet + portrait) | 11 | 8 | – | 19 |
| Hewan | 3 | 4 | – | 7 |
| Bangunan | 10 | 11 | 1 | 22 |
| Pohon & alam | 7 | 8 | – | 15 |
| Terrain | 7 | 3 | – | 10 |
| Tanaman | 4 | 4 | – | 8 |
| Ikon item | 3 | 1 | – | 4 |
| UI | 6 | 3 | – | 9 |
| Interior | 2 | 1 | – | 3 |
| Efek | 1 | 1 | – | 2 |
| Homepage | 3 | – | – | 3 |
| **Total** | **61** | **44** | **1** | **106** |

Perkiraan dengan regenerate/perbaikan ~20 %: **±125 generate** untuk keseluruhan; **±73** untuk MVP (Fase A).

## Frame per aset (untuk kode)
- Karakter: 16 frame (4 arah × 4). Hewan: 4 frame kiri + mirror. Air: 3 frame @ 4 fps. Kupu-kupu/burung: 2 frame @ 6 fps. Air mancur: 3 frame @ 5 fps. Walk karakter: 4 frame @ 8 fps.

---

# STATUS PRODUKSI (diperbarui 2026-09-08)

## Selesai — Batch A (53 entri manifest, 2,97 MB)

| Kategori | Aset yang sudah jadi |
|----------|----------------------|
| Karakter | player_m, player_f, npc_harun, npc_sari (sheet 4×4, 32×48) + 4 portrait 96×96 |
| Hewan | chicken 26×24, dog 34×30, cow 60×40 — strip 4 frame hadap kiri, kanan di-mirror kode (ukuran relatif karakter 32×48) |
| Bangunan Farm | house_lv1, coop, barn, well, shipping_bin |
| Bangunan Town | town_hall, store, warung, blacksmith, town_props (papan, air mancur, lampu) |
| Alam | oak 4 musim (80×96), pine 2 varian, bridge, bush 3, rocks 3, weeds 4, props 4 (mailbox/sign/stump/log), **fence 8 tile** (h, v, post, 4 sudut, gerbang — disusun ulang oleh `tools/build_fence.py`) |
| Terrain | grass_spring, dirt, tilled_dry, tilled_wet, water (3 frame), sand, plaza, wood_floor, wall |
| Tanaman | turnip, potato, tomato, chili (strip 5 tahap, 32×48) |
| Ikon item | items_tools, items_crops, items_forage_fish (3 sheet × 16 = 48 ikon 32×32) |
| UI | panel 9-slice, buttons 3 state, slots 3, hud_bits 5, icons_ws 8 (cuaca+musim) |
| Interior | furniture 8, shop_props 4 |
| Efek | particles 8 |
| Homepage | hero key art 1920×1072, logo, ornamen (sign, divider) |

Verifikasi: `python tools/mock_scene.py` merangkai semuanya jadi satu adegan pada skala game (`assets/scene_batchA.png`).

## Selesai — Batch B1 (2026-09-08)

6 NPC sisa: **Bang Jaka, Kang Dadang, Dokter Ratna, Nenek Wulan, Rani, Bayu** —
sheet 4×4 (32×48) + portrait 96×96, 13 generate (portrait Rani dua kali).
Terdaftar di `manifest.json` dan `scale.json`; `check_scale.py` bersih (52 sprite).
Jaka & Dadang sudah berdiri di depan bengkel dan warung; empat sisanya menunggu
lokasinya dibangun di Batch B2.

## Selesai — Batch B2 (2026-09-08)

Hutan, distrik selatan, dan pantai — 13 generate (dermaga dua kali, rumah warga
sekali gagal di server):

| Kategori | Aset |
|----------|------|
| Bangunan | clinic 192×160, hut_rani 128×128, hut_wulan 128×128, houses_villager (strip 3 × 128×128), dock 96×160, boat 96×64 |
| Alam | coconut 80×128, flowers (strip 4), mushrooms (strip 3), lilypads (strip 3), beach_items (strip 4) |

Peta diperluas 46×30 → **48×48** (batas `LAYOUT.maxSpan`). Audit tata letak
bersih: kepadatan 44 %, ruang kosong terbesar 7×7, tiap distrik ≤ 25 tile dari
tetangganya. `check_scale.py` bersih (63 sprite).

## Selesai — Batch B3 (2026-09-08)

Memancing — 3 generate:

| Aset | Isi |
|------|-----|
| `ui_fishing_track/zone/fill` | satu gambar berisi tiga keping gauge, dipisah `tools/build_fishing_ui.py` |
| `fish_shadow` | strip 3 frame siluet ikan di bawah permukaan |
| `bobber` | strip 3 frame pelampung: tenang, tersentak, tercebur |

Ikon ikan/umpan/pancing sudah ada sejak Fase A.

## Selesai — Batch B4a (2026-09-08)

Satwa penghias — 6 generate (burung dua kali):

| Aset | Frame | Ukuran | Di mana |
|------|-------|--------|---------|
| butterfly | 4 | 20×20 | hutan — siang |
| bird | 4 | 26×24 | disembunyikan (`off: true` di `critters.js`) |
| dragonfly | 3 | 30×32 | tepi kolam air tawar — siang |
| crab | 3 | 26×22 | pasir pantai — siang |
| firefly | 3 | 20×20 | hutan — malam |

## Selesai — Batch B5 (2026-09-08)

Dua karakter pemain tambahan, jadi empat pilihan: **player_m2** (berkacamata,
kemeja hijau) dan **player_f2** (berkerudung krem, tunik marun). Sheet 4×4
(32×48) + portrait 96×96, 4 generate.

## Selesai — Batch B6 (2026-09-09)

Menu warung — 1 generate, sheet `items_food_misc` 4×2 (bukan 4×4: hanya 8 ikon
dibutuhkan, jadi tiap ikon dapat ruang lebih besar dan hasilnya lebih tajam):

| # | Item | Energi | Beli |
|---|------|--------|------|
| 0 | Teh Manis | 20 | G35 |
| 1 | Kopi | 30 | G60 |
| 2 | Pisang Goreng | 35 | G70 |
| 3 | Jamu | 40 | G90 |
| 4 | Es Kelapa | 45 | G110 |
| 5 | Nasi Goreng | 70 | G180 |
| 6 | Bakso | 80 | G220 |
| 7 | Soto Ayam | 95 | G260 |

Dua pilihan pipeline yang baru:

1. **`chroma_key.py --hard`** membuang semua piksel yang tidak buram penuh.
   Model menggambar bayangan kontak setengah tembus di bawah tiap ikon — salah
   untuk kotak inventori — dan menyelipkan garis hijau tipis antara benda dan
   bayangannya. Keduanya setengah tembus sedangkan badan ikonnya buram penuh,
   jadi satu ambang alfa memisahkannya bersih.
2. **`chroma_key.py --unspill N`** menurunkan hijau di piksel mana pun yang
   dominasinya di atas N, bukan hanya di tepi. Gelas bening ditembus warna
   latar sampai ke tengah, jauh dari tepi mana pun, sehingga despill biasa
   tidak pernah sampai ke sana. Dominasi hijau saja tidak cukup memisahkannya
   dari daun bawang dan irisan timun; yang memisahkan adalah merah dan birunya
   (pigmen hijau: median r 51-59; limbah latar di gelas: median r 121-146).

`check_scale.py` bersih (77 sprite).

## Belum dibuat (Fase B)

- Bangunan: rumah lv2, pintu tambang
- Alam: cherry 4 tahap, jerami/tong/peti, orang-orangan sawah
- Terrain: tile transisi pasir↔rumput dan air↔darat

**Dicoret dari Fase B atas permintaan user (2026-09-08):** 4 tanaman baru (stroberi, jagung, labu, kubis) dan kucing. Ikon panen + benih keempat tanaman itu sudah terlanjur ada di sheet `items_crops` Fase A dan sudah terdaftar di `items.json`/`shops.json`; yang belum ada hanya strip 5 tahap tumbuhnya. Kalau nanti dihidupkan, tinggal generate 4 strip lalu tambah entri di `crops.json`.
- UI: kursor
- Efek: percikan air, debu langkah, zzz, pukulan alat

## Skrip pipeline yang dipakai

`chroma_key.py` (+`--keep-center`, `--erode`, `--greenness`, `--unspill`, `--hard`) · `slice_grid.py` (+`--auto-bbox`, `--uniform-scale`, `--fix-flips`, `--pivot`) · `normalize.py` · `tile_check.py` (+`--punch`, `--crop`) · `collapse_gaps.py` (atap melayang) · `strip_ground.py` (rumput terpanggang) · `contact_sheet.py` · `mock_scene.py`
