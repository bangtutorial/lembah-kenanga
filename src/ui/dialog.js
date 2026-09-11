// Dialog box with portrait. Lines separated by "|" become pages.
import { view } from '../render/renderer.js';
import { panel, text, wrap, icon, UI } from './draw.js';
import { assets } from '../render/assets.js';

export class Dialog {
  constructor() { this.active = false; this.pages = []; this.page = 0; this.speaker = null; this.portrait = null; this.chars = 0; }

  open({ speaker = null, portrait = null, text: str, hearts = null }) {
    this.pages = str.split('|');
    this.hearts = hearts;   // {filled, max} atau null untuk yang bukan warga
    this.page = 0;
    this.speaker = speaker;
    this.portrait = portrait;
    this.chars = 0;
    this.active = true;
    this.onClose = null;
  }

  /** Advance: finish the typewriter first, then next page, then close. */
  advance() {
    if (this.chars < this.pages[this.page].length) { this.chars = 999; return; }
    if (this.page < this.pages.length - 1) { this.page++; this.chars = 0; return; }
    this.active = false;
    if (this.onClose) this.onClose();
  }

  update(dt) { if (this.active) this.chars += dt * 40; }

  draw(ctx) {
    if (!this.active) return;
    const VIEW_W = view.w, VIEW_H = view.h;
    const h = 150, x = 24, y = VIEW_H - h - 70, w = VIEW_W - 48;
    panel(ctx, x, y, w, h);
    let tx = x + 20;
    if (this.portrait) {
      const img = assets.images.get(this.portrait);
      panel(ctx, x + 14, y + 14, 112, 112);
      if (img) ctx.drawImage(img, x + 22, y + 22);
      tx = x + 140;
    }
    if (this.speaker) text(ctx, this.speaker, tx, y + 14, { font: UI.fontBig, color: '#8a2c1d' });
    if (this.hearts) {
      // Hati digambar di baris nama, rata kanan: ia keterangan tentang orangnya,
      // bukan bagian dari yang sedang ia katakan.
      const { filled, max } = this.hearts;
      const size = 14, gap = 2;
      let hx = x + w - 20 - max * (size + gap);
      for (let i = 0; i < max; i++) {
        ctx.globalAlpha = i < filled ? 1 : 0.22;
        icon(ctx, 'ui_heart', 0, hx, y + 14, size / 20);
        hx += size + gap;
      }
      ctx.globalAlpha = 1;
    }
    const shown = this.pages[this.page].slice(0, Math.floor(this.chars));
    const lines = wrap(ctx, shown, w - (tx - x) - 24, UI.fontBig);
    lines.forEach((l, i) => text(ctx, l, tx, y + 44 + i * 22, { font: UI.fontBig }));
    if (this.chars >= this.pages[this.page].length) {
      text(ctx, this.page < this.pages.length - 1 ? '▼' : '■', x + w - 28, y + h - 28, { font: UI.font });
    }
  }
}
