// Storage chest: chest slots on top, the player's inventory below.
// Arrow keys move the cursor between both grids, E moves one stack across.
import { view } from '../render/renderer.js';
import { panel, text, icon, slot, UI } from './draw.js';
import { itemDef, SLOTS } from '../systems/inventory.js';

const S = 40, GAP = 4, COLS = 8;
export const CHEST_SLOTS = 24;

export class ChestUI {
  constructor(inv, chest) {
    this.inv = inv;
    this.chest = chest;      // plain array of {id, count} | null
    this.open = false;
    this.cursor = 0;         // 0..CHEST_SLOTS-1 = chest, then inventory
  }

  get total() { return CHEST_SLOTS + SLOTS; }
  get inChest() { return this.cursor < CHEST_SLOTS; }

  toggle() { this.open = !this.open; this.cursor = 0; }

  rect() {
    const w = COLS * (S + GAP) - GAP + 48;
    const rows = Math.ceil(CHEST_SLOTS / COLS) + Math.ceil(SLOTS / COLS);
    const h = rows * (S + GAP) - GAP + 150;
    return { x: Math.round((view.w - w) / 2), y: Math.round((view.h - h) / 2), w, h };
  }

  key(action) {
    const n = this.total;
    if (action === 'left') this.cursor = (this.cursor + n - 1) % n;
    if (action === 'right') this.cursor = (this.cursor + 1) % n;
    if (action === 'up') this.cursor = (this.cursor + n - COLS) % n;
    if (action === 'down') this.cursor = (this.cursor + COLS) % n;
    if (action === 'interact') this.transfer();
  }

  /** Move the stack under the cursor to the other container. */
  transfer() {
    if (this.inChest) {
      const i = this.cursor, s = this.chest[i];
      if (!s) return;
      const left = this.inv.add(s.id, s.count, s.water !== undefined ? { water: s.water } : null);
      if (left < s.count) this.chest[i] = left ? { ...s, count: left } : null;
    } else {
      const i = this.cursor - CHEST_SLOTS, s = this.inv.slots[i];
      if (!s) return;
      const free = this.chest.findIndex((c, j) => !c || (c.id === s.id && c.count < 99 && j >= 0));
      if (free < 0) return;
      if (!this.chest[free]) this.chest[free] = { ...s };
      else this.chest[free].count += s.count;
      this.inv.removeAt(i, s.count);
    }
  }

  slotAt(mx, my) {
    const { x, y } = this.rect();
    const gx = x + 24;
    const chestRows = Math.ceil(CHEST_SLOTS / COLS);
    const gy1 = y + 48, gy2 = gy1 + chestRows * (S + GAP) + 34;
    for (const [base, gy, count] of [[0, gy1, CHEST_SLOTS], [CHEST_SLOTS, gy2, SLOTS]]) {
      const c = Math.floor((mx - gx) / (S + GAP)), r = Math.floor((my - gy) / (S + GAP));
      if (c < 0 || c >= COLS || r < 0) continue;
      const i = r * COLS + c;
      if (i < count) return base + i;
    }
    return -1;
  }

  draw(ctx) {
    if (!this.open) return;
    const { x, y, w, h } = this.rect();
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0, 0, view.w, view.h);
    panel(ctx, x, y, w, h);
    const chestRows = Math.ceil(CHEST_SLOTS / COLS);
    const gx = x + 24, gy1 = y + 48, gy2 = gy1 + chestRows * (S + GAP) + 34;

    text(ctx, 'PETI PENYIMPANAN', x + w / 2, y + 18, { font: UI.fontTitle, align: 'center', color: UI.red });
    text(ctx, 'Tas kamu', x + 24, gy2 - 26, { font: UI.fontBig });

    const grid = (base, gy, arr, count) => {
      for (let i = 0; i < count; i++) {
        const sx = gx + (i % COLS) * (S + GAP), sy = gy + Math.floor(i / COLS) * (S + GAP);
        slot(ctx, sx, sy, base + i === this.cursor ? 1 : 0);
        const s = arr[i];
        if (!s) continue;
        const d = itemDef(s.id);
        if (d) icon(ctx, d.sheet, d.i, sx + 4, sy + 4);
        if (s.count > 1) text(ctx, String(s.count), sx + S - 4, sy + S - 18, { font: UI.font, align: 'right', color: '#fff', shadow: true });
      }
    };
    grid(0, gy1, this.chest, CHEST_SLOTS);
    grid(CHEST_SLOTS, gy2, this.inv.slots, SLOTS);

    const sel = this.inChest ? this.chest[this.cursor] : this.inv.slots[this.cursor - CHEST_SLOTS];
    text(ctx, sel ? itemDef(sel.id)?.name ?? sel.id : 'Kosong', x + w / 2, y + h - 46, { font: UI.fontBig, align: 'center' });
    text(ctx, 'Panah pilih  ·  E pindahkan  ·  Esc tutup', x + w / 2, y + h - 26, { font: UI.font, align: 'center', color: '#5a4a30' });
  }
}
