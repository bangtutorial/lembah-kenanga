// UI primitives drawn from the generated sprite atlas (9-slice wood panel,
// buttons, slots, HUD bits). Text stays code-rendered.
import { assets } from '../render/assets.js';

export const UI = {
  outline: '#3a2a2a',
  cream: '#f5e6c8',
  creamDark: '#d9c39a',
  wood: '#8b5a2b',
  red: '#8a2c1d',
  font: '16px "VT323", monospace',
  fontBig: '20px "VT323", monospace',
  fontTitle: '10px "Press Start 2P", monospace',
};

const CORNER = 12; // border thickness of assets/sprites/ui/panel.png (96x96)

/** 9-slice the wood panel to any size >= 2*CORNER. */
export function panel(ctx, x, y, w, h) {
  const img = assets.images.get('ui_panel');
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  if (!img) { ctx.fillStyle = UI.cream; ctx.fillRect(x, y, w, h); return; }
  const c = CORNER, S = img.width, m = S - c * 2; // middle strip size in the source
  const iw = Math.max(1, w - c * 2), ih = Math.max(1, h - c * 2);
  // corners
  ctx.drawImage(img, 0, 0, c, c, x, y, c, c);
  ctx.drawImage(img, S - c, 0, c, c, x + w - c, y, c, c);
  ctx.drawImage(img, 0, S - c, c, c, x, y + h - c, c, c);
  ctx.drawImage(img, S - c, S - c, c, c, x + w - c, y + h - c, c, c);
  // edges (tiled so the wood grain keeps its pixel size)
  for (let i = 0; i < iw; i += m) {
    const seg = Math.min(m, iw - i);
    ctx.drawImage(img, c, 0, seg, c, x + c + i, y, seg, c);
    ctx.drawImage(img, c, S - c, seg, c, x + c + i, y + h - c, seg, c);
  }
  for (let j = 0; j < ih; j += m) {
    const seg = Math.min(m, ih - j);
    ctx.drawImage(img, 0, c, c, seg, x, y + c + j, c, seg);
    ctx.drawImage(img, S - c, c, c, seg, x + w - c, y + c + j, c, seg);
  }
  // interior: flat fill matches the panel's parchment colour
  ctx.fillStyle = UI.cream;
  ctx.fillRect(x + c, y + c, iw, ih);
}

/** Draw sheet frame `i` of a manifest sprite at (x, y), optionally scaled. */
export function icon(ctx, name, i, x, y, scale = 1) {
  const def = assets.manifest.sprites[name];
  const img = assets.images.get(name);
  if (!def || !img) return;
  const [fw, fh] = def.frame;
  const cols = def.cols ?? 1;
  const sx = (i % cols) * fw, sy = Math.floor(i / cols) * fh;
  ctx.drawImage(img, sx, sy, fw, fh, Math.round(x), Math.round(y), fw * scale, fh * scale);
}

export function slot(ctx, x, y, state = 0) { icon(ctx, 'ui_slots', state, x, y); }
export function button(ctx, x, y, w, state = 0) {
  const img = assets.images.get('ui_buttons');
  if (!img) return;
  const fw = 96, fh = 32, e = 12;
  const sx = state * fw;
  ctx.drawImage(img, sx, 0, e, fh, x, y, e, fh);
  ctx.drawImage(img, sx + e, 0, fw - e * 2, fh, x + e, y, w - e * 2, fh);
  ctx.drawImage(img, sx + fw - e, 0, e, fh, x + w - e, y, e, fh);
}

export function text(ctx, str, x, y, { font = UI.font, color = UI.outline, align = 'left', shadow = false } = {}) {
  ctx.font = font;
  ctx.textAlign = align;
  ctx.textBaseline = 'top';
  if (shadow) { ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillText(str, Math.round(x) + 1, Math.round(y) + 1); }
  ctx.fillStyle = color;
  ctx.fillText(str, Math.round(x), Math.round(y));
}

export function wrap(ctx, str, maxW, font = UI.font) {
  ctx.font = font;
  const lines = [];
  let cur = '';

  // Satu kata yang sendirian sudah lebih lebar dari ruangnya tidak bisa
  // dipindah ke baris berikutnya — ia harus dipotong per huruf. Tanpa ini,
  // pesan obrolan seperti "aaaaaa..." tanpa spasi keluar dari panel dan
  // sisanya tidak pernah terbaca.
  const chop = (word) => {
    const out = [];
    let part = '';
    for (const ch of word) {
      if (ctx.measureText(part + ch).width > maxW && part) { out.push(part); part = ch; }
      else part += ch;
    }
    if (part) out.push(part);
    return out;
  };

  for (const w of str.split(' ')) {
    const test = cur ? cur + ' ' + w : w;
    if (ctx.measureText(test).width <= maxW) { cur = test; continue; }
    if (cur) { lines.push(cur); cur = ''; }
    if (ctx.measureText(w).width <= maxW) { cur = w; continue; }
    const parts = chop(w);
    lines.push(...parts.slice(0, -1));
    cur = parts[parts.length - 1] ?? '';
  }
  if (cur) lines.push(cur);
  return lines;
}
