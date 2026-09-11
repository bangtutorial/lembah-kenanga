// Full inventory screen: 24 slots (3 rows), click or arrow keys to move items.
import { view } from '../render/renderer.js';
import { panel, text, icon, slot, UI } from './draw.js';
import { itemDef, SLOTS } from '../systems/inventory.js';

const S = 40, GAP = 4, COLS = 8;

export class InventoryUI {
  constructor(inv) {
    this.inv = inv;
    this.open = false;
    this.cursor = 0;
    this.holding = -1;
    this.confirm = -1;      // slot yang sedang menunggu penekanan kedua
    this.confirmT = 0;
    this.note = '';
    this.noteT = 0;
  }

  toggle() { this.open = !this.open; this.holding = -1; this.clearConfirm(); }

  clearConfirm() { this.confirm = -1; this.confirmT = 0; }

  say(msg) { this.note = msg; this.noteT = 2.5; }

  update(dt) {
    // Konfirmasi buang kedaluwarsa sendiri. Kalau ia menunggu selamanya, satu
    // penekanan Backspace beberapa menit kemudian akan membuang barang yang
    // pemainnya sudah lupa pernah ia pilih.
    if (this.confirmT > 0 && (this.confirmT -= dt) <= 0) this.clearConfirm();
    if (this.noteT > 0 && (this.noteT -= dt) <= 0) this.note = '';
  }

  /** Alat tidak bisa dibuang: hanya ada satu dan tidak bisa dibeli ulang gratis. */
  canDrop(s) { return !!s && !itemDef(s.id)?.tool; }

  drop() {
    const i = this.cursor;
    const s = this.inv.slots[i];
    if (!s) return;
    const d = itemDef(s.id);
    if (!this.canDrop(s)) { this.say(`${d?.name ?? s.id} tidak bisa dibuang.`); return; }
    if (this.confirm !== i) {
      this.confirm = i;
      this.confirmT = 4;
      this.say(`Buang ${s.count}× ${d?.name ?? s.id}? Tekan Backspace lagi.`);
      return;
    }
    this.inv.removeAt(i, s.count);
    this.clearConfirm();
    this.say(`${d?.name ?? s.id} dibuang.`);
  }

  rect() {
    const w = COLS * (S + GAP) - GAP + 48;
    // +146, bukan +112: petunjuk kontrolnya kini dua baris karena satu baris
    // sudah melebihi lebar panel, dan bingkai kayu panel setebal 12 px ikut
    // memakan ruang di bawahnya.
    const h = Math.ceil(SLOTS / COLS) * (S + GAP) - GAP + 146;
    return { x: Math.round((view.w - w) / 2), y: Math.round((view.h - h) / 2), w, h };
  }

  slotAt(mx, my) {
    const { x, y } = this.rect();
    const gx = x + 24, gy = y + 56;
    const c = Math.floor((mx - gx) / (S + GAP)), r = Math.floor((my - gy) / (S + GAP));
    if (c < 0 || c >= COLS || r < 0) return -1;
    const i = r * COLS + c;
    return i < SLOTS ? i : -1;
  }

  /** Keyboard navigation + pick/place. */
  key(action) {
    const before = this.cursor;
    if (action === 'left') this.cursor = (this.cursor + SLOTS - 1) % SLOTS;
    if (action === 'right') this.cursor = (this.cursor + 1) % SLOTS;
    if (action === 'up') this.cursor = (this.cursor + SLOTS - COLS) % SLOTS;
    if (action === 'down') this.cursor = (this.cursor + COLS) % SLOTS;
    if (action === 'interact') this.pick(this.cursor);
    if (action === 'drop') this.drop();
    // Berpindah slot membatalkan konfirmasi: yang dikonfirmasi adalah barang
    // tertentu, bukan tombolnya.
    if (this.cursor !== before) this.clearConfirm();
  }

  pick(i) {
    if (i < 0) return;
    if (this.holding < 0) { if (this.inv.slots[i]) this.holding = i; }
    else { this.inv.swap(this.holding, i); this.holding = -1; }
  }

  draw(ctx) {
    if (!this.open) return;
    const { x, y, w, h } = this.rect();
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0, 0, view.w, view.h);
    panel(ctx, x, y, w, h);
    text(ctx, 'INVENTORI', x + w / 2, y + 20, { font: UI.fontTitle, align: 'center', color: UI.red });

    const gx = x + 24, gy = y + 56;
    for (let i = 0; i < SLOTS; i++) {
      const sx = gx + (i % COLS) * (S + GAP), sy = gy + Math.floor(i / COLS) * (S + GAP);
      slot(ctx, sx, sy, i === this.cursor ? 1 : 0);
      if (i < 9) text(ctx, String(i + 1), sx + 3, sy + 2, { font: '12px "VT323", monospace', color: '#6b5a3a' });
      const s = this.inv.slots[i];
      if (!s) continue;
      const d = itemDef(s.id);
      if (this.holding === i) ctx.globalAlpha = 0.45;
      if (d) icon(ctx, d.sheet, d.i, sx + 4, sy + 4);
      ctx.globalAlpha = 1;
      if (s.count > 1) text(ctx, String(s.count), sx + S - 4, sy + S - 18, { font: UI.font, align: 'right', color: '#fff', shadow: true });
    }

    // Slot yang menunggu konfirmasi diberi bingkai merah, supaya jelas barang
    // mana yang akan hilang kalau tombolnya ditekan sekali lagi.
    if (this.confirm >= 0) {
      const cx = gx + (this.confirm % COLS) * (S + GAP), cy = gy + Math.floor(this.confirm / COLS) * (S + GAP);
      ctx.strokeStyle = '#b8432e';
      ctx.lineWidth = 3;
      ctx.strokeRect(cx - 1.5, cy - 1.5, S + 3, S + 3);
      ctx.lineWidth = 1;
    }

    const sel = this.inv.slots[this.cursor];
    const info = sel ? `${itemDef(sel.id)?.name ?? sel.id}${itemDef(sel.id)?.sell ? ` — jual G${itemDef(sel.id).sell}` : ''}` : 'Kosong';
    text(ctx, this.note || info, x + w / 2, y + h - 78,
      { font: UI.fontBig, align: 'center', color: this.note ? '#8a2c1d' : UI.outline });
    text(ctx, 'Panah pilih  ·  E pindah barang', x + w / 2, y + h - 52,
      { font: UI.font, align: 'center', color: '#5a4a30' });
    text(ctx, 'Backspace buang  ·  I / Esc tutup', x + w / 2, y + h - 32,
      { font: UI.font, align: 'center', color: '#5a4a30' });
  }
}
