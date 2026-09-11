// The reeling gauge: a track, the green bar the player steers, the hooked fish,
// and a progress column beside it.
//
// It sits against the right edge rather than the middle of the screen, so the
// player can still see the water and their own character while reeling.
import { view } from '../render/renderer.js';
import { text, UI } from './draw.js';
import { assets } from '../render/assets.js';
import { itemDef } from '../systems/inventory.js';

const MARGIN = 28;
const GAP = 10;

export class FishingUI {
  constructor(fishing) { this.fishing = fishing; }

  draw(ctx) {
    const f = this.fishing;
    if (f.state === 'wait') return;                 // the float says it all
    if (f.state === 'bite') return this.drawBite(ctx);
    if (f.state !== 'reel') return;

    const track = assets.images.get('ui_fishing_track');
    const zone = assets.images.get('ui_fishing_zone');
    const fill = assets.images.get('ui_fishing_fill');
    if (!track || !zone || !fill) return;

    // The gauge is drawn at an integer multiple so it stays crisp, and it grows
    // on a tall viewport: at 1x on a 900px-high window the track is a sliver the
    // player has to hunt for.
    const k = Math.max(1, Math.min(3, Math.floor(view.h / 380)));
    const tw = track.width * k, th = track.height * k;
    const fw = fill.width * k;
    const x = view.w - MARGIN - tw - GAP - fw;
    const y = Math.round((view.h - th) / 2);

    ctx.drawImage(track, 0, 0, track.width, track.height, x, y, tw, th);

    // Inside the frame, not on top of it: the wooden border is 4px thick.
    const pad = 4 * k;
    const innerY = y + pad, innerH = th - pad * 2;
    const innerX = x + pad, innerW = tw - pad * 2;

    const zh = Math.round(f.zoneH * innerH);
    const zy = Math.round(innerY + f.zoneY * innerH);
    ctx.drawImage(zone, 0, 0, zone.width, zone.height, innerX, zy, innerW, zh);

    // The hooked fish shows as its own item icon, so the player learns what
    // they are fighting before they land it.
    const d = itemDef(f.fish.item);
    const icon = d && assets.images.get(d.sheet);
    const fy = Math.round(innerY + f.fishY * innerH);
    if (icon) {
      const sp = assets.manifest.sprites[d.sheet];
      const cw = sp.frame[0], ch = sp.frame[1];
      const sx = (d.i % sp.cols) * cw, sy = Math.floor(d.i / sp.cols) * ch;
      const size = 24 * k;
      ctx.drawImage(icon, sx, sy, cw, ch, Math.round(innerX + innerW / 2 - size / 2), fy - size / 2, size, size);
    } else {
      ctx.fillStyle = '#2a3a6a';
      ctx.fillRect(innerX + 4, fy - 3 * k, innerW - 8, 6 * k);
    }

    // progress column
    const px = x + tw + GAP;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(px, y, fw, th);
    const ph = Math.round(f.progress * th);
    if (ph > 0) ctx.drawImage(fill, 0, 0, fill.width, fill.height, px, y + th - ph, fw, ph);
    ctx.strokeStyle = UI.outline;
    ctx.strokeRect(px + 0.5, y + 0.5, fw - 1, th - 1);

    text(ctx, 'Tahan E', x + tw / 2, y + th + 8, { font: UI.fontBig, align: 'center', color: UI.cream });
  }

  drawBite(ctx) {
    const f = this.fishing;
    // A shrinking bar under the prompt: the window is under a second, and a
    // number would be read too late to matter.
    const w = 120, h = 10;
    const x = Math.round((view.w - w) / 2), y = Math.round(view.h * 0.24);
    text(ctx, 'TEKAN E!', x + w / 2, y - 24, { font: UI.fontTitle, align: 'center', color: '#ffd84a' });
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#ffd84a';
    ctx.fillRect(x, y, Math.round(w * Math.max(0, f.t / 0.9)), h);
    ctx.strokeStyle = UI.outline;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  }
}
