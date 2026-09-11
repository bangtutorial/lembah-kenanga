// Public chat: a bubble button in the bottom-left corner that opens a panel.
//
// Typing goes through a real (invisible) DOM <input> parked over the canvas
// rather than a hand-rolled key handler. That is not laziness — it is the only
// way to get IME composition, clipboard paste, autocorrect and the mobile
// keyboard for free, and text entry is exactly the place where reimplementing
// the browser goes wrong. What the player sees is still drawn on the canvas, so
// the panel matches the rest of the game.
import { view } from '../render/renderer.js';
import { panel, text, icon, wrap, UI } from './draw.js';
import { assets } from '../render/assets.js';

const BTN = 44;          // bubble button, bottom-left
const PAD = 12;
const PANEL_W = 380;
const PANEL_H = 300;
const ROW_GAP = 6;
const AVATAR = 32;       // portraits are 96px, so this is an exact 1/3
const MAX_LEN = 160;

export class ChatUI {
  constructor(chat) {
    this.chat = chat;
    this.open = false;
    this.notice = '';
    this.noticeT = 0;
    this.scroll = 0;         // 0 = pinned to the newest line
    this.input = null;
  }

  /** The invisible field that actually receives keystrokes. */
  ensureInput() {
    if (this.input) return this.input;
    const el = document.createElement('input');
    el.type = 'text';
    el.maxLength = MAX_LEN;
    el.autocomplete = 'off';
    el.setAttribute('aria-label', 'Tulis pesan obrolan');
    // Off-screen but focusable: `display:none` and `visibility:hidden` cannot
    // hold focus, and a zero-size input breaks the mobile keyboard.
    el.style.cssText = 'position:fixed;left:-9999px;top:0;width:200px;opacity:0;';
    el.addEventListener('keydown', (e) => {
      // Stop here so the game's window-level handler never sees the keystroke;
      // otherwise typing "wasd" walks the farmer across the valley.
      e.stopPropagation();
      if (e.key === 'Enter') { e.preventDefault(); this.submit(); }
      if (e.key === 'Escape') { e.preventDefault(); this.close(); }
    });
    el.addEventListener('keyup', (e) => e.stopPropagation());
    document.body.appendChild(el);
    this.input = el;
    return el;
  }

  toggle() { (this.open ? this.close : this.openPanel).call(this); }

  openPanel() {
    this.open = true;
    this.scroll = 0;
    this.maxScroll = 0;
    this.chat.unread = 0;
    const el = this.ensureInput();
    el.value = '';
    setTimeout(() => el.focus(), 0);
  }

  close() {
    this.open = false;
    this.input?.blur();
  }

  async submit() {
    const el = this.ensureInput();
    const value = el.value.trim();
    if (!value) return;
    el.value = '';
    const err = await this.chat.send(value);
    if (err) this.say(err);
  }

  say(msg) { this.notice = msg; this.noticeT = 3; }

  update(dt) {
    if (this.noticeT > 0 && (this.noticeT -= dt) <= 0) this.notice = '';
    // Keep the caret alive even if something else stole focus (a click on the
    // canvas, say) while the panel is open.
    if (this.open && this.input && document.activeElement !== this.input) this.input.focus();
  }

  // -- hit testing ---------------------------------------------------------
  buttonRect() {
    return { x: PAD, y: view.h - BTN - PAD, w: BTN, h: BTN };
  }

  panelRect() {
    const h = Math.min(PANEL_H, view.h - BTN - PAD * 3);
    const w = Math.min(PANEL_W, view.w - PAD * 2);
    return { x: PAD, y: view.h - BTN - PAD * 2 - h, w, h };
  }

  /** Returns true when the click belonged to the chat. */
  click(mx, my) {
    const b = this.buttonRect();
    if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) { this.toggle(); return true; }
    if (!this.open) return false;
    const p = this.panelRect();
    const inside = mx >= p.x && mx <= p.x + p.w && my >= p.y && my <= p.y + p.h;
    if (inside) { this.input?.focus(); return true; }
    this.close();
    return true;
  }

  wheel(dir) {
    if (!this.open) return false;
    // Batas atasnya dihitung saat menggambar, ketika tinggi tiap pesan sudah
    // diketahui. Tanpa batas, roda mouse menggulung riwayat sampai jauh ke atas
    // dan menyisakan panel kosong tanpa petunjuk cara kembali.
    this.scroll = Math.max(0, Math.min(this.maxScroll ?? 0, this.scroll + dir * 2));
    return true;
  }

  // -- drawing -------------------------------------------------------------
  draw(ctx) {
    if (this.open) this.drawPanel(ctx);
    this.drawButton(ctx);
    if (this.notice) {
      const b = this.buttonRect();
      text(ctx, this.notice, b.x + b.w + 10, b.y + 14, { font: UI.fontBig, color: '#ffd0c0', shadow: true });
    }
  }

  drawButton(ctx) {
    // Just the bubble. The online count lives inside the panel, where there is
    // room to say what the number means.
    const b = this.buttonRect();
    const unread = this.chat.unread > 0 && !this.open;
    icon(ctx, 'ui_chat_icons', unread ? 1 : 0, b.x, b.y, BTN / 32);
    if (unread) {
      const n = Math.min(99, this.chat.unread);
      text(ctx, String(n), b.x + b.w - 10, b.y + 2, { font: UI.font, align: 'center', color: UI.cream, shadow: true });
    }
  }

  drawPanel(ctx) {
    const p = this.panelRect();
    panel(ctx, p.x, p.y, p.w, p.h);

    const headY = p.y + 12;
    text(ctx, 'OBROLAN DESA', p.x + 16, headY + 2, { font: UI.fontTitle, color: UI.red });
    if (this.chat.status === 'online') {
      icon(ctx, 'ui_chat_icons', 2, p.x + p.w - 16 - 20, headY - 2, 0.625);
      text(ctx, `${this.chat.online} online`, p.x + p.w - 16 - 26, headY + 2,
        { font: UI.fontBig, align: 'right', color: '#7a6647' });
    } else {
      text(ctx, this.chat.status === 'connecting' ? 'menyambung...' : 'terputus',
        p.x + p.w - 16, headY + 2, { font: UI.fontBig, align: 'right', color: '#7a6647' });
    }

    const listY = headY + 26;
    const inputH = 30, hintH = 18;
    const listH = p.h - (listY - p.y) - inputH - hintH - 20;

    ctx.save();
    ctx.beginPath();
    ctx.rect(p.x + 10, listY, p.w - 20, listH);
    ctx.clip();

    // Lay the messages out from the newest upward, so the freshest line always
    // sits against the input box no matter how long the backlog is.
    const rows = this.layout(ctx, p.w - 24 - AVATAR - 12);
    const total = rows.reduce((h, r) => h + r.h + ROW_GAP, 0);
    this.maxScroll = Math.max(0, Math.ceil((total - listH) / 20));
    if (this.scroll > this.maxScroll) this.scroll = this.maxScroll;
    let y = listY + listH + this.scroll * 20;
    for (let i = rows.length - 1; i >= 0; i--) {
      const r = rows[i];
      y -= r.h + ROW_GAP;
      if (y > listY + listH) continue;
      if (y + r.h < listY) break;
      this.drawRow(ctx, r, p.x + 12, p.x + p.w - 12, y);
    }
    ctx.restore();

    if (!rows.length) {
      const msg = this.chat.status === 'offline'
        ? 'Server obrolan belum jalan.'
        : 'Belum ada yang bicara. Sapa duluan!';
      text(ctx, msg, p.x + p.w / 2, listY + listH / 2 - 8, { font: UI.fontBig, align: 'center', color: '#9a8a72' });
    }

    // input line, with the hint on its own row underneath — sharing one row
    // with the typed text meant a long message ran straight through it
    const iy = p.y + p.h - inputH - hintH - 10;
    const iw = p.w - 24;
    const countW = 56;
    ctx.fillStyle = '#fff3d6';
    ctx.fillRect(p.x + 12, iy, iw, inputH);
    ctx.strokeStyle = UI.outline;
    ctx.strokeRect(p.x + 12.5, iy + 0.5, iw - 1, inputH - 1);

    const typed = this.input?.value ?? '';
    const caret = Math.floor(performance.now() / 500) % 2 ? '|' : '';
    const fieldW = iw - 16 - countW;
    ctx.save();
    ctx.beginPath();
    ctx.rect(p.x + 18, iy, fieldW, inputH);
    ctx.clip();
    ctx.font = UI.fontBig;
    // Scroll with the caret so the end of a long line stays visible, the way a
    // real text field does.
    const shown = typed + caret;
    const over = Math.max(0, ctx.measureText(shown).width - fieldW + 4);
    text(ctx, typed ? shown : 'Ketik pesan...', p.x + 20 - over, iy + 6,
      { font: UI.fontBig, color: typed ? UI.outline : '#a89878' });
    ctx.restore();
    text(ctx, `${typed.length}/${MAX_LEN}`, p.x + p.w - 20, iy + 9,
      { font: UI.font, align: 'right', color: typed.length >= MAX_LEN ? '#b8432e' : '#a89878' });

    text(ctx, 'Enter kirim  ·  Esc tutup  ·  roda gulir riwayat', p.x + p.w / 2, iy + inputH + 4,
      { font: UI.font, align: 'center', color: '#7a6647' });
  }

  /** Wrap every message once per draw; the list is short enough for that. */
  layout(ctx, textW) {
    const out = [];
    for (const m of this.chat.messages) {
      const lines = wrap(ctx, m.text, textW, UI.fontBig);
      // Own lines hang on the right, everyone else on the left. Two people can
      // share a display name, so this goes by the ids this tab actually posted
      // rather than by comparing names.
      out.push({ m, lines, own: m.own ?? this.chat.mine.has(m.id), h: Math.max(AVATAR, 18 + lines.length * 20) });
    }
    return out;
  }

  drawRow(ctx, r, left, right, y) {
    const name = `portrait_${r.m.avatar || 'player_m'}`;
    const img = assets.images.get(name) ?? assets.images.get('portrait_player_m');
    const ax = r.own ? right - AVATAR : left;
    if (img) ctx.drawImage(img, 0, 0, img.width, img.height, ax, y, AVATAR, AVATAR);
    const tx = r.own ? right - AVATAR - 10 : left + AVATAR + 10;
    const align = r.own ? 'right' : 'left';
    text(ctx, r.own ? 'Kamu' : r.m.name, tx, y, { font: UI.font, align, color: r.own ? '#3f6f2a' : UI.red });
    r.lines.forEach((l, i) => text(ctx, l, tx, y + 16 + i * 20, { font: UI.fontBig, align }));
  }
}
