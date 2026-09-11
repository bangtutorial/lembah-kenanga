// Persahabatan dengan warga desa: hati, hadiah, dan sapaan harian.
//
// Angkanya disimpan sebagai POIN, bukan hati. Hati adalah cara menampilkannya —
// satu hati per 100 poin — dan memisahkan keduanya berarti hadiah bisa bernilai
// 45 atau 80 tanpa harus memaksa setiap kenaikan terlihat sebagai satu hati
// penuh. Pemain melihat batang hati yang bertambah pelan; kode bekerja dengan
// bilangan bulat yang rapi.
export const PER_HEART = 100;
export const MAX_HEARTS = 10;

const TALK_POINTS = 8;          // sekali sehari, sekadar menyapa
const GIFT = { love: 80, like: 45, neutral: 20, dislike: -20 };

// Satu hadiah per orang per hari. Tanpa batas ini, seluruh isi tas bisa
// ditumpahkan ke satu orang dalam sepuluh detik dan hatinya penuh di hari
// pertama — persahabatan yang didapat begitu tidak terasa seperti apa pun.
const GIFTS_PER_DAY = 1;

/** Barang yang tidak pantas diberikan sebagai hadiah. */
function giftable(def) {
  if (!def) return false;
  if (def.tool) return false;           // alat: satu-satunya milik pemain
  if (def.id === 'junk_boot') return true;  // boleh, tapi hasilnya negatif
  return true;
}

export class Social {
  constructor(npcData) {
    this.data = npcData;
    this.state = {};   // id -> { points, talkedOn, giftsOn, giftCount }
    for (const n of npcData) this.state[n.id] = { points: 0, talkedOn: 0, giftsOn: 0, giftCount: 0 };
  }

  of(id) {
    return (this.state[id] ??= { points: 0, talkedOn: 0, giftsOn: 0, giftCount: 0 });
  }

  hearts(id) { return Math.floor(this.of(id).points / PER_HEART); }
  points(id) { return this.of(id).points; }

  add(id, n) {
    const s = this.of(id);
    s.points = Math.max(0, Math.min(MAX_HEARTS * PER_HEART, s.points + n));
    return s.points;
  }

  /** Sapaan pertama hari itu menambah sedikit; sisanya hari itu tidak. */
  talk(id, dayNumber) {
    const s = this.of(id);
    if (s.talkedOn === dayNumber) return 0;
    s.talkedOn = dayNumber;
    this.add(id, TALK_POINTS);
    return TALK_POINTS;
  }

  canGift(id, dayNumber) {
    const s = this.of(id);
    if (s.giftsOn !== dayNumber) return true;
    return s.giftCount < GIFTS_PER_DAY;
  }

  /**
   * Nilai satu hadiah untuk seseorang. `likes` di npcs.json ditulis sebagai
   * nama tampilan ("Kopi", "Bunga liar"), jadi pencocokannya lewat nama barang
   * dan tidak peka huruf besar-kecil — daftar itu ditulis untuk dibaca manusia,
   * bukan sebagai id.
   */
  rate(npcId, def) {
    if (!def) return null;
    if (def.id === 'junk_boot') return 'dislike';
    const npc = this.data.find((n) => n.id === npcId);
    const likes = (npc?.likes ?? []).map((s) => s.toLowerCase());
    const name = (def.name ?? '').toLowerCase();
    if (likes.includes(name)) return 'love';
    if (likes.some((l) => name.includes(l) || l.includes(name))) return 'like';
    return 'neutral';
  }

  /** Berikan satu barang. Mengembalikan {ok, kind, points, hearts} atau {ok:false, why}. */
  give(npcId, def, dayNumber) {
    if (!giftable(def)) return { ok: false, why: 'tool' };
    if (!this.canGift(npcId, dayNumber)) return { ok: false, why: 'today' };
    const kind = this.rate(npcId, def);
    const s = this.of(npcId);
    if (s.giftsOn !== dayNumber) { s.giftsOn = dayNumber; s.giftCount = 0; }
    s.giftCount += 1;
    const before = this.hearts(npcId);
    this.add(npcId, GIFT[kind]);
    return { ok: true, kind, points: GIFT[kind], hearts: this.hearts(npcId), gained: this.hearts(npcId) > before };
  }

  toJSON() { return this.state; }

  load(saved) {
    if (!saved) return;
    for (const [id, s] of Object.entries(saved)) {
      if (this.state[id]) Object.assign(this.state[id], s);
    }
  }
}

export const GIFT_REPLY = {
  love: ['Ini kesukaanku! Terima kasih banyak.', 'Wah, kamu ingat aku suka ini?'],
  like: ['Terima kasih, aku suka ini.', 'Baik sekali kamu.'],
  neutral: ['Terima kasih, ya.', 'Oh, boleh juga. Terima kasih.'],
  dislike: ['Eh... terima kasih. Mungkin.', 'Hmm. Baiklah, terima kasih.'],
};
