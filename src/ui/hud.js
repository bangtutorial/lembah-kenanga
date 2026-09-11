// HUD: clock panel, money, energy bar, hotbar with item icons.
import { view } from '../render/renderer.js';
import { assets } from '../render/assets.js';
import { panel, text, icon, slot, UI } from './draw.js';
import { itemDef } from '../systems/inventory.js';

const SEASON_ICON = { spring: 4, summer: 5, autumn: 6, winter: 7 };

export function drawHud(ctx, { time, player, inv, weather }) {
  const W = view.w, H = view.h;

  // --- clock / date / weather / energy, all in one panel
  panel(ctx, 8, 8, 226, 90);
  icon(ctx, 'ui_icons_ws', SEASON_ICON[time.season], 20, 16);
  text(ctx, time.dateText, 48, 16, { font: UI.fontBig });
  icon(ctx, 'ui_icons_ws', weather.iconIndex, 20, 40);
  text(ctx, time.clockText, 48, 40, { font: UI.fontBig });
  text(ctx, weather.name, 222, 42, { font: UI.fontBig, align: 'right' });

  // energy as a slim inline bar — a floating gauge on the right edge read as a
  // stray black box, so it lives with the rest of the status readout now
  const ratio = Math.max(0, Math.min(1, player.energy / player.maxEnergy));
  const bx = 22, by = 70, bw = 196, bh = 12;
  ctx.fillStyle = UI.outline;
  ctx.fillRect(bx - 2, by - 2, bw + 4, bh + 4);
  ctx.fillStyle = '#6b5a3a';
  ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = ratio > 0.3 ? '#6abe30' : '#b8432e';
  ctx.fillRect(bx, by, Math.round(bw * ratio), bh);
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.fillRect(bx, by, Math.round(bw * ratio), 3);
  text(ctx, `${Math.ceil(player.energy)}`, bx + bw - 4, by - 3, { font: UI.font, align: 'right', color: '#fff', shadow: true });

  // --- money
  panel(ctx, W - 8 - 150, 8, 150, 40);
  icon(ctx, 'ui_coin', 0, W - 146, 16);
  text(ctx, player.money.toLocaleString('id-ID'), W - 22, 16, { font: UI.fontBig, align: 'right' });

  // --- hotbar
  const S = 40, gap = 2, n = 9;
  const totalW = n * (S + gap) - gap;
  const x0 = Math.round((W - totalW) / 2), y0 = H - S - 12;
  panel(ctx, x0 - 10, y0 - 8, totalW + 20, S + 16);
  for (let i = 0; i < n; i++) {
    const x = x0 + i * (S + gap);
    slot(ctx, x, y0, i === inv.index ? 1 : 0);
    const s = inv.slots[i];
    if (s) {
      const d = itemDef(s.id);
      if (d) icon(ctx, d.sheet, d.i, x + 4, y0 + 4);
      if (s.count > 1) text(ctx, String(s.count), x + S - 4, y0 + S - 18, { font: UI.font, align: 'right', color: '#fff', shadow: true });
      if (s.water !== undefined) {
        const r = s.water / (d.capacity ?? 40);
        ctx.fillStyle = '#2b6cb0';
        ctx.fillRect(x + 4, y0 + S - 7, Math.round((S - 8) * r), 3);
      }
    }
    text(ctx, String(i + 1), x + 4, y0 + 2, { font: '12px "VT323", monospace', color: '#6b5a3a' });
  }
  const held = inv.held;
  if (held) {
    const d = itemDef(held.id);
    const label = d?.name ?? held.id;
    // Barang yang bisa dimakan menyebut tombolnya di sini. Daftar tombol di
    // menu Esc tidak menolong orang yang baru saja membeli makanan dan sedang
    // menatap hotbar: pertanyaannya muncul di sini, jadi jawabannya di sini.
    const hint = d?.eat ? '  E makan' : '';
    ctx.font = UI.fontBig;
    const wName = ctx.measureText(label).width;
    ctx.font = UI.font;
    const wHint = hint ? ctx.measureText(hint).width : 0;
    const tx = Math.round(W / 2 - (wName + wHint) / 2);
    text(ctx, label, tx, y0 - 26, { font: UI.fontBig, color: UI.cream, shadow: true });
    if (hint) text(ctx, hint, tx + wName, y0 - 22, { font: UI.font, color: '#e0a040', shadow: true });
  }
}

export function drawPrompt(ctx, str) {
  const W = view.w, H = view.h;
  ctx.font = UI.font;
  const w = ctx.measureText(str).width + 40;
  panel(ctx, (W - w) / 2, H - 104, w, 34);
  text(ctx, str, W / 2, H - 94, { align: 'center' });
}

export function drawToast(ctx, msg) {
  const W = view.w;
  ctx.font = UI.fontBig;
  const w = ctx.measureText(msg).width + 44;
  panel(ctx, (W - w) / 2, 80, w, 42);
  text(ctx, msg, W / 2, 90, { font: UI.fontBig, align: 'center' });
}
