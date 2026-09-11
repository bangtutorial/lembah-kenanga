// Feedback layer: screen shake, hit-stop, particles, floating text and the
// tool-swing arc. Everything here is transient decoration — it never touches
// the simulation, so removing this file would leave the game playable.
//
// Design notes follow gamedev-web/game-feel: stack 2-3 cheap channels per
// event, exaggerate briefly, and scale intensity to how important the event is.
import { assets } from '../render/assets.js';

const TIERS = {
  small: { trauma: 0.12, stop: 0 },
  medium: { trauma: 0.25, stop: 0.03 },
  large: { trauma: 0.45, stop: 0.06 },
};

export class Juice {
  constructor() {
    this.trauma = 0;
    this.stop = 0;           // seconds of hit-stop remaining
    this.particles = [];
    this.texts = [];
    this.swing = null;       // {t, dur, dir, itemId}
    this._t = 0;
  }

  /** One call per gameplay event. */
  hit(tier = 'small') {
    const t = TIERS[tier] ?? TIERS.small;
    this.trauma = Math.min(1, this.trauma + t.trauma);
    this.stop = Math.max(this.stop, t.stop);
  }

  /** Tool arc drawn in front of the player for a fifth of a second. */
  startSwing(itemId, dir) { this.swing = { t: 0, dur: 0.22, dir, itemId }; }

  /**
   * Burst of particles at a world position.
   * `frames` indexes the `particles` sheet; `tile` instead cuts 4x4 chips out of
   * a terrain texture, which is how dust and stone chips are made without
   * inventing new art.
   */
  burst(x, y, { count = 6, frames = null, tile = null, spread = 40, up = 70, life = 0.5, gravity = 260 } = {}) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() * 2 - 1) * spread,
        vy: -up * (0.5 + Math.random() * 0.8),
        life, maxLife: life,
        gravity,
        frame: frames ? frames[(Math.random() * frames.length) | 0] : null,
        tile,
        chip: tile ? [(Math.random() * 28) | 0, (Math.random() * 28) | 0] : null,
      });
    }
  }

  /** Rising label, e.g. "+4 Kayu". */
  text(x, y, str, color = '#f5e6c8') {
    this.texts.push({ x, y, str, color, life: 1.1, maxLife: 1.1 });
  }

  update(dt) {
    this._t += dt;
    this.trauma = Math.max(0, this.trauma - 1.6 * dt);
    if (this.stop > 0) this.stop = Math.max(0, this.stop - dt);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) { this.particles.splice(i, 1); continue; }
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i];
      t.life -= dt;
      if (t.life <= 0) this.texts.splice(i, 1);
      else t.y -= 22 * dt;
    }
    if (this.swing) {
      this.swing.t += dt;
      if (this.swing.t >= this.swing.dur) this.swing = null;
    }
  }

  /** Camera offset in pixels; quadratic so light taps barely move the view. */
  get shake() {
    if (this.trauma <= 0) return { x: 0, y: 0 };
    const s = this.trauma * this.trauma;
    return {
      x: Math.round(7 * s * Math.sin(this._t * 47)),
      y: Math.round(5 * s * Math.sin(this._t * 61)),
    };
  }

  drawParticles(ctx, camX, camY) {
    const sheet = assets.images.get('particles');
    for (const p of this.particles) {
      const a = Math.max(0, Math.min(1, p.life / p.maxLife));
      ctx.globalAlpha = a;
      const dx = Math.round(p.x - camX), dy = Math.round(p.y - camY);
      if (p.tile) {
        const img = assets.images.get(p.tile);
        if (img) ctx.drawImage(img, p.chip[0], p.chip[1], 4, 4, dx, dy, 4, 4);
      } else if (sheet && p.frame !== null) {
        ctx.drawImage(sheet, p.frame * 16, 0, 16, 16, dx - 8, dy - 8, 16, 16);
      }
    }
    ctx.globalAlpha = 1;
  }

  drawTexts(ctx, camX, camY, font) {
    ctx.font = font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    for (const t of this.texts) {
      const a = Math.max(0, Math.min(1, t.life / t.maxLife));
      const x = Math.round(t.x - camX), y = Math.round(t.y - camY);
      ctx.globalAlpha = a;
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillText(t.str, x + 1, y + 1);
      ctx.fillStyle = t.color;
      ctx.fillText(t.str, x, y);
    }
    ctx.globalAlpha = 1;
    ctx.textBaseline = 'top';
  }

  /** The held tool sweeping through an arc in front of the player. */
  drawSwing(ctx, player, camX, camY, itemDef) {
    if (!this.swing) return;
    const d = itemDef(this.swing.itemId);
    if (!d) return;
    const img = assets.images.get(d.sheet);
    const def = assets.manifest.sprites[d.sheet];
    if (!img || !def) return;
    const [fw, fh] = def.frame;
    const cols = def.cols ?? 1;
    const sx = (d.i % cols) * fw, sy = Math.floor(d.i / cols) * fh;

    const k = this.swing.t / this.swing.dur;             // 0..1
    const ease = 1 - (1 - k) * (1 - k);                  // ease-out
    const angle = (-0.9 + ease * 1.8);                   // sweep ~100 degrees
    const dir = this.swing.dir;
    const off = { down: [0, 16], up: [0, -14], left: [-16, 2], right: [16, 2] }[dir] ?? [0, 12];
    const px = Math.round(player.x - camX) + off[0];
    const py = Math.round(player.y - camY) - 22 + off[1];

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(dir === 'left' ? -angle : angle);
    ctx.globalAlpha = 0.95;
    ctx.drawImage(img, sx, sy, fw, fh, -fw / 2, -fh / 2, fw, fh);
    ctx.restore();
    ctx.globalAlpha = 1;
  }
}
