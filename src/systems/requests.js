// Permintaan warga: satu titipan per hari, ditempel di papan Balai Desa.
//
// Gunanya bukan uangnya. Tanpa ini, hasil panen dan tangkapan hanya punya satu
// tujuan — kotak jual — dan semua barang jadi setara: sekadar angka harga.
// Permintaan membuat satu barang tertentu tiba-tiba lebih berharga dari
// harganya hari itu, dan memberi alasan untuk pergi ke tempat yang biasanya
// dilewati begitu saja.
import { makeRng } from '../core/rng.js';

const POINTS = 25;               // seperempat hati; lihat social.js
const REWARD_MULTIPLIER = 2.2;   // dibanding menjual sendiri ke kotak jual
const MIN_REWARD = 80;

/**
 * Berapa banyak yang diminta, menurut seberapa mudah barangnya didapat.
 *
 * Ikan besar dan susu diminta satu-dua saja; lobak dan batu boleh banyak.
 * Angkanya diikat ke harga jual supaya barang baru tidak perlu didaftar lagi
 * di sini — cukup punya harga, jumlahnya menyesuaikan sendiri.
 */
function amountFor(sell) {
  if (sell >= 120) return [1, 2];
  if (sell >= 60) return [2, 3];
  if (sell >= 25) return [3, 5];
  return [5, 8];
}

export class Requests {
  constructor(npcData, items) {
    this.npcs = npcData.filter((n) => n.wants?.length);
    this.items = items;
    this.doneOn = 0;      // nomor hari terakhir yang permintaannya diselesaikan
    this.total = 0;       // berapa kali sudah dibantu; dipakai papan pengumuman
  }

  /**
   * Permintaan hari ini. Diundi dari nomor harinya, bukan disimpan, supaya
   * memuat ulang save tidak pernah mengocok ulang permintaan yang sudah dibaca.
   */
  today(dayNumber) {
    if (!this.npcs.length) return null;
    const rng = makeRng(dayNumber * 7919 + 13);
    const npc = this.npcs[Math.floor(rng() * this.npcs.length)];
    const wants = npc.wants.filter((id) => this.items[id]?.sell);
    if (!wants.length) return null;
    const itemId = wants[Math.floor(rng() * wants.length)];
    const def = this.items[itemId];
    const [lo, hi] = amountFor(def.sell);
    const count = lo + Math.floor(rng() * (hi - lo + 1));
    const gold = Math.max(MIN_REWARD, Math.round(def.sell * count * REWARD_MULTIPLIER / 10) * 10);
    return { npcId: npc.id, npcName: npc.name, itemId, itemName: def.name, count, gold, points: POINTS };
  }

  done(dayNumber) { return this.doneOn === dayNumber; }

  /** Cukupkah isi tas untuk permintaan hari ini? */
  canFill(inv, dayNumber) {
    const r = this.today(dayNumber);
    return !!r && !this.done(dayNumber) && inv.count(r.itemId) >= r.count;
  }

  /**
   * Serahkan barangnya. Mengembalikan permintaan yang baru saja selesai, atau
   * null kalau belum cukup — pemanggilnya yang mengurus uang dan hati, karena
   * keduanya milik sistem lain.
   */
  fill(inv, dayNumber) {
    if (!this.canFill(inv, dayNumber)) return null;
    const r = this.today(dayNumber);
    let left = r.count;
    while (left > 0) {
      const i = inv.slots.findIndex((s) => s?.id === r.itemId);
      if (i < 0) return null;
      const take = Math.min(left, inv.slots[i].count);
      inv.removeAt(i, take);
      left -= take;
    }
    this.doneOn = dayNumber;
    this.total += 1;
    return r;
  }

  toJSON() { return { doneOn: this.doneOn, total: this.total }; }

  load(saved) {
    if (!saved) return;
    this.doneOn = saved.doneOn ?? 0;
    this.total = saved.total ?? 0;
  }
}

/** Kalimat di papan, ditulis seolah warga yang menempelnya. */
export function requestText(r, canFill) {
  const head = `${r.npcName} menitipkan pesan:`;
  const body = `"Aku butuh ${r.count} ${r.itemName}. Kalau ada, tolong bawa ke sini."`;
  const pay = `Upah: G${r.gold.toLocaleString('id-ID')}.`;
  return canFill
    ? `${head}|${body}|${pay} Tekan E untuk menyerahkan.`
    : `${head}|${body}|${pay} Bawa ke Balai Desa kalau sudah terkumpul.`;
}
