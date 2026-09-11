// Shop screen: a list of goods with icon, name and price. Two modes —
// "buy/sell" for the general store, "upgrade" for the smithy.
import { view } from '../render/renderer.js';
import { panel, text, icon, slot, UI } from './draw.js';
import { itemDef } from '../systems/inventory.js';

const ROW_H = 44;
const ROWS_VISIBLE = 7;

export class ShopUI {
  constructor(inv, player, audio = null) {
    this.inv = inv;
    this.player = player;
    this.audio = audio;
    this.open = false;
    this.shop = null;     // shop definition from data/shops.json
    this.id = null;
    this.tab = 'buy';     // buy | sell | upgrade
    this.cursor = 0;
    this.scroll = 0;
    this.message = '';
  }

  openShop(id, shop, season) {
    this.id = id;
    this.shop = shop;
    this.season = season;
    this.tab = shop.upgrades ? 'upgrade' : 'buy';
    this.cursor = 0;
    this.scroll = 0;
    this.message = '';
    this.open = true;
  }

  close() { this.open = false; this.shop = null; }

  /** Rows for the current tab: {id, label, price, sub, ok, action}. */
  rows() {
    if (!this.shop) return [];
    if (this.tab === 'upgrade') {
      return this.shop.upgrades.map((u) => {
        const tools = this.inv.slots
          .map((s, i) => ({ s, i }))
          .filter(({ s }) => s && itemDef(s.id)?.tool);
        return { upgrade: u, tools, label: `Tingkatkan alat → ${u.name}`, price: u.price, sub: u.effect };
      });
    }
    if (this.tab === 'buy') {
      return (this.shop.stock ?? [])
        .filter((e) => !e.seasons || e.seasons.includes(this.season))
        .map((e) => {
          const d = itemDef(e.id);
          return { id: e.id, label: d?.name ?? e.id, price: d?.buy ?? 0, sub: d?.sell ? `jual G${d.sell}` : '' };
        });
    }
    // sell: whatever the player is carrying that has a price
    return this.inv.slots
      .map((s, i) => ({ s, i }))
      .filter(({ s }) => s && itemDef(s.id)?.sell)
      .map(({ s, i }) => {
        const d = itemDef(s.id);
        return { id: s.id, slot: i, label: `${d.name} ×${s.count}`, price: d.sell, sub: `total G${d.sell * s.count}` };
      });
  }

  key(action) {
    const rows = this.rows();
    if (action === 'up') this.cursor = Math.max(0, this.cursor - 1);
    if (action === 'down') this.cursor = Math.min(rows.length - 1, this.cursor + 1);
    if (action === 'left' || action === 'right') this.switchTab();
    if (action === 'interact') this.confirm();
    this.scroll = Math.max(0, Math.min(this.cursor - ROWS_VISIBLE + 1, Math.max(0, rows.length - ROWS_VISIBLE)));
    if (this.cursor < this.scroll) this.scroll = this.cursor;
  }

  switchTab() {
    // `canSell` false berarti tempat ini hanya menjual, tidak membeli — warung
    // tidak menampung hasil panen; itu urusan Bu Sari dan kotak jual.
    if (this.shop?.upgrades || this.shop?.canSell === false) return;
    this.tab = this.tab === 'buy' ? 'sell' : 'buy';
    this.cursor = 0;
    this.scroll = 0;
    this.message = '';
  }

  confirm() {
    const row = this.rows()[this.cursor];
    if (!row) return;
    if (this.tab === 'buy') return this.buy(row);
    if (this.tab === 'sell') return this.sell(row);
    return this.upgrade(row);
  }

  buy(row) {
    const def = itemDef(row.id);
    // Tools stack to one, so a second copy is dead weight in a slot the player
    // needs. Refuse it rather than take their money for it.
    if (def?.tool && this.inv.count(row.id) > 0) { this.message = `Kamu sudah punya ${def.name}.`; this.audio?.denied(); return; }
    if (this.player.money < row.price) { this.message = 'Uang tidak cukup.'; this.audio?.denied(); return; }
    const extra = itemDef(row.id)?.capacity ? { water: 0 } : null;
    if (this.inv.add(row.id, 1, extra) > 0) { this.message = 'Tas penuh.'; this.audio?.denied(); return; }
    this.player.money -= row.price;
    this.audio?.coin();
    // Makanan menyebut tombolnya sekali di sini: barang yang baru dibeli belum
    // tentu masuk ke slot yang sedang dipilih, jadi petunjuk di hotbar saja
    // belum tentu terbaca tepat setelah membeli.
    this.message = `Beli ${def.name} — G${row.price}`
      + (def.eat ? '  ·  pilih di hotbar, tekan E untuk makan' : '');
  }

  sell(row) {
    const s = this.inv.slots[row.slot];
    if (!s) return;
    const total = itemDef(s.id).sell * s.count;
    this.player.money += total;
    this.audio?.coin();
    this.inv.removeAt(row.slot, s.count);
    this.message = `Jual ${itemDef(s.id).name} — G${total}`;
    this.cursor = Math.max(0, this.cursor - 1);
  }

  upgrade(row) {
    const u = row.upgrade;
    const target = row.tools[this.toolIndex ?? 0];
    if (!target) { this.message = 'Tidak ada alat di tas.'; return; }
    const cur = target.s.level ?? 0;
    if (cur >= u.level) { this.message = `${itemDef(target.s.id).name} sudah level ${cur}.`; return; }
    if (cur !== u.level - 1) { this.message = `Tingkatkan ke level ${cur + 1} dulu.`; return; }
    if (this.player.money < u.price) { this.message = 'Uang tidak cukup.'; return; }
    for (const m of u.materials) {
      if (this.inv.count(m.id) < m.count) {
        this.message = `Butuh ${m.count}× ${itemDef(m.id)?.name ?? m.id}.`;
        return;
      }
    }
    for (const m of u.materials) {
      let left = m.count;
      while (left > 0) {
        const i = this.inv.slots.findIndex((s) => s?.id === m.id);
        const take = Math.min(left, this.inv.slots[i].count);
        this.inv.removeAt(i, take);
        left -= take;
      }
    }
    this.player.money -= u.price;
    this.audio?.coin();
    target.s.level = u.level;
    this.message = `${itemDef(target.s.id).name} kini level ${u.name}.`;
  }

  /** Cycle which tool the upgrade applies to. */
  cycleTool() {
    const rows = this.rows();
    const tools = rows[0]?.tools ?? [];
    if (!tools.length) return;
    this.toolIndex = ((this.toolIndex ?? 0) + 1) % tools.length;
    this.message = `Alat dipilih: ${itemDef(tools[this.toolIndex].s.id).name}`;
  }

  draw(ctx) {
    if (!this.open || !this.shop) return;
    const W = Math.min(560, view.w - 60);
    const H = ROWS_VISIBLE * ROW_H + 150;
    const x = Math.round((view.w - W) / 2), y = Math.round((view.h - H) / 2);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, view.w, view.h);
    panel(ctx, x, y, W, H);

    text(ctx, this.shop.name.toUpperCase(), x + W / 2, y + 18, { font: UI.fontTitle, align: 'center', color: UI.red });
    icon(ctx, 'ui_coin', 0, x + W - 108, y + 40);
    text(ctx, this.player.money.toLocaleString('id-ID'), x + W - 24, y + 42, { font: UI.fontBig, align: 'right' });

    // Tiga bentuk meja, tiga baris atas yang berbeda: pandai besi memilih alat,
    // toko punya tab beli/jual, dan tempat yang hanya menjual tidak butuh
    // keduanya — jam bukanya yang lebih berguna di situ.
    if (this.shop.upgrades) {
      const tools = this.rows()[0]?.tools ?? [];
      const cur = tools[this.toolIndex ?? 0];
      text(ctx, cur ? `Alat: ${itemDef(cur.s.id).name} (lv ${cur.s.level ?? 0})` : 'Tidak ada alat',
        x + 24, y + 44, { font: UI.fontBig });
    } else if (this.shop.canSell === false) {
      const [o, c] = this.shop.open;
      text(ctx, `Buka ${String(o).padStart(2, '0')}:00–${String(c).padStart(2, '0')}:00`,
        x + 24, y + 44, { font: UI.fontBig, color: '#7a6647' });
    } else {
      for (const [i, t] of ['buy', 'sell'].entries()) {
        const tx = x + 24 + i * 96;
        const on = this.tab === t;
        ctx.fillStyle = on ? '#e0a040' : UI.creamDark;
        ctx.fillRect(tx, y + 38, 88, 26);
        ctx.fillStyle = UI.outline;
        ctx.strokeRect(tx + 0.5, y + 38.5, 87, 25);
        text(ctx, t === 'buy' ? 'BELI' : 'JUAL', tx + 44, y + 43, { font: UI.font, align: 'center' });
      }
    }

    const rows = this.rows();
    const listY = y + 76;
    if (!rows.length) {
      text(ctx, this.tab === 'sell' ? 'Tidak ada yang bisa dijual.' : 'Belum ada barang musim ini.',
        x + W / 2, listY + 20, { font: UI.fontBig, align: 'center', color: '#7a6647' });
    }
    for (let i = 0; i < Math.min(ROWS_VISIBLE, rows.length); i++) {
      const r = rows[this.scroll + i];
      if (!r) break;
      const ry = listY + i * ROW_H;
      const selected = this.scroll + i === this.cursor;
      if (selected) {
        ctx.fillStyle = '#fff3d6';
        ctx.fillRect(x + 16, ry - 2, W - 32, ROW_H - 4);
      }
      if (r.id) slot(ctx, x + 22, ry, selected ? 1 : 0);
      const d = r.id && itemDef(r.id);
      if (d) icon(ctx, d.sheet, d.i, x + 26, ry + 4);
      text(ctx, r.label, x + 74, ry + 4, { font: UI.fontBig });
      if (r.sub) text(ctx, r.sub, x + 74, ry + 24, { font: UI.font, color: '#7a6647' });
      const affordable = this.tab === 'sell' || this.player.money >= r.price;
      text(ctx, `G ${r.price.toLocaleString('id-ID')}`, x + W - 26, ry + 12,
        { font: UI.fontBig, align: 'right', color: affordable ? UI.outline : '#b8432e' });
    }

    if (this.message) text(ctx, this.message, x + W / 2, y + H - 52, { font: UI.fontBig, align: 'center', color: '#8a2c1d' });
    const hint = this.shop.upgrades
      ? 'Panah pilih  ·  Tab ganti alat  ·  E konfirmasi  ·  Esc tutup'
      : this.shop.canSell === false
        ? 'Panah pilih  ·  E konfirmasi  ·  Esc tutup'
        : 'Panah pilih  ·  ←/→ beli/jual  ·  E konfirmasi  ·  Esc tutup';
    text(ctx, hint, x + W / 2, y + H - 28, { font: UI.font, align: 'center', color: '#5a4a30' });
  }
}
