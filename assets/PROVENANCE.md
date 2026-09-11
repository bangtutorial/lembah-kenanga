# PROVENANCE — catatan sumber aset

Semua gambar: Higgsfield, model `nano_banana_pro` (dilaporkan server sebagai nano_banana_2), 1k, 1:1, latar chroma #00FF00, dikey + dinormalisasi dengan `tools/`. Tanggal: 2026-09-08.

| Aset | job_id | Referensi | Status |
|------|--------|-----------|--------|
| characters/player_m (seed) | c4abe015-64ff-4a78-be31-7f42f2189349 | – | approved |
| characters/player_f | c09e6645-26f9-46cc-a288-2817bd205ed3 | player_m | approved |
| characters/npc_harun | fa891256-2dea-4a9c-b389-2cd7dd7541b9 | player_m | approved |
| characters/npc_sari | 3473a52b-3aaf-4ce5-a185-5000ed2a320d | player_m | approved |

Raw: `assets/_raw/characters/<nama>_sheet.png` (jangan dihapus). Blok prompt tetapnya ada di `docs/ASSETS.md`.

## Batch 2 — portrait + visual target lingkungan (2026-09-08)
| Aset | job_id | Referensi | Status |
|------|--------|-----------|--------|
| portraits/npc_harun | 208de57a-19b6-4766-8db0-44fc604a4b1d | sheet harun | approved |
| portraits/npc_sari | 4d5376ea-74c2-481b-8001-a7bc9d4a795f | sheet sari | approved |
| portraits/player_m (v1, ada sprite nyasar) | aa4d5d89-76d5-4f99-8a87-889cc739dcb3 | sheet player_m | rejected |
| portraits/player_f (v1, ada sprite nyasar) | 8f4921d2-8f3c-4d65-977b-96c8425f8a49 | sheet player_f | rejected |
| buildings/house_lv1 v1 (semi-isometrik) | 84dfe3a9-090c-4200-b872-3d61f8c70685 | sheet player_m | rejected — raw disimpan sebagai house_lv1_v1? tidak; ditimpa |
| buildings/house_lv1 v2a (elevasi depan datar) | 8021582f-f889-43cf-a9b1-6e7e63df7454 | – | cadangan (raw house_lv1_v2a.png) |
| buildings/house_lv1 v2b (dipakai) | 28334aac-9de5-4f96-89e3-07c338dd9189 | – | approved |
| nature/oak_seasons (baris atas dipakai) | ceaeaa23-eeae-4b67-a889-29ee9ef2ccfd | sheet player_m | approved |
| terrain/grass_spring | 6779b103-b592-4587-a281-cafce8eafc19 | – | approved |

Pelajaran: (1) referensi sheet bisa ikut tergambar di latar → prompt portrait harus menegaskan "exactly ONE figure, do not copy the reference"; (2) untuk bangunan, jangan sertakan referensi sprite & pakai kalimat "flat 2D paper cut-out: front wall + roof rectangle, vertical left/right edges"; (3) despill hanya di tepi, kalau tidak daun hijau rusak.
| portraits/player_m v2 (dipakai) | 6b2793e5-5581-4edb-90c9-df386cb3493d | sheet player_m + instruksi "one figure" | approved |
| portraits/player_f v2 (masih nyasar) | 00cfdcf8-66db-4a09-b983-f1d12e69a6ed | sheet player_f | rejected |
| portraits/player_f v3 (dipakai, tanpa referensi) | f146ded3-29a9-4682-a2d7-1eeb3deb789d | – | approved |

## Batch A gelombang 1 (2026-09-08)
| Aset | job_id | Status |
|------|--------|--------|
| terrain/dirt (v1 gagal server, v2) | 87fe0f86-de62-4ef3-9f44-1a45ed914195 | approved |
| terrain/tilled_dry | d56b8def-11d7-4c55-b053-0fbe055e58d1 | approved |
| terrain/tilled_wet | e76c4dde-220b-48f7-956b-eaec40f3e48e | approved |
| terrain/water (3 frame, dipotong dari kotak berpembatas hitam) | d8518232-39b8-4bc9-a967-4e056a09d1c5 | approved |
| crops/turnip, potato, tomato, chili | 29f16b64…, c66f13d2…, 801c94ea…, d5ce458c… | approved |
| items/items_tools | 179a421b-9039-4a5b-aba7-7c5ec765d8a5 | approved |
| items/items_crops | 6db9649d-3fd8-4ad8-b3d7-4ac765e96757 | approved |
| items/items_forage_fish (v1 gagal server, v2) | 0a67c415-38ea-45c9-b560-4057efa15d24 | approved |
| nature/fence (5 potong) | 55a8506c-f11d-43a9-a6f2-215dca74ae45 | approved |

## Batch A gelombang 2 (2026-09-08)
| Aset | job_id | Status |
|------|--------|--------|
| buildings/coop | 4640a184-549c-40d5-a71e-fa403e4d03fc | approved |
| buildings/barn (strip rumput di dasar dipotong) | c544cfeb-7770-4d2b-b21c-4b6b87f48a25 | approved |
| buildings/well + shipping_bin (1 gambar) | b1e90bc5-c8dd-4f6b-8a7f-90a31ef2d342 | approved |
| nature/rocks (3) | 3522db5f-4be1-49ef-89e7-bc95c59bccd4 | approved |
| nature/weeds (4) | 541c5681-75fc-43ce-b0fd-1d8b1fd1bb4d | approved |
| nature/bush (3 varian) | bdc54722-89b9-4881-b8ef-dffc648114ee | approved |
| nature/props (mailbox, sign, stump, log) | 2a355304-d1ec-4d22-984b-0eb0bd13af2d | approved |
| ui/panel 9-slice | 05dc2941-8737-4e8d-a814-8de4e94c88c9 | approved |
| ui/buttons (3 state) | fb8177ee-36e6-4562-87ea-6cc2b89ec1ca | approved |
| ui/slots (3) | e216145e-8ec1-4262-a3b4-ff712ec8a1f6 | approved |
| ui/hud_bits (energy frame, fill*, coin, heart, arrow) | daac74b7-fec8-412d-91ad-71a42a8d9fe0 | approved (*fill digambar kode) |
| ui/icons_ws (4 cuaca + 4 musim) | d7a98629-e3e7-4026-8fba-58bca538cf29 | approved |

## Batch A gelombang 3-4 (2026-09-08)
| Aset | job_id | Status |
|------|--------|--------|
| animals/chicken | 3887bca8-cbf0-4508-9999-d6dcb4ab0e44 | approved |
| animals/cow | 37bf7a6a-4cf3-4aac-b019-d4943cb000be | approved |
| animals/dog | 0d9feb0a-e284-49d4-9483-8abf2eb7cec4 | approved |
| buildings/town_hall v1 (atap melayang) | f11f19f9-d963-4f82-88c2-6263d10a8d92 | rejected |
| buildings/town_hall v2 | f6f52c22-391b-438f-ae65-dac64e746079 | approved |
| buildings/store v1 (atap melayang) | 000a6196-b86e-46c6-ae1e-7e7858c77dd2 | rejected |
| buildings/store v2 | 85500d41-d4f7-4220-8220-278fcda6b2d2 | approved |
| buildings/blacksmith (gap atap dirapatkan Python) | a2930219-e799-4b16-9fb3-d59f19aa0075 | approved |
| buildings/warung v1, v2 (isometrik) | 5241d450…, 5520b385… | rejected |
| buildings/town_props (papan, air mancur, lampu) | bd96b655-268b-40f1-85ad-ddb4f6abae4d | approved |
| nature/pine + bridge | d009c895-f30f-44c6-be15-fb911663ce30 | approved |
| terrain/sand | 57d8665b-89aa-43dd-b044-bf1e3f8d0518 | approved |
| terrain/plaza | a5995d95-0882-4ce2-8ef6-e0a3abf9c8d3 | approved |
| terrain/wood_floor + wall | ba56b10d-16e1-490b-8cd9-0b1a5983329f | approved |
| interior/furniture (8) | f24d4015-7740-4efd-bcf5-5dd50f60a27e | approved |
| interior/shop_props (4) | c6e7f0f2-fdc5-450e-b71d-575a90798cce | approved |
| fx/particles (8) | c2a27f8a-3ea1-43e2-b456-6b8b3a3f40cb | approved |
| homepage/hero key art | 25afcd28-47d1-4362-b18c-3425beeb7f59 | approved |
| homepage/logo | 2aaf9d98-0dc5-4637-874c-ec5ec270999d | approved |
| homepage/ornaments (sign, divider dipakai) | 0538a6a2-a882-4180-904b-94253465e9d7 | approved |

Pelajaran tambahan: (1) beberapa bangunan digambar dengan atap melayang terpisah dari dinding -> `tools/collapse_gaps.py` merapatkan baris transparan di dalam objek; (2) prompt bangunan harus menegaskan "roof eave TOUCHES the top edge of the wall, one continuous shape"; (3) untuk gaya yang sulit (warung), lampirkan bangunan yang sudah disetujui sebagai referensi sudut pandang.

## Perbaikan pasca-review (2026-09-08)
| Aset | job_id | Status |
|------|--------|--------|
| nature/fence v1 (potongan vertikal digambar diagonal) | 55a8506c-f11d-43a9-a6f2-215dca74ae45 | rejected |
| nature/fence v2 | 79466618-6b01-4994-badc-72dfbe4c98a7 | approved |

Pelajaran: untuk tile-set berarah, jelaskan tiap potongan satu per satu ("VERTICAL RUN: post di tengah, rail lurus ke atas dan ke bawah, bukan rotasi potongan horizontal") — daftar singkat seperti "H, V, tiang, sudut, gerbang" membuat model menggambar versi miring.

Hewan di-normalisasi ulang tanpa generate baru: ayam 26×24, anjing 34×30, sapi 60×40 (sebelumnya semua dipaksa ke kotak 32/48 sehingga anjing tampak sebesar sapi).

## Air mancur animasi (2026-09-08)
| Aset | Model | job_id | Status |
|------|-------|--------|--------|
| fountain statis | Nano Banana Pro | bd96b655-268b-40f1-85ad-ddb4f6abae4d | superseded |
| fountain 4 frame | Nano Banana Pro | 3f8e5dc1-7269-4114-ad9f-f13374ca338c | superseded |
| **fountain 6 frame** | **GPT Image 2** (2k, quality high, 21:9) | 5a2eb588-80d3-48c9-849a-7aa55ba97c56 | approved |

GPT Image 2 memberi pixel cluster yang jauh lebih bersih dan basin yang benar-benar identik di keenam frame — Nano Banana Pro menggeser sedikit bentuk basin antar frame. Ukuran akhir 128×176 px (basin 4 tile, pancaran menjulang ke atas), diproses `tools/build_fountain.py`.

Bar energi lama (`ui_energy_frame` / `ui_energy_fill`) dihapus dari manifest dan disk: bingkai gelapnya mengambang di tepi kanan layar dan terbaca sebagai kotak hitam asing. Energi sekarang digambar sebagai bar tipis di dalam panel jam.

## Musik (2026-09-08)
| Aset | Sumber | Status |
|------|--------|--------|
| `audio/music/theme.ogg` + `.mp3` | "Morning in Pixel Valley.mp3" — digenerate user di luar Higgsfield | approved |

Higgsfield tidak dipakai untuk musik: model `sonilo_music` dan `mirelo_text_to_audio` dikunci untuk pipeline game internal mereka, dan `generate_audio` umum hanya melayani text-to-speech. Prompt untuk menggenerate trek tambahan ada di `AUDIO.md`.

Pemrosesan: `tools/make_loop.py` (decode → loudnorm −18 LUFS → potong senyap → cross-fade ekor ke kepala 1,2 dtk → encode OGG q5 + MP3 128k). Raw disimpan di `assets/_raw/audio/`.

## Batch B1 — 6 NPC sisa: sheet + portrait (2026-09-08)

Model `nano_banana_pro`, 1:1, 2048², latar chroma #00FF00. Sheet memakai sheet
`player_m` sebagai referensi gaya; portrait memakai sheet karakter itu sendiri.

| Aset | job_id | Referensi | Status |
|------|--------|-----------|--------|
| characters/npc_jaka | ebe878d4-3ab8-490c-9190-af95d2776953 | player_m sheet | approved |
| characters/npc_dadang | 650a69d4-9437-4281-928a-4fe9a79771ce | player_m sheet | approved |
| characters/npc_ratna | 0c0e866e-b8ae-4829-be88-b1696672a3e9 | player_m sheet | approved |
| characters/npc_wulan | 5eccfa33-9788-4b81-827b-f85e4068357c | player_m sheet | approved |
| characters/npc_rani | 34242174-4d7c-4d4e-8725-c250dff937fa | player_m sheet | approved |
| characters/npc_bayu | cadd3dc7-5705-42ce-9bf3-a6b3cb7572a4 | player_m sheet | approved |
| portraits/npc_jaka | 126e094a-7525-45d8-994d-45b2c8e20748 | sheet jaka | approved |
| portraits/npc_dadang | 9192bff7-a54b-4184-a95c-70609e73f4bc | sheet dadang | approved |
| portraits/npc_ratna | 72c6b72b-358d-4434-a2e0-e818ce7a5dd4 | sheet ratna | approved |
| portraits/npc_wulan | 9645dcb7-4126-4cd3-8209-6d34346465d6 | sheet wulan | approved |
| portraits/npc_rani v1 (3 sprite nyasar dari referensi) | d8b4a192-8bb8-4f67-8586-0887079c5530 | sheet rani | rejected |
| portraits/npc_rani v2 (dipakai, tanpa referensi) | 43744bb2-1476-490d-97ac-d352d59956c0 | – | approved |
| portraits/npc_bayu | bf16dde8-532c-4eb0-b62e-4062525090f3 | sheet bayu | approved |

Pelajaran baru:

1. **Peran media harus `image_references`**, bukan `reference` — Nano Banana Pro
   menolak nama peran lain dan seluruh batch gagal terkirim.
2. **Rumput ikut terpanggang di kaki.** Warnanya hijau rumput biasa, bukan chroma,
   jadi `chroma_key.py` melewatkannya; dan karena berada di bawah sepatu,
   `--auto-bbox` ikut menghitungnya sehingga baseline sprite melorot. Ditangani
   `tools/strip_grass.py` (menyapu pita bawah tiap sel saja, sebelum dipotong).
   Untuk karakter berpakaian hijau (Rani) pakai `--margin 60 --band 0.12`, kalau
   tidak gaunnya ikut terhapus.
3. Bug "sprite referensi nyasar ke latar portrait" **masih ada** meski prompt sudah
   berisi larangan eksplisit. Obatnya tetap sama seperti `player_f`: generate ulang
   **tanpa gambar referensi sama sekali**.

## Batch B2 — hutan, distrik selatan, dan pantai (2026-09-08)

| Aset | job_id | Status |
|------|--------|--------|
| buildings/clinic | 9b53f372-93d0-4d74-94b7-09dfb45a06b0 | approved |
| buildings/hut_rani | 0ab92b79-c27e-481e-8267-9fbab5123a98 | approved |
| buildings/hut_wulan | 1fd5205f-a238-40f7-b47c-51e63def17ef | approved |
| buildings/houses_villager v1 | 3dc66fef-9914-499d-a4e7-8ff0ef511b8b | failed (server) |
| buildings/houses_villager v2 (strip 3) | 39cfef89-5642-4ec8-9e68-0508faecbd46 | approved |
| buildings/dock v1 (jadi panel pagar mendatar) | c00a0988-a42e-497d-878b-8a10fb71500d | rejected |
| buildings/dock v2 (dipakai) | e546587a-51dd-4ed0-b6f3-08d3f203795d | approved |
| buildings/boat | b70d6593-5762-4143-8355-70ae20afd8b4 | approved |
| nature/coconut | 5c3eb303-0604-452c-bee2-9412cb318d2a | approved |
| nature/flowers (strip 4) | c63d1a55-a721-49be-8e97-788eff3b0f8d | approved |
| nature/mushrooms (strip 3) | 6a1cd903-6f76-4e46-b4d1-b090463a0244 | approved |
| nature/lilypads (strip 3) | a6571002-e551-4dff-aa2a-71d9d6502171 | approved |
| nature/beach_items (strip 4) | 00e9858c-f02a-4275-84c9-7efc403bcd83 | approved |

Pelajaran baru:

1. **Varian sejenis digabung jadi satu strip.** Tiga rumah warga, empat bunga,
   tiga jamur, tiga lili, empat item pantai — masing-masing satu generate lalu
   dipotong `slice_grid.py`. Hemat 9 generate dibanding satu gambar per objek,
   dan hasilnya justru lebih seragam karena model menggambarnya berdampingan.
2. **Aset lantai butuh kalimat kamera yang berbeda.** "Seen from above" saja
   membuat model menggambar dermaga sebagai panel pagar dari samping. Yang
   berhasil: sebut kameranya (*straight down from directly overhead, like a
   drone looking at the floor*), tegaskan **ini lantai yang diinjak pemain**,
   larang tampak samping/ketebalan, dan pakai rasio potret (9:16) supaya
   bentuknya memanjang ke bawah, bukan melebar.

## Batch B3 — memancing (2026-09-08)

| Aset | job_id | Status |
|------|--------|--------|
| ui/fishing_ui (3 keping dalam 1 gambar) | 9f668e18-c420-4eb0-b973-77ec22a8b28f | approved |
| fx/fish_shadow (strip 3 frame) | c09ab1b3-30bb-45ac-bd0c-5abc8a8f7af4 | approved |
| fx/bobber (strip 3 frame) | 19e84e86-f629-4dd5-bd87-4c711515a8b2 | approved |

Ikon ikan, umpan, dan pancingnya sendiri sudah ada sejak Fase A di sheet
`items_forage_fish` dan `items_tools`, jadi tiga generate ini cukup.

Pelajaran baru:

1. **Keping UI dengan bentuk berbeda tidak bisa dipotong sel seragam.** Rangka
   gauge, batang hijau, dan kapsul kemajuan punya rasio yang jauh berbeda, jadi
   `slice_grid.py` tidak cocok. `tools/build_fishing_ui.py` memisahkannya lewat
   celah kolom transparan lalu menormalkan tiap keping sendiri-sendiri.
2. **Jangan biarkan keadaan terpanggang di gambar UI.** Kapsul kemajuan
   digambar model terisi ±70 %. Kalau dipakai apa adanya, bar tidak akan pernah
   terlihat penuh maupun kosong. Skrip build memotong badan ambernya saja, dan
   tingginya diatur kode saat menggambar.
3. Model menggambar frame terakhir strip bayangan ikan menghadap berlawanan.
   Untuk strip pendek non-karakter lebih murah membalik satu sel di Python
   daripada regenerate.

## Batch B4a — satwa penghias (2026-09-08)

| Aset | job_id | Status |
|------|--------|--------|
| animals/butterfly (strip 4) | ee762eef-cf7e-4dc5-bb39-4bbf4f6741df | approved |
| animals/bird v1 (tiap frame dikotaki) | 68c91cd2-a983-4a34-a6bb-bc3b849ff8f6 | rejected |
| animals/bird v2 (dipakai) | fe4e8ffb-6f72-4634-b9ef-ce53fdd96c4d | approved |
| animals/firefly (strip 3) | 06a722c5-4cad-41ea-a74e-07d04cf1fbb1 | approved |
| animals/dragonfly (strip 3) | 48fcf7da-f0bc-47cb-9762-9bc32568df10 | approved |
| animals/crab (strip 3) | 775f5e25-0ec1-407e-8527-d2a09622f5e0 | approved |

Pelajaran baru:

1. **Model kadang mengotaki tiap frame** dengan panel bergaris, dan kadang
   menggandakan barisnya jadi dua. Larangannya harus disebut satu per satu —
   "NO box, NO border, NO frame, NO divider, NO grid line", "ONE row only",
   "no second row" — karena "animation strip" saja tidak cukup.
2. **Periksa pita baris sebelum memotong.** Hitung baris yang berisi piksel di
   gambar yang sudah di-key; kalau ada lebih dari satu pita, potong dulu ke satu
   pita. Ini juga membuang objek nyasar yang digambar di luar barisnya (ada satu
   capung kecil melayang di atas strip capung).
3. **Sel potong harus mengikuti arah objeknya.** Capung digambar tegak
   (kepala di atas) padahal selnya lebih lebar daripada tinggi, sehingga ekornya
   terpotong. Sel 30×32 memperbaikinya.

## Batch B5 — dua karakter pemain tambahan (2026-09-08)

| Aset | job_id | Referensi | Status |
|------|--------|-----------|--------|
| characters/player_m2 | 1d2942a2-f502-479d-b4fd-4369301ad422 | player_m sheet | approved |
| characters/player_f2 | 0e31eca4-ccc0-40b3-a3ca-20dc5f26df53 | player_m sheet | approved |
| portraits/player_m2 | a0fc02af-1b1b-48d0-9cfe-c92c8455afb3 | – | approved |
| portraits/player_f2 | 86de9e4b-29a9-4a90-81e7-f020f933d0cf | – | approved |

Portraitnya sengaja digenerate **tanpa gambar referensi sejak awal**. Dua kali
sebelumnya (player_f dan Rani) referensi sheet membuat sprite kecil ikut
tergambar di latar dan harus diulang; menghindarinya sejak awal menghemat dua
generate dan hasilnya tetap sepadan gayanya.

Catatan yang belum diselesaikan: garis pijak frame diam keempat karakter pemain
tidak persis sama — player_m 45, player_f 46, player_m2 47, player_f2 44 (dari
48 baris). Selisih tiga piksel itu berasal dari `--uniform-scale` yang menskalakan
tiap sheet menurut frame tertingginya sendiri, dan tidak bisa dirapikan dengan
menggeser sheet ke bawah karena beberapa frame sudah menyentuh baris teratas.
Merapikannya per sel juga salah: selisih baris pijak antar frame **adalah**
ayunan langkahnya, dan meratakannya membuat jalannya kaku. Kalau nanti mengganggu,
jalan keluarnya generate ulang dengan pose diam yang paling tinggi, bukan menggeser
hasil potongannya.

### Perbaikan Batch B5

| Aset | job_id | Status |
|------|--------|--------|
| characters/player_m2 v2 (proporsi chibi, dipakai) | aefb8ec2-1469-40d3-9b25-7211ed7753a4 | approved |
| characters/player_f2 v2 (tidak dipakai, versi pertama sudah benar) | ad9a67d1-aa29-447c-920f-a1ab21806cb1 | cadangan |

Dua pelajaran, keduanya mahal:

1. **"Match the body proportions of the reference" tidak cukup.** Versi pertama
   player_m2 keluar sebagai orang dewasa berproporsi wajar — kepala kecil, badan
   panjang — sementara seluruh cast lainnya chibi berkepala besar. Yang berhasil:
   menaruh proporsi sebagai syarat PERTAMA dan menyebutnya dengan angka —
   "kepala mengisi kira-kira SETENGAH BAGIAN ATAS sosoknya", "seluruhnya sekitar
   DUA KEPALA tingginya" — lalu menegaskan negatifnya: *"kalau sosoknya terlihat
   seperti orang biasa, itu salah."*
2. **Satu baris penuh bisa digambar menghadap arah yang keliru.**
   `slice_grid.py --fix-flips` tidak menangkapnya karena ia membandingkan tiap
   frame dengan frame diam di baris yang sama — kalau seluruh barisnya konsisten
   salah, tidak ada yang terlihat janggal. Ditangani `tools/fix_facing.py`, yang
   membandingkan baris kiri dengan baris kanan. Selain player_m2, ia juga
   menemukan **npc_wulan** yang sudah salah arah sejak Batch B1 tanpa disadari.

## Batch B6 — hewan ternak digambar ulang, 4 frame jadi 8 (2026-09-08)

| Aset | job_id | Referensi | Status |
|------|--------|-----------|--------|
| animals/chicken (8 frame) | 1ac733ee-86fe-489d-9d98-819a4d5e72a6 | chicken lama | approved |
| animals/dog (8 frame) | 1ecf8afa-89d0-41df-a493-cca4a11125d7 | dog lama | approved |
| animals/cow (8 frame) | 2baa4f4c-9d0a-41d2-af06-f2bbf4f9fc2a | cow lama | approved |

Sheet lama hanya empat frame: satu diam, dua langkah, satu makan. Empat frame
tidak cukup untuk satu siklus langkah, dan akibatnya frame makan ikut dipakai di
tengah jalan — ketiga hewan berjalan sambil mengunyah. Sekarang delapan frame:
dua diam, **empat langkah penuh**, dua makan.

Pelajaran baru: **model memecah delapan frame menjadi dua baris berisi empat**,
dan pada ayam menyelipkan satu frame berlebih (sembilan, bukan delapan). Grid
tetap `slice_grid.py` salah potong pada keduanya. `tools/build_animal_strip.py`
mencari tiap objek lewat celah transparan — baris dulu, lalu kolom di dalam
baris — jadi jumlah baris dan isi tiap baris tidak perlu diketahui lebih dulu;
`--dump` menampilkan frame bernomor untuk memilih mana yang dibuang, dan
`--keep` menyusunnya jadi satu baris.

## Batch B7 — tanah kebun (2026-09-08)

| Aset | job_id | Status |
|------|--------|--------|
| terrain/garden_soil (digenerate) | c21d614c-bb39-4a5c-98c8-6285e8a9c178 | rejected |
| terrain/garden_soil (dipakai) | — diturunkan dari `dirt.png` oleh `tools/tint_tile.py` | approved |

Petak kebun sebelumnya berumput sama persis dengan halaman di luar pagar, jadi
satu-satunya penanda batasnya adalah pagar itu sendiri — dan begitu pemain
berdiri di dalamnya, tidak ada lagi petunjuk di mana cangkul boleh dipakai.

Versi yang digenerate ditolak karena **dua alasan yang saling menguatkan**:

1. **Terangnya salah urutan.** Ia keluar dengan terang 38, sama gelapnya dengan
   `tilled_wet`. Akibatnya mencangkul justru membuat tanah tampak lebih TERANG —
   kebalikan dari yang diharapkan mata.
2. **Teksturnya bukan sekeluarga.** Tanah kebun dan tanah jalan seharusnya
   terbaca sebagai bahan yang sama yang diperlakukan berbeda. Butiran halus yang
   digenerate dari nol justru terbaca sebagai bahan lain sama sekali.

Yang dipakai diturunkan dari `dirt.png` lewat `tools/tint_tile.py`, dengan
terang dinyatakan sebagai target angka supaya urutannya bisa direncanakan:

| Permukaan | Terang |
|-----------|--------|
| rumput | 139 |
| tanah jalan | 133 |
| **tanah kebun** | **118** |
| tercangkul | 109 |
| tercangkul basah | 39 |

Pelajaran: **kalau dua permukaan harus sekeluarga tapi bisa dibedakan, turunkan
yang kedua dari yang pertama, jangan generate dari nol.** Dan nyatakan
terangnya sebagai angka target, bukan sebagai kata sifat di prompt — "lebih
gelap dari jalan setapak" tidak memberi tahu model seberapa gelap, dan urutan
terang antar permukaan adalah hal yang harus direncanakan, bukan diharapkan.

## Batch B8 — terrain empat musim (2026-09-08)

| Aset | Sumber | Status |
|------|--------|--------|
| terrain/grass_summer | diturunkan dari `grass_spring` | approved |
| terrain/grass_autumn | diturunkan dari `grass_spring` | approved |
| terrain/grass_winter (digenerate) | 2bf105ea-5845-4f9c-af54-09755feb8120 | rejected |
| terrain/grass_winter (dipakai) | diturunkan dari `grass_spring` | approved |

Perintah yang menghasilkannya, semuanya lewat `tools/tint_tile.py`:

    grass_summer  --luma 130 --gain 0.85,1.0,0.72
    grass_autumn  --luma 138 --gain 2.15,0.98,0.34
    grass_winter  --desat 1.0 --flatten 0.78 --luma 234 --warm 0.94

Tiga hal yang dipelajari saat mengerjakannya:

1. **Salju yang digenerate ditolak** karena goresan diagonalnya membentuk pola
   yang langsung terbaca sebagai kotak berulang begitu diubin. Tekstur terrain
   dinilai dari hasil ubinannya, bukan dari satu tile-nya.
2. **Memutihkan hijau tidak bisa dengan menaikkan kanal merah dan biru.** Kanal
   hijau rumput jauh lebih tinggi dari dua lainnya, jadi mengalikannya justru
   berakhir merah muda. Yang benar menghilangkan warnanya dulu (`--desat`), baru
   diterangkan.
3. **Salju perlu diredam kontrasnya** (`--flatten`). Permukaan salju memang
   nyaris rata; tekstur yang menonjol membuat pola ubinnya terbaca di seluruh
   peta. Rumput lolos dari masalah ini karena rumpunnya memang wajar berulang.

### Perbaikan: kanopi oak musim panas bolong (2026-09-09)

Sheet `oak_seasons.png` disusun ulang dari raw yang sama, tanpa generate baru.

Penyebabnya ada di `chroma_key.py`, dan cukup mahal untuk dicatat: penentuan
latar bukan hanya jarak ke warna kunci, tapi

    bg = (dist < tol) | (greenness > 90)

Bagian kedua bekerja **lepas dari `--tol`**. Dedaunan yang hijaunya pekat —
pita terang di kanopi oak musim panas — punya `greenness` di atas 90, jadi ia
dianggap latar dan terhapus **berapa pun toleransinya**. Itulah sebabnya
menurunkan `--tol` dari 60 sampai 10 sama sekali tidak mengubah hasilnya;
jumlah piksel opaque-nya identik di semua percobaan.

Ambangnya sekarang bisa diatur (`--greenness`, bawaan tetap 90). Oak disusun
ulang dengan `--greenness 180`: piksel opaque kanopi musim panas naik dari
37.082 ke 57.083, sejajar dengan tiga musim lainnya.

Aset hijau lain diperiksa dengan cara yang sama. Kenaikannya hanya di tepi, dan
tidak ada satu pun yang berlubang di dalam siluetnya, jadi tidak ada yang lain
yang perlu disusun ulang.

## Batch B6 (2026-09-09)
| Aset | job_id | Status |
|------|--------|--------|
| items/items_food_misc (8 ikon menu warung) | 462a1abb-6f56-4331-bc54-ef8dcb12a61b | approved |

Referensi gaya: `assets/_raw/items/items_forage_fish.png`, dengan perintah tegas
"pakai referensi untuk gaya saja, jangan salin bendanya" — tanpa kalimat itu
model cenderung menyelipkan barang dari referensi ke dalam grid.
