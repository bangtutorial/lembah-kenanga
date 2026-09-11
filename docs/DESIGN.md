# DESIGN — Lembah Kenanga

Dokumen desain visual + teknis. Semua keputusan angka di sini adalah **kontrak**; jangan diubah diam-diam saat produksi.

---

## 1. Kamera & Proyeksi (View)

- **Proyeksi**: *oblique top-down* ala Stardew Valley. Tanah dilihat tegak lurus dari atas (grid persegi rata), sedangkan objek berdiri (bangunan, pohon, karakter) memperlihatkan **muka depan + atap/tajuk** seolah kamera sedikit condong dari selatan. Tidak ada garis perspektif, tidak ada sisi kiri/kanan bangunan yang miring — hanya muka depan dan atap yang "direbahkan" ke atas.
- **Cahaya**: sumber dari kiri-atas, bayangan lembut ke kanan-bawah; bayangan kontak gelap di kaki objek (tinggi 2–4 px).
- **Grid tile**: **32×32 px** logis. Ukuran dunia per area: Farm 60×45 tile, Town 56×40, Forest 50×40, Beach 40×30.
- **Viewport logis**: dinamis mengikuti jendela — zoom integer dipilih otomatis (`floor(min(W/640, H/360))`, maks ×4), lalu viewport logis = `floor(jendela / zoom)`. Contoh: 1881×931 → zoom ×2, viewport 940×465. Tidak ada letterbox; layar lebar melihat lebih banyak peta. Minimum yang selalu terlihat 640×360. Tombol `Z` memutar zoom manual (auto → ×1 → ×2 → ×3 → ×4). Semua UI di-anchor ke tepi memakai `view.w/h` (jangan hardcode 960×540).
- **Kamera**: follow pemain dengan deadzone 96×64 px di tengah, lerp 0.12/frame, clamp ke batas peta. Transisi area: fade hitam 300 ms.
- **Depth sorting**: entitas digambar berurutan berdasarkan `y` kaki (bottom pivot). Bangunan punya "footprint" collision di baris bawahnya dan bagian atas dapat menutupi pemain yang berjalan di belakangnya.
- **Interior**: kamar rumah 14×10 tile, kamera statis tengah.
- **HUD** (selalu tampil): kiri-atas jam + hari + musim + cuaca (panel kayu), kanan-atas uang, kanan-bawah bar energi vertikal, bawah-tengah hotbar 9 slot. Dialog: kotak kayu bawah layar dengan portrait 96×96 di kiri.

### Sketsa tata letak layar
```
+------------------------------------------------+
|[Sen 3 Semi 08:20 cerah]              [G 1.250] |
|                                                |
|                 (dunia, tile 32px)             |
|                                      | energi  |
|      [1][2][3][4][5][6][7][8][9]     |         |
+------------------------------------------------+
```

## 2. Arah Seni (Visual System)

| Sumbu | Keputusan |
|-------|-----------|
| Shape | Bentuk chunky-membulat, atap tebal, jendela besar; siluet ramah |
| Silhouette | Karakter 32×48 px (1,5 tile tinggi), kepala ≈ 40 % tinggi (chibi 2,5 head). Pohon 64×96 (tajuk bulat lebar). Bangunan kelipatan 32 px |
| Value | 3 band (shadow / mid / highlight) + outline gelap 1 px warna bukan hitam murni (#3a2a2a) |
| Color | Palet 48 warna maksimal (lihat §2.1), saturasi tinggi, hijau hangat kekuningan untuk rumput |
| Edge | Pixel cluster keras, tanpa anti-alias, tanpa gradien halus, tanpa dithering berlebihan |
| Material | Kayu = coklat oranye bergaris papan; batu = abu kebiruan; daun = 3 warna hijau; air = biru dengan highlight putih bergelombang |
| Light | Kiri-atas, shading terpanggang (baked), bayangan kontak elips gelap 40 % |
| Detail | Detail di muka depan bangunan & kepala karakter; tanah relatif polos agar karakter terbaca |
| Motion | Walk 4 frame (bob 1–2 px), idle 1 frame; hewan 2 frame; air 3 frame |

### 2.1 Palet peran (referensi warna, boleh disesuaikan setelah visual target)
- Rumput: #6abe30 / #4f9a29 / #3b7a1f · Tanah: #b8834b / #8e5f33 · Pasir: #eed7a1
- Kayu: #c8843a / #9a5a25 / #6b3a17 · Atap merah: #b8432e / #8a2c1d · Atap coklat: #7a4b2a
- Batu: #a3a8b5 / #6f7482 · Air: #3f8fd6 / #2b6cb0 / highlight #d9f0ff
- Kulit: #f2c9a1 / #d9a06f · Aksen UI kayu: #8b5a2b, teks krem #f5e6c8
- Semantik: hijau = tumbuh/sehat, biru = disiram, merah = larangan/energi rendah, emas = kualitas bagus

### 2.2 Musim
- Semi: rumput hijau muda, pohon oak bertunas, cherry berbunga pink.
- Panas: rumput hijau pekat, pohon lebat, bunga terang.
- Gugur: rumput kekuningan, oak oranye/merah, daun berjatuhan (partikel).
- Dingin: salju menutup rumput, pohon gundul + salju, air lebih gelap.

Implementasi: **tekstur rumput 4 varian** (digenerate), pohon oak & cherry 4 varian, pine 2 varian. Objek lain tidak berubah (hemat kredit); overlay tint global −10 % saturasi di musim dingin lewat kode.

### 2.3 Siang–malam
Overlay warna di atas dunia (Canvas `globalCompositeOperation: multiply`): 06–17 transparan, 17–19 oranye lembut, 19–02 biru gelap α 0.55. Lampu jalan & jendela memancarkan lingkaran radial (digambar kode, bukan aset).

## 3. Arsitektur Teknis

- **Bahasa**: JavaScript ES2022 modules, tanpa framework, tanpa bundler (opsional Vite untuk dev). Import map untuk `three` jika dipakai.
- **Renderer**: **Canvas 2D** sebagai renderer utama (pixel-perfect, murah, cukup untuk 2D tile). Layer: `terrain → decor bawah → entitas (y-sorted) → decor atas/atap → cuaca → overlay malam → UI`.
- **three.js**: *tidak dipakai di v1 dunia game*. Dicadangkan untuk (a) efek cahaya/cuaca WebGL bila overlay Canvas ternyata berat, (b) latar hero homepage dengan parallax 2.5D. Abstraksi `Renderer` dibuat agar bisa ditukar tanpa menyentuh logika game.
- **Struktur folder**
```
/index.html            homepage (tab: Main, Cara Main, Karakter, About)
/game.html             kanvas game
/src/
  core/     loop.js, input.js, time.js, save.js, events.js, rng.js
  render/   canvas-renderer.js, camera.js, sprite.js, tilemap.js, atlas.js
  world/    map-loader.js, areas/{farm,town,forest,beach}.json, collision.js
  entities/ player.js, npc.js, animal.js, crop.js, tree.js, forage.js
  systems/  farming.js, fishing.js, inventory.js, economy.js, weather.js,
            relationship.js, schedule.js
  ui/       hud.js, dialog.js, inventory-ui.js, shop-ui.js, menu.js
  data/     items.json, crops.json, npcs.json, dialogs.json, schedules.json,
            fish.json, prices.json
/assets/
  _raw/     hasil generate mentah (per kategori)
  sprites/  characters/ animals/ buildings/ nature/ terrain/ crops/ items/ ui/ interior/ fx/
  audio/
  manifest.json        (nama → file, frame, pivot, footprint, status)
  PROVENANCE.md
/tools/               skrip Python pipeline aset (lihat ASSETS.md)
/docs/
```
- **Peta**: JSON buatan sendiri (layer terrain id, layer objek dengan {sprite, x, y}, layer collision boolean, portal). Editor: hand-authored + skrip preview Python.
- **Waktu**: `time.js` mengeluarkan event `hour`, `day`, `season`; sistem lain subscribe (bukan polling).
- **Save**: `{version, player, world:{area:{tiles,objects}}, inventory, time, relationships, flags}` → JSON di IndexedDB (fallback localStorage), 3 slot, migrasi per versi.
- **Performa**: prerender terrain per area ke offscreen canvas (dirty-rect saat tile berubah), sprite atlas per kategori, culling entitas di luar viewport + margin 64 px, `requestAnimationFrame` dengan fixed-step 60 Hz update.
- **Input**: keyboard (WASD/panah jalan, Shift tahan untuk lari, E/Space interaksi, 1–9, I, Esc, Tab ganti alat), mouse (klik tile target alat, UI). Gamepad = stretch.
- **Kecepatan**: jalan 96 px/dtk (3 tile/dtk), lari 168 px/dtk (5,25 tile/dtk). Lari tidak memakai energi — peta selebar 48 tile dan perjalanan ladang↔pantai adalah hal yang paling sering diulang pemain; menariknya bayaran hanya akan membuat mereka berhenti melakukannya. Frame animasi jalan ikut menyesuaikan kecepatan (`animT += dt * speed / baseSpeed`), jadi lari terlihat seperti lari dan NPC yang berjalan pelan tidak terlihat mengesot.

## 3.0 Area

| Area | Ukuran | Isi |
|------|--------|-----|
| `valley` | 48×48 tile | **Seluruh dunia luar dalam satu peta** |

Peta dibaca dari utara ke selatan:

| Distrik | Baris | Isi |
|---------|-------|-----|
| Ladang & kandang | 4–19 | rumah, kebun berpagar, kandang hewan, sumur, kotak jual |
| Sabuk hutan | kolom 24–28 | pemisah ladang dan desa, menggantikan portal lama |
| Desa | 10–28 (timur) | plaza & air mancur, balai desa, toko, warung, pandai besi |
| Hutan | 22–35 (barat) | kolam berlili, pondok bunga Rani, jamur, bunga liar |
| Distrik selatan | 28–35 | klinik Dokter Ratna, tiga rumah warga di satu jalan |
| Pantai | 36–39 | pasir, kelapa, kerang & rumput laut, pondok Nenek Wulan |
| Laut | 40–47 | dermaga kayu, perahu, Bayu. Empat baris terakhir sengaja air kosong: kamera menempel di tepi peta, tanpa itu ujung dermaga tertutup hotbar |

Satu jalur utama turun dari jalan besar desa sampai ke dermaga, jadi pemain tidak perlu menebak arah laut. Dua papan penunjuk berdiri di percabangan menuju hutan dan pantai.

**Interior dinonaktifkan.** Seluruh permainan berjalan di satu peta tanpa layar pemuatan:

| Bangunan | Interaksi di depan pintu (`E`) |
|----------|-------------------------------|
| Rumah | Tidur → hari berikutnya + autosave |
| Toko Bu Sari | Layar belanja (beli/jual), buka 09:00–17:00 |
| Pandai Besi | Layar peningkatan alat, buka 09:00–16:00 |
| Warung, Balai Desa, Klinik | "segera buka" |

Yang diperiksa adalah **tile yang dihadapi**, bukan tile tempat pemain berdiri. Petak pintu sebuah bangunan adalah bagian dari jejak solid bangunan itu sendiri — berbeda dengan rumah pemain, yang penanda pintunya justru berada di petak berjalan tepat di bawahnya — jadi memeriksa petak pemain sendiri tidak akan pernah cocok. Pemeriksaan ini juga berjalan **sebelum** pemindaian NPC: penjaga toko sering berdiri di depan pintunya sendiri, dan "bicara dengan dia" akan menelan setiap usaha mencapai kasir di belakangnya.

Peti penyimpanan tetap berada di dalam rumah (`world/house.js`) dan ikut nonaktif — inventori 24 slot sudah cukup untuk MVP. Ramalan cuaca besok pindah ke papan pengumuman desa. Jam buka ada di `src/data/shops.json`; di luar jam, pintu menolak dan menampilkan pesannya. `world/house.js` beserta `ui/chest-ui.js` disimpan utuh untuk saat interior dihidupkan lagi.

Dulu ladang dan desa adalah dua peta terpisah dengan portal. Hasilnya dua peta setengah kosong dan perjalanan panjang yang tidak perlu. Sekarang satu peta: sabuk hutan menggantikan peran portal, dan setiap landmark berjarak beberapa detik jalan kaki.

**Air.** Kolam hutan dan laut memakai terrain `water` yang punya 3 frame. Kanvas terrain di-prerender sekali per musim, jadi hanya frame 0 yang dipanggang ke sana; `map.animatedTiles` menyimpan daftar tile air dan renderer menimpanya dengan frame berjalan tiap frame. Tanpa itu strip 96 px milik tile animasi akan tertumpah ke dua tile tetangganya.

**Dermaga** adalah *decal*: sprite yang tergambar tepat setelah terrain dan sebelum semua entitas, bukan objek yang ikut y-sort. Airnya dibuat tidak solid supaya bisa diinjak. Kalau dermaga jadi objek biasa, pemain yang berdiri di atasnya akan tertutup papan dermaga sendiri.

`world/areas.js` adalah registry. Peta dibangun ulang dari seed, jadi save hanya menyimpan **perubahan**: id objek yang hilang (ditebang/dipecah/dibersihkan) + kondisi tanah kebun. Zoom **tidak pernah** berubah antar area — mengubahnya ikut memperbesar HUD.

---

## 3.1 Aturan Tata Letak (kontrak, diperiksa otomatis)

Semua angka di `src/world/layout.js`; `auditArea(map)` dijalankan di akhir setiap builder dan `console.warn` bila dilanggar. Pemain berjalan **3 tile/detik**.

| Aturan | Batas | Alasan |
|--------|-------|--------|
| Sisi peta | ≤ 48 tile | menyeberang ≤ 16 detik |
| Jarak tiap distrik ke tetangga terdekat | ≤ 34 tile | ~11 detik; diperiksa untuk **setiap** hub, bukan hanya dua, supaya distrik ketiga dan keempat tidak bisa terpencil |
| Jarak antar landmark bertetangga | ≤ 14 tile | tidak ada landmark terisolasi |
| Kepadatan (tile solid + jalan) | 22 %–55 % | < 22 % terasa kosong, > 55 % terasa semak belukar |
| Petak kosong terbesar | ≤ 8×8 tile | ruang mati harus diisi atau dipersempit |
| Objek di tile jalan | 0 (kecuali rumput liar & gerbang) | jalan harus bersih |
| Objek per tile | tepat 1 | dekorasi yang bisa dilewati (jamur, bunga, kerang) tidak menandai tile sebagai solid, jadi tanpa aturan ini semak bisa mendarat di atas jamur — dan `E` akan memetik berinya, bukan jamurnya |
| Pintu bangunan | wajib bersentuhan tile jalan | tidak ada toko yang tak bisa didatangi |
| Lebar jalan | tepat 1 tile | dua jalur bersebelahan terbaca sebagai satu jalan raya selebar dua kali jalan lain. Kalau dua distrik butuh jalur yang searah, mereka **berbagi** satu jalur, bukan menambah jalur baru di sebelahnya |
| Ujung jalan | menempel bangunan yang dilayani, atau menembus tepi peta | jalan yang berhenti di tengah rumput terbaca sebagai terputus, bukan sebagai jalan buntu |
| Bangunan di dalam area berpagar | tidak boleh membentang di kolom/baris gerbang | lumbung selebar 6 tile di kandang selebar 8 tile pasti memotong kolom gerbang di mana pun ditaruh membentang, jadi ia harus berada di sisi yang tidak dilewati jalur masuk |
| Titik lahir hewan | wajib tile bebas di dalam pagar | dihitung dari rumus, satu sapi pernah lahir di dalam pagar dan tidak pernah bisa keluar. Sekarang tiap hewan menyebut tile-nya dan digeser ke tile bebas terdekat |

**Setiap area yang punya aturan berbeda harus terlihat berbeda.** Petak kebun
memakai terrain `garden_soil` sendiri, bukan rumput: cangkul hanya bekerja di
sana, dan kalau tanahnya sama dengan halaman di luar pagar, satu-satunya penanda
batasnya adalah pagar — yang tidak terlihat lagi begitu pemain berdiri di
dalamnya. Warnanya sengaja jauh lebih gelap daripada tanah jalan supaya keduanya
tidak tertukar.

Jalan masuk kebun dibiarkan sebagai **celah tanpa gerbang**. Sprite gerbangnya
digambar mendatar, jadi ia hanya cocok di sisi atas atau bawah cincin pagar;
di sisi kanan yang pagarnya tegak, ia terbaca seperti papan yang jatuh
melintang. Gerbang kandang tetap dipasang karena jalan masuknya memang di sisi
bawah.

**Urutan membangun peta** (tidak boleh dibalik):
1. **Jalan** dicarve dan dicatat di `map.road`.
2. **Area berpagar** — cincin tertutup satu tile di luar area, sisi atas/bawah potongan `h`, sisi kiri/kanan `v`, empat sudut memakai potongan sudut yang benar, satu tile jadi gerbang. Helper menolak menaruh pagar di tile jalan.
3. **Plaza** dipaving (bukan jalan) supaya perabot boleh berdiri di atasnya.
4. **Bangunan** + footprint, masing-masing dengan jalan aksesnya.
5. **Perabot plaza** simetris terhadap sumbu tengah plaza.
6. **Dekorasi** ditebar terakhir, mengikuti §3.4.
7. `auditArea()`.

**Area bertani.** `map.tillable(c, r)` menentukan di mana cangkul & benih boleh dipakai; defaultnya `false`. Lembah hanya mengizinkan petak kebun berpagar.

---

## 3.2 Skala & Orientasi Objek (kontrak aset)

Sumber kebenaran: **`assets/scale.json`**. Diperiksa `python tools/check_scale.py` (harus 0 masalah).

- **Acuan**: karakter 32×48 px = manusia dewasa. Semua ukuran lain diturunkan dari itu, **bukan** dari bbox hasil generate. Inilah yang dulu membuat anjing sebesar sapi.
- **Anchor**: `bottom-center` — kaki objek menempel garis tile.
- **Orientasi**: `faces: "south"` berarti sprite menghadap bawah layar. **Konsekuensi wajib**: bangunan menghadap selatan, jadi jalan aksesnya harus di baris tepat di bawah footprint. Bangunan yang hanya bisa didekati dari utara adalah bug tata letak.

Ukuran kanonik (tile):

| Objek | Tile | Objek | Tile |
|-------|------|-------|------|
| Karakter/NPC | 1 × 1,5 | Ayam | 0,8 × 0,75 |
| Anjing | 1,1 × 0,95 | Sapi | 1,9 × 1,25 |
| Rumah | 5 × 5 | Balai Desa | 7 × 6 |
| Kandang ayam | 4 × 4 | Lumbung | 6 × 5 |
| Toko | 6 × 5 | Warung | 5 × 4 |
| Pandai Besi | 5 × 5 | — | — |
| Sumur / kotak jual | 2 × 2 | Papan pengumuman | 1,75 × 1,75 |
| Lampu jalan | 1 × 2,5 | Oak / pinus | 2,5 × 3 / 2,5 × 3,5 |
| Air mancur (6 frame) | 4 × 5,5 (basin 4×2) | — | — |
| Semak | 1,25 | Batu | 2 × 1,5 |

**Tile-set berarah** (pagar, jembatan, dermaga) tidak boleh memakai hasil generate mentah: model tidak menggambar tile yang menyambung. Generate *komponennya*, lalu susun tile finalnya dengan Python sampai rail menyentuh tepi tile — lihat `tools/build_fence.py`.

**Animasi**: objek dengan `animated: true` di manifest diputar otomatis dari kolom sheet-nya pada `fps` yang tercatat (air mancur: **6 frame @ 8 fps**, digenerate dengan GPT Image 2).

Untuk sprite animasi, **jangan** pakai "fit tiap frame ke kanvas" — tinggi frame berbeda (pancaran air tumbuh) sehingga bagian yang seharusnya diam ikut naik-turun. Turunkan **satu skala** dari bagian yang harus diam (mis. lebar basin), lalu tempatkan semua frame pada baseline bawah yang sama. Lihat `tools/build_fountain.py`.

---

## 3.2b Memancing

**Pancingnya dari mana.** Nenek Wulan menyerahkan miliknya yang lama saat pertama kali disapa — dia nelayan tua di pantai, jadi memberi alat pertama sekaligus jadi alasan berjalan ke sana. Toko Bu Sari juga menjualnya seharga G350 buat pemain yang belum sempat ke pantai. "Pertama kali" ditentukan dari kepemilikan, bukan bendera di berkas save: pancing tidak bisa dijual atau dibuang, jadi memeriksa isi tas sudah cukup dan tidak ada keadaan baru yang perlu diingat. Toko menolak menjual alat kedua yang sama, karena alat bertumpuk satu dan salinan kedua hanya memakan slot.

Berdiri menghadap air sambil memegang pancing, tekan `E` untuk melempar. Kode di
`src/systems/fishing.js`, tampilannya di `src/ui/fishing-ui.js`, daftar ikannya
di `src/data/fish.json`.

| Tahap | Yang terjadi |
|-------|--------------|
| `wait` | Pelampung mengambang 1,2–4,5 detik. Umpan dan bayangan ikan masing-masing memotong setengah waktu tunggu, dan efeknya bertumpuk |
| `bite` | Pelampung tersentak. Ada **0,9 detik** untuk menekan `E`; lewat dari itu umpannya lepas |
| `reel` | Mini-game: batang hijau dijaga tetap menutupi ikan. Tahan `E` mendorongnya naik, lepas dan ia jatuh. Bar kemajuan naik saat ikan di dalam batang, turun saat di luar |

Bentuk mini-game-nya mengikuti Stardew karena itu bentuk yang terbukti bekerja:
satu tombol, tanpa membidik, masih bisa dimainkan saat lelah. Semua angkanya
dinyatakan dalam trek ternormalisasi 0..1, jadi tinggi gauge di layar boleh
berubah tanpa menyentuh keseimbangannya.

**Kolam hutan** air tawar (mujair, gurame, lele malam hari), **laut** air asin
(kakap, cumi malam hari, tongkol musim panas–gugur, rumput laut). Sepatu bekas
bisa didapat di keduanya. Kesulitan 1–5 menentukan dua hal sekaligus: seberapa
gelisah ikannya dan seberapa pendek batang hijaunya.

**Bayangan ikan** berenang pelan di air terbuka — hanya di petak yang kedelapan
tetangganya air, supaya tidak ada bayangan yang separuh berdiri di pasir.
Melempar di dekatnya mempercepat sambaran dan memiringkan undian ke ikan langka;
itulah satu-satunya alasan membidik. Tiap kumpulan air diisi terpisah (minimal
dua bayangan per kumpulan): kalau kuotanya disebar rata ke seluruh petak air,
laut yang 258 petak menelan semuanya dan kolam hutan yang 11 petak selalu
kosong.

## 3.2c Musim

Empat musim mengubah tampilan lembah tanpa mengubah petanya. `map.terrainFor()`
menukar `grass_spring` dengan `grass_<musim>` kalau asetnya ada, lalu kanvas
terrain di-prerender ulang sekali per musim — bukan per frame.

| Musim | Rumput | Pohon |
|-------|--------|-------|
| Semi | hijau muda | oak kolom 0 |
| Panas | hijau lebih pekat | oak kolom 1 |
| Gugur | keemasan | oak kolom 2, daun berguguran dari sistem cuaca |
| Dingin | salju | oak gundul (kolom 3), pinus bersalju, semak varian salju |

Yang **tidak** berubah: jalan, plaza, pasir pantai, dan tanah kebun. Ketiganya
permukaan yang dikerjakan atau dibersihkan orang, jadi masuk akal kalau salju
tidak menumpuk di sana — dan tanah kebun yang tetap terlihat menjaga petunjuk di
mana cangkul boleh dipakai sepanjang tahun.

Ketiga tile rumput diturunkan dari `grass_spring` lewat `tools/tint_tile.py`,
bukan digenerate satu per satu. Alasannya sama dengan tanah kebun: keempat musim
harus terbaca sebagai rumput yang sama di cuaca berbeda, dan tekstur yang
digenerate terpisah tidak pernah sekeluarga.

## 3.3 Aturan Penempatan Dekorasi (pohon, batu, semak, rumput)

Tanpa aturan, RNG menaruh pohon di tengah halaman dan tunggul menempel pintu toko. Semua diatur `SCATTER` di `layout.js` dan dijalankan `scatter()`.

**Zona** — setiap tile dipetakan ke satu zona oleh `zoneAt(c, r)`:

| Zona | Di mana | Isi |
|------|---------|-----|
| `woods` | sabuk pemisah ladang–desa, tepi peta | pohon rapat, pinus, tunggul, kayu, batu |
| `forest` | hutan barat daya (baris 22–35) | pohon, pinus, tunggul, kayu, jamur, bunga liar |
| `sand` | pantai (baris 36–39) | kelapa, kerang, rumput laut, batu |
| `verge` | rumput biasa di sekitar bangunan | pohon jarang, semak, bunga, rumput liar |
| `rough` | lahan di selatan jalan utama | batu, semak, rumput liar |
| `plot` | dalam petak kebun | hanya rumput liar (untuk dibersihkan pemain) |
| `null` | plaza, dalam pagar kandang, jalan, air | tidak ada dekorasi sama sekali |

**Anggaran per jenis** (per 100 tile zona) dan **jarak minimum antar objek sejenis**:

Urutannya dari yang paling langka ke yang paling banyak:

| Jenis | Zona | per 100 tile | Jarak min | Bebas dari pintu |
|-------|------|--------------|-----------|------------------|
| Pinus | woods, forest | 3 | 4 | 3 |
| Kayu tumbang | woods, forest | 1 | 7 | 3 |
| Tunggul | woods, forest, rough | 1 | 6 | 3 |
| Kelapa | sand | 5 | 4 | 3 |
| Jamur | forest | 3 | 3 | 2 |
| Batu | rough, woods, sand | 2 | 4 | 2 |
| Bunga liar | forest, verge | 3 | 3 | 2 |
| Kerang & rumput laut | sand | 6 | 2 | 1 |
| Semak | verge, woods, forest, rough | 3 | 3 | 2 |
| Pohon oak | woods, forest, verge | 7 | 3 | 3 |
| Rumput liar | verge, rough | 5 | 2 | 1 |

Jamur, bunga liar, kerang, dan rumput laut berjenis `pick`: dilewati begitu saja, dipungut dengan `E`, lalu hilang dari peta (dan dari save, lewat `markRemoved`).

**Urutan pemrosesan penting**: jenis paling langka dan paling rewel ditempatkan lebih dulu. Kalau pohon (paling banyak) jalan duluan, ia menghabiskan zona dan semak/pinus/tunggul tidak kebagian tempat sama sekali — persis yang terjadi pada percobaan pertama (semak = 0).

Selain itu, kandidat tile ditolak bila: solid, tile jalan, di dalam plaza/kandang, atau dalam radius `clearOfBuildings` dari pintu bangunan mana pun.

---

## 4. Spesifikasi Aset (ukuran & pivot)

| Kategori | Ukuran per frame | Pivot | Catatan |
|----------|-----------------|-------|---------|
| Karakter | 32×48 | bottom-center | Sheet 4 baris (bawah, kiri, kanan, atas) × 4 kolom (walk); kolom 1 = idle |
| Portrait | 96×96 | – | Setengah badan, latar transparan |
| Hewan | ayam 26×24 · anjing 34×30 · sapi 60×40 | bottom-center | Strip 4 frame hadap **kiri** (idle, walk1, walk2, aksi); arah kanan di-mirror di kode. Ukuran dipilih relatif karakter 32×48 agar hierarki ayam < anjing < sapi terbaca |
| Bangunan | kelipatan 32, maks 224×192 | bottom-left tile | Footprint = baris tile bawah setinggi ⅓ |
| Pohon | 80×96 | bottom-center | Footprint 1×1 tile di batang; tajuk oak ±72 px lebar, frame harus lebih lebar dari objek (tidak boleh ter-clip) |
| Terrain | 32×32 seamless | – | Tekstur dasar; transisi dibuat Python |
| Crop | 32×48 × 5 tahap (strip 160×48) | bottom-center | Tahap 5 = siap panen |
| Item icon | 32×32 | center | Grid 4×4 per gambar |
| UI panel | 96×96 9-slice (sudut 16 px) | – | |
| Tombol | 96×32 × 3 state | – | |
| Efek | 16×16 / 32×32 | center | |

## 5. Pipeline Aset (ringkas; detail di ASSETS.md)
1. Generate dengan Higgsfield **Nano Banana Pro**, latar **hijau chroma #00FF00 rata** (bukan transparan — lebih stabil dipisah Python).
2. Python: chroma-key → alpha, crop bbox, resize nearest ke ukuran target, kuantisasi palet (≤ 48 warna), slicing grid, atur pivot, simpan PNG + entri `manifest.json`.
3. Contact sheet & preview di dalam game pada skala asli sebelum disetujui.

## 6. Homepage
- Satu halaman, tab (Main / Cara Main / Karakter / About) dengan hash routing.
- Hero: latar pixel art desa lebar (1920×1080, digenerate), logo kayu (digenerate) — **teks judul "Lembah Kenanga" dirender sebagai gambar logo**, satu-satunya pengecualian teks-di-gambar; tetap disiapkan fallback font.
- Font: "Press Start 2P" / "Pixelify Sans" (Google Fonts) untuk judul, "VT323" untuk body.
- Kartu karakter memakai portrait 96×96 diskalakan ×2.

## 6.1 Umpan Balik Aksi (game feel)

`src/systems/juice.js` — lapisan dekorasi murni; menghapusnya tidak merusak permainan. Setiap kejadian menumpuk 2–3 saluran umpan balik, berdurasi pendek, lalu kembali tenang.

| Kejadian | Tier | Saluran |
|----------|------|---------|
| Cangkul | small | ayunan alat + serpihan tanah (potongan 4×4 px dari tekstur `tilled_dry`) + getar halus |
| Siram | — | ayunan + percikan (frame `splash`) |
| Sabit rumput | small | ayunan + daun + getar halus |
| Pukul pohon/batu | medium | ayunan + serpihan + getar + hit-stop 30 ms |
| Pohon/batu tumbang | large | ledakan serpihan + getar kuat + hit-stop 60 ms + teks "+4 Kayu" |
| Panen | small | kilau + teks melayang |

- **Getar layar** memakai model *trauma*: `offset = trauma² × sin(t)`, meluruh 1,6/detik. Kuadratik supaya ketukan ringan hampir tak terasa dan hantaman besar terasa tegas. Menggeser **offset kamera**, bukan posisi pemain.
- **Hit-stop** membekukan `update()` sesaat; render tetap jalan.
- **Serpihan** tidak memakai aset baru: partikel debu/batu memotong petak 4×4 px dari tekstur terrain yang sudah ada; partikel daun/kilau/percikan memakai sheet `particles`.
- **Ayunan alat** menggambar ikon alat dari sheet inventori, diputar −50°→+50° selama 0,22 detik di depan pemain — memberi kesan mengayun tanpa menambah frame animasi karakter.

## 6.2 Panduan Hari Pertama — dinonaktifkan

Panel checklist sempat dipasang di pojok kanan, tetapi menutupi HUD, jadi dicabut. Kodenya disimpan di `src/ui/tutorial.js` (tidak diimpor). Kalau nanti dihidupkan lagi, taruh sebagai baris tip satu kalimat di bawah hotbar, bukan panel yang menempati sudut layar.

## 7. Audio — sintesis, bukan file

Semua bunyi dibangkitkan langsung oleh Web Audio API (`src/systems/audio.js`), diadopsi dari proyek **Game Cozy** supaya kedua game terdengar satu keluarga. Tidak ada file audio yang diunduh, jadi tidak ada jeda muat dan ukuran build tidak bertambah.

- **Bus**: `master → musicBus (musicVolume) · ambBus (musicVolume × 0,64) · sfxBus (sfxVolume)`. Musik dan ambience naik-turun bersama, SFX punya kenop sendiri.
- **Musik**: kotak musik pentatonik (C5 D5 E5 G5 A5 C6 E6) berjalan acak, satu nada tiap 0,34 dtk, dengan bass empat nada (C3 G2 A2 F2) di bawahnya. Pentatonik dipilih karena tidak ada interval yang bisa terdengar sumbang, jadi jalan acak pun selalu enak — dan karena tak ada trek yang berulang, tidak ada titik loop untuk didengar.
- **Ambience**: siang = kicau burung acak, malam = jangkrik. Berganti otomatis pada event `time:hour` (siang 06.00–18.00).
- **SFX**: `step · hoe · plant · water · harvest · chop · rock · scythe · coin · talk · ui · denied · sleep`. Langkah kaki dipicu `Character.onStep`, sekali tiap 24 px berjalan, jadi ritmenya sama di frame rate mana pun.
- `AudioContext` dibuat suspended dan di-unlock pada gestur pertama (browser memblokir audio sebelum ada interaksi).
- Volume musik default **15 %**, volume efek **60 %**, disimpan di `localStorage` (`lk_audio`) bersama pengaturan zoom.
- `assets/audio/music/theme.ogg` masih ada di disk tapi **tidak dipakai lagi**; prompt untuk trek buatan sendiri tetap tersimpan di `AUDIO.md` kalau nanti mau kembali ke musik file.

## 6.1b Animasi Hewan Ternak

Ayam, anjing, dan sapi memakai sheet **8 frame** menghadap kiri; sisi kanan
dicerminkan saat menggambar.

| Rentang | Frame | Kecepatan |
|---------|-------|-----------|
| Diam | 0–1 | 1,2 fps — satu ketukan napas atau ekor, bukan animasi |
| Jalan | 2–5 | dari `fps` di manifest tiap hewan: ayam & anjing 8, sapi 5 |
| Aksi (makan, mematuk, duduk) | 6–7 | 2,5 fps |

Tiap keadaan punya rentangnya sendiri, dan itu memperbaiki kesalahan yang
bertahan lama: sheet lama hanya punya empat frame, dan siklus jalannya ditulis
`[1, 2, 1, 3]` — frame 3 adalah pose makan. Setiap hewan di ladang berjalan
sambil mengunyah. Dengan rentang terpisah, frame makan tidak bisa lagi
terjangkau dari keadaan berjalan.

Kecepatan langkah diambil dari manifest per hewan, bukan satu angka untuk
semua: sapi yang berjalan pelan tidak boleh mengayun kaki secepat ayam.

## 6.1c Persahabatan Warga

Delapan warga punya **hati 0–10**. Kode menyimpannya sebagai **poin**, bukan
hati — satu hati per 100 poin. Memisahkan keduanya berarti hadiah bisa bernilai
45 atau 80 tanpa memaksa setiap kenaikan terlihat sebagai satu hati penuh:
pemain melihat batang hati yang bertambah pelan, kode bekerja dengan bilangan
bulat yang rapi.

| Perbuatan | Poin |
|-----------|------|
| Menyapa (sekali sehari) | +8 |
| Hadiah kesukaannya | +80 |
| Hadiah yang disukai | +45 |
| Hadiah biasa | +20 |
| Sepatu bekas | −20 |

**Satu hadiah per orang per hari.** Tanpa batas ini, seluruh isi tas bisa
ditumpahkan ke satu orang dalam sepuluh detik dan hatinya penuh di hari pertama —
persahabatan yang didapat begitu tidak terasa seperti apa pun. Alat tidak bisa
diberikan: pemain cuma punya satu dari masing-masing.

Kesukaan dicocokkan lewat **nama tampilan** barang, bukan id, karena `likes` di
`npcs.json` ditulis untuk dibaca manusia ("Kopi", "Bunga liar"). Cocok persis
bernilai penuh, cocok sebagian bernilai satu tingkat di bawahnya.

Setelah **empat hati**, baris `friend` di `npcs.json` menggantikan dialog biasa.
Kalau seorang warga belum punya baris itu, ia jatuh kembali ke dialog musiman —
jadi menambahkannya untuk satu orang tidak memaksa tujuh lainnya ikut ditulis.

"Sekali sehari" dihitung dari **nomor hari yang tidak pernah mundur**
(`tahun·4·28 + musim·28 + hari`), bukan dari tanggal. Tanggal saja akan membuat
hari 1 musim gugur terbaca sama dengan hari 1 musim semi, dan jatah hadiah ikut
tereset tiap musim berganti.

## 6.1d Jadwal Harian

Tiap warga punya empat entri jadwal di `npcs.json` — jam mulai dan nama tempat.
Tempatnya disebut namanya (`toko`, `dermaga`, `kolam`), bukan koordinat;
`map.places` yang menerjemahkannya, jadi menggeser bangunan tidak diam-diam
memutus jadwal siapa pun.

Perpindahan jauh dilakukan dengan **menempatkan langsung saat pemain tidak
melihat**. Berjalan menyeberangi lembah butuh pencarian jalur, dan tanpa itu
seorang warga akan tersangkut di sudut lumbung sampai jam berikutnya. Kalau ia
sedang terlihat, ia berjalan seperti biasa. Ini kebohongan yang tidak pernah
tertangkap mata, dan jauh lebih murah daripada pencarian jalur untuk delapan
orang.

Jadwal juga dijalankan sekali saat game boot, bukan hanya saat jam berganti —
kalau tidak, pemain yang bangun jam 06:00 melihat seisi desa berdiri di titik
awalnya.

## 6.2 Inventori dan Membuang Barang

`I` atau `Tab` membuka tas 24 slot. Panah memilih, `E` mengangkat lalu menaruh
barang di slot lain, `Backspace` membuangnya.

Membuang dibuat **dua langkah**: penekanan pertama menandai slotnya dengan
bingkai merah dan bertanya berapa banyak yang akan hilang, penekanan kedua baru
membuang. Konfirmasinya kedaluwarsa sendiri setelah 4 detik dan batal begitu
kursor berpindah — yang dikonfirmasi adalah barang tertentu, bukan tombolnya.
Satu tekan tanpa konfirmasi terlalu mudah menghapus tumpukan hasil panen
sepanjang hari.

**Alat tidak bisa dibuang** (apa pun yang punya `tool` di `items.json`: cangkul,
kapak, beliung, sabit, penyiram, pancing). Jumlahnya satu dan tidak ada cara
gratis mendapatkannya kembali, jadi membolehkannya hanya menyiapkan cara merusak
permainan sendiri.

Barang yang dibuang **hilang**, tidak jatuh ke tanah. Menjatuhkannya butuh
entitas barang di peta beserta aturan pungut dan simpannya di save; itu belum
sepadan untuk MVP.

## 6.2a Cahaya Malam

Jendela bangunan dan lampu jalan menyala setelah gelap. Tidak ada aset baru yang
digenerate untuk ini — seluruhnya gradien radial yang digambar kode.

Kuncinya urutan komposit. Tint senja adalah pass `multiply` yang menutupi
seluruh layar, dan begitu ia tergambar di kanvas game tidak ada lagi cara
melubanginya. Jadi tintnya dibangun dulu di kanvas terpisah, lubang cahayanya
dilubangi di sana dengan `destination-out`, baru hasilnya di-`multiply` ke
adegan. Setelah itu satu pass `lighter` menambahkan pendar hangat, supaya lampu
terbaca *menyala* dan bukan sekadar *kurang gelap*.

Kekuatan cahayanya ikut alpha tint, bukan jam tertentu: lampu menguat sendiri
seiring langit menggelap dan tidak pernah menyala di siang bolong. Radiusnya
berdenyut ±3 % dengan fase acak per lampu — cukup untuk terasa hidup, tidak
sampai terlihat berkedip.

Daftar sumbernya dibangun di `valley.js` bersama bangunannya (`map.lights`):
setiap pintu bangunan dapat satu titik di dinding — bukan di jalan di bawahnya,
supaya cahayanya terbaca keluar dari jendela — dan tiap lampu jalan dapat satu
titik satu petak di atas tiangnya, karena apinya di ujung atas. Saat ini 11
jendela dan 4 lampu jalan. Diukur 60 fps, sama seperti siang.

## 6.2b Satwa Penghias

Kupu-kupu, burung, capung, kepiting, dan kunang-kunang. Semuanya di
`src/systems/critters.js`, tidak bisa disentuh dan tidak disimpan di save —
tugasnya hanya membuat lembah tidak terlihat seperti diorama di sela-sela pemain
mengerjakan sesuatu.

| Satwa | Zona | Waktu | Gerak |
|-------|------|-------|-------|
| Kupu-kupu | hutan saja | siang | melayang |
| Capung | tepi kolam air tawar | siang | melayang |
| Kepiting | pasir | siang | menyusur pasir |
| Kunang-kunang | hutan, sabuk pohon | malam | melayang |
| ~~Burung~~ | ~~sabuk pohon, hutan, rumput~~ | — | disembunyikan (`off: true`) |

**Sedikit itu lebih hidup.** Kupu-kupu sempat tersebar juga di rumput terbuka
dan di petak kebun dengan jumlah dua kali lipat; hasilnya terbaca sebagai
konfeti yang melayang di depan semua yang sedang dilihat pemain, bukan sebagai
sesuatu yang tinggal di hutan. Sekarang mereka hanya di hutan, ukurannya
diperkecil 28 px → 20 px, dan jumlahnya lima. `off: true` menyimpan satwa yang
asetnya sudah jadi tapi belum ingin ditampilkan, tanpa perlu menghapus apa pun.

Zonanya dipinjam dari `map.zoneAt` — fungsi yang sama yang menempatkan pohon dan
batu — jadi tidak ada kupu-kupu yang melayang di atas laut. Tiap satwa memudar
masuk dan keluar selama 1,5 detik saat gilirannya berganti, bukan muncul dan
hilang begitu saja.

Tiga hal yang perlu dijaga kalau daftarnya ditambah:

- **Yang terbang digambar setelah pass y-sort**, karena mereka di udara;
  mengurutkannya menurut y akan menguburnya di dalam rumput.
- **Yang bertugas malam digambar setelah tint senja.** Tint itu pass `multiply`
  — kunang-kunang yang digambar sebelumnya akan dikalikan sampai gelap, persis
  di satu-satunya waktu ia seharusnya jadi benda paling terang di layar.
- **Capung hanya di air tawar.** Tepi air yang bertetangga dengan pasir berarti
  laut, dan capung di atas air asin adalah kebohongan kecil yang justru
  disadari mata.

## 6.2b2 Pilihan Karakter

Empat karakter bisa dipilih di homepage. Daftarnya satu, `AVATARS` di
`src/core/save.js`, dipakai kartu pemilih avatar sekaligus daftar warga —
menambah karakter berikutnya cukup menambah satu baris di sana.

Profil menyimpan **`avatar`** berisi id sprite, bukan lagi `gender` yang hanya
punya dua nilai. Profil lama tetap dikenali: `avatarOf(profile)` memakai
`avatar` kalau ada, kalau tidak menerjemahkan `gender` lama, dan kalau keduanya
tidak ada memberi `player_m`.

Satu jebakan yang sempat kena: profil bawaan di `main.js` dulu ikut mengisi
`avatar`. Karena profil tersimpan digabungkan **di atas** bawaan, profil lama
yang hanya punya `gender: 'f'` tidak menimpa apa pun dan pemainnya berubah
wajah jadi laki-laki. Profil bawaan sekarang tidak menyebut `avatar` maupun
`gender` sama sekali — yang menentukan hanya `avatarOf()`.

## 6.2b3 Panel Obrolan: Dua Batas yang Mudah Terlupa

- **Kata tanpa spasi harus dipotong per huruf.** `wrap()` di `ui/draw.js` dulu
  hanya memecah di spasi, jadi satu pesan panjang tanpa spasi keluar dari panel
  dan sisanya tidak pernah terbaca. Sekarang kata yang sendirian saja sudah
  lebih lebar dari ruangnya dipotong per huruf.
- **Gulir riwayat harus dibatasi tinggi isinya.** Tanpa batas atas, roda mouse
  menggulung riwayat sampai jauh ke atas dan menyisakan panel kosong tanpa
  petunjuk cara kembali. Batasnya dihitung saat menggambar, ketika tinggi tiap
  pesan sudah diketahui, lalu dipakai `wheel()` di frame berikutnya.

## 6.2c Akun Pemain

Nama yang diisi di homepage **adalah** username: huruf dan angka saja, 3–16
karakter, unik tanpa memandang besar-kecil huruf (`Iqbal` dan `iqbal` orang yang
sama). Aturannya ketat karena username itu satu-satunya jalan masuk kembali —
ia harus bisa diketik ulang tanpa salah.

| Berkas | Isi |
|--------|-----|
| `tools/players.py` | tabel `players`, endpoint daftar/lanjut/simpan |
| `src/core/account.js` | klien: validasi, cek ketersediaan, kunci sesi |
| `index.html` | formulir "Mulai Baru" dan "Lanjutkan" |

**Simpanan permainan ikut naik ke server**, dikunci username. Urutannya selalu
localStorage dulu, server belakangan: kalau servernya mati, progres tetap aman
di peramban itu dan yang hilang hanya kemampuan melanjutkan dari komputer lain
sampai penyimpanan berikutnya berhasil. Saat melanjutkan, simpanan dari server
ditulis ke localStorage lebih dulu lalu game boot seperti biasa — satu jalur
muat, bukan dua.

### Apa yang diberikan, dan apa yang tidak

Ini disengaja tanpa kata sandi, jadi batasnya perlu jelas:

- **Diberikan: keunikan dan cara masuk kembali.** Satu username satu orang, dan
  simpanannya bisa diambil dari peramban mana pun.
- **Tidak diberikan: pembuktian.** Siapa pun yang tahu username orang lain bisa
  mengetiknya dan mengambil alih simpanan sekaligus identitas obrolannya. Tidak
  ada lapisan di server yang bisa menutup ini; obatnya kata sandi, bukan
  pemeriksaan tambahan.

**Kunci sesi** diterbitkan saat mendaftar dan saat melanjutkan, hash-nya
disimpan di kolom `key_hash`, dan ia **wajib** untuk menulis simpanan.
Perbandingannya `secrets.compare_digest`, bukan `==` — perbandingan string biasa
berhenti di karakter pertama yang beda dan selisih waktunya bisa dipakai menebak
kunci. Yang ditutup kunci ini: penulisan langsung ke API oleh yang sekadar
menebak username. Yang tidak ditutup: pengambilalihan lewat `resume`. Kolom
`secret` sudah disediakan kosong sebagai tempat hash kata sandi nanti, jadi
tabelnya tidak perlu dibongkar.

## 6.2d Penjaga API dan Penyaring Obrolan

`tools/guard.py` dipasang di depan semua endpoint `/api/*`:

| Lapisan | Isi |
|---------|-----|
| Batas laju **per-IP** | poll 150/menit, kirim pesan 25/menit, daftar akun 8/jam, simpan 20/menit |
| Batas ukuran badan | 512 KB, **ditolak sebelum dibaca** — membaca dulu baru menolak berarti penyerang tetap bisa memaksa server menampung apa pun yang ia kirim |
| Pemeriksaan bentuk | badan wajib objek JSON; tiap field diambil dengan tipe dan panjang yang dipaksakan |
| Simpanan | maksimal 256 KB dan wajib objek |

Batas per-IP-lah yang benar-benar menahan penyalahgunaan. Batas per-token tetap
ada untuk mengerem pemain sungguhan yang menahan tombol kirim, tapi `token`
dibuat sendiri oleh peramban — pembanjir tinggal mengarang token baru tiap
permintaan.

Seluruh kueri SQL memakai parameter terikat, tidak ada satu pun string yang
disambung, jadi tidak ada jalan masuk injeksi SQL.

**Penyaring kata kasar** (`tools/moderation.py`) menyensor, bukan menolak.
Menolak hanya mengundang percobaan ejaan lain sampai lolos; menyensor sudah
menggagalkan maksudnya sejak awal dan orang lain tetap melihat kalimatnya.
Dua hal yang membuat daftar kata sederhana biasanya gagal, dan cara keduanya
ditangani:

1. **Penyamaran** — `k0nt0l`, `anjiiiing`, `sh!t`. Teks dinormalkan dulu (angka
   yang menyamar jadi huruf dikembalikan, huruf berulang dirapatkan), lalu
   dicocokkan. Tanda baca seperti `!` hanya dianggap huruf kalau berada **di
   dalam** kata; tanpa syarat itu `BANGSAT!!!` berubah jadi `bangsati` dan
   justru lolos.
2. **Kata sah yang mengandung kata kasar** — pencocokan memakai batas kata, jadi
   `sialan` kena tapi `spesial` dan `sosialisasi` tidak.

Peta indeks disimpan selama normalisasi supaya yang disensor persis potongan di
teks asli, bukan posisi di teks hasil normalisasi yang panjangnya sudah berubah.

## 6.3 Obrolan Publik

Gelembung di pojok kiri bawah membuka obrolan untuk semua pemain yang sedang
online. Namanya nama yang diisi di homepage, fotonya portrait avatar yang
dipilih. Tombolnya sengaja hanya gelembung: jumlah yang online ada di dalam
panel, tempat angkanya punya cukup ruang untuk menjelaskan dirinya sendiri.

**Pesan sendiri menggantung di kanan**, milik orang lain di kiri — bentuk yang
sudah dikenal semua orang dari aplikasi pesan, jadi tidak perlu dijelaskan.
Penandanya bukan perbandingan nama (dua orang bisa memakai nama sama) melainkan
token pengirim, dan `own` dihitung di server. Kalau dihitung di klien dari daftar
id yang pernah dikirim tab ini, pesan sendiri akan berpindah ke kiri begitu
halaman dimuat ulang.

| Bagian | Berkas |
|--------|--------|
| Server | `tools/chat.py`, dipasang ke `tools/serve.py` |
| Klien | `src/systems/chat.js` |
| Tampilan | `src/ui/chat-ui.js` |

**Kenapa long-poll HTTP, bukan WebSocket.** Server game sudah berupa
`ThreadingTCPServer` dari pustaka standar Python, jadi long-poll tidak menambah
satu pun dependensi. `GET /api/chat` digantung sampai 25 detik dan dibangunkan
oleh `threading.Condition` begitu ada yang bicara, jadi pesannya tetap terasa
seketika. WebSocket baru sepadan kalau nanti posisi pemain ikut disiarkan
puluhan kali per detik.

**Mengetik lewat `<input>` DOM tak terlihat**, bukan penanganan tombol sendiri.
Itu satu-satunya cara mendapat komposisi IME, tempel dari papan klip, koreksi
otomatis, dan papan ketik ponsel secara gratis — dan entri teks justru tempat
paling buruk untuk menulis ulang perilaku peramban. Yang dilihat pemain tetap
digambar di kanvas supaya senapas dengan UI lain. Handler `keydown`-nya memanggil
`stopPropagation()` supaya mengetik "wasd" tidak ikut menggerakkan petani.

**Identitas per tab**, disimpan di `sessionStorage`: bertahan saat halaman
dimuat ulang tapi berbeda antar jendela, jadi dua tab terhitung dua pemain. Itu
yang diharapkan dari angka "online", sekaligus satu-satunya cara satu orang bisa
mencoba fiturnya sendirian.

**Nama dan avatar disimpan terpisah dari berkas save** (`lk_profile`,
`src/core/save.js`). Serah terima dari homepage habis sekali baca, dan berkas
save baru ditulis saat pemain tidur — jadi di antara "mulai permainan baru" dan
"tidur pertama kali" tidak ada tempat nama itu tinggal. Memuat ulang halaman di
rentang itu mengubah Iqbal kembali jadi Petani, dan obrolan membuatnya terlihat
oleh semua orang. Sekarang profil ditulis begitu game boot, dan urutan
prioritasnya: serah terima homepage → profil di berkas save → profil tersimpan
→ bawaan.

**Kehadiran.** Tab yang ditutup mengirim `POST /api/chat/bye` lewat
`navigator.sendBeacon` (pada `pagehide`, bukan `beforeunload`, karena yang kedua
tidak dapat diandalkan di ponsel), jadi angka online langsung menyusut. Kalau
kepergiannya tidak sempat berpamitan — browser dimatikan paksa, jaringan putus —
tokennya kedaluwarsa sendiri setelah 30 detik. Jendela itu harus lebih panjang
daripada satu long-poll (20 detik), kalau tidak klien yang sedang menggantung
justru terhitung pergi.

**Penyimpanannya SQLite** (`var/chat.db`, dibuat sendiri saat server pertama
dijalankan, tidak ikut git). Dua tabel: `messages` dan `presence`. Ini pun tetap
pustaka standar — tidak ada dependensi baru.

- Satu koneksi **per thread** lewat `threading.local`. Objek `sqlite3.Connection`
  tidak boleh berpindah thread, dan satu kunci global akan menyerialkan seluruh
  long-poll yang sedang menggantung.
- Mode jurnal **WAL**, karena pembacanya banyak: tiap klien menggantung satu poll,
  dan tanpa WAL satu penulis memblokir mereka semua.
- **Pembatasan laju dibaca dari tabel `messages` itu sendiri** — `COUNT(*)` dan
  `MAX(ts)` untuk token yang sama dalam 60 detik terakhir — bukan dari catatan
  terpisah. Satu sumber kebenaran, dan ia ikut selamat dari restart.
- Riwayat dipangkas di 2.000 pesan; yang dikirim ke klien 40 terakhir.

**Batasan di server**: 160 karakter per pesan, nama 20 karakter, satu pesan per
1,2 detik dan maksimal 20 pesan per menit dari satu orang.

**Yang basis data ini tidak selesaikan: identitas.** `token` hanyalah string acak
buatan browser dan nama ikut dikirim di tiap pesan, jadi siapa pun yang tahu
alamat API-nya bisa mengirim atas nama siapa saja — itu terbukti waktu pengujian,
pesan atas nama "Kang Dadang" dikirim dari `curl`. Untuk main bareng teman itu
tidak masalah; untuk publik, itu perlu sistem akun, bukan tabel tambahan.

**Jangkauan.** Server hanya mengikat `127.0.0.1`, jadi bawaannya obrolan cuma
antar tab di satu komputer. Untuk mengundang orang lain di jaringan yang sama:
`python tools/serve.py --host 0.0.0.0`. Perlu diingat itu juga membuka seluruh
isi folder projek ke jaringan tersebut. Supaya bisa diakses dari internet, server
ini harus di-hosting — belum dikerjakan.

## 7.1 Menu Jeda

`Esc` membuka menu: **Lanjut · Petunjuk · Pengaturan · Keluar**. Panah untuk navigasi, `E` konfirmasi, `Esc` mundur satu tingkat (dan menutup dari halaman utama) sehingga pemain tidak pernah terjebak di submenu. Pengaturan berisi volume musik (±5 %), volume efek (±5 %), bisukan semua, dan zoom tampilan (Otomatis / ×1–×4); semuanya langsung tersimpan. Keluar menyimpan permainan lebih dulu, lalu kembali ke homepage. Semua panel menyesuaikan lebar/tinggi ke viewport supaya tidak terpotong di layar pendek.

## 8. Quality Gates (aset)
- Kohesi: proyeksi, arah cahaya, tebal outline, palet ≤ 48 sama di semua aset.
- Keterbacaan: siluet jelas di skala ×1 pada latar rumput.
- Teknis: ukuran tepat, alpha bersih (tidak ada halo hijau), pivot konsisten, tanpa teks/label/watermark.
- Animasi: proporsi, kostum, baseline kaki tidak drift antar frame.
- Terrain: uji ulang 3×3 tanpa seam.
