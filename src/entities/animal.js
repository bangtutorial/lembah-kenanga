// Farm animals. Sheets hold 8 left-facing frames; the right-facing side is
// mirrored at draw time.
//
// The frame ranges below are the whole reason these sheets were redrawn. The
// old four-frame sheets had one idle, two walk frames and one eating frame, and
// the walk cycle was written as [1, 2, 1, 3] — so frame 3, the eating pose, was
// played as part of walking. Every animal on the farm walked while chewing.
// With separate ranges that cannot happen again: eating frames are only ever
// reached from the eating state.
import { sprite } from '../render/assets.js';

const IDLE = [0, 1];          // berdiri, dengan satu ketukan napas/ekor
const WALK = [2, 3, 4, 5];    // satu siklus langkah penuh
const ACTION = [6, 7];        // makan, mematuk, atau duduk

const IDLE_FPS = 1.2;         // sangat pelan: ini gerakan diam, bukan animasi
const ACTION_FPS = 2.5;

export class Animal {
  constructor(kind, x, y, opts = {}) {
    this.kind = kind;              // sprite name: chicken | cow | dog
    this.x = x; this.y = y;
    this.homeX = x; this.homeY = y;
    this.dirX = -1;
    this.speed = opts.speed ?? 24;
    this.radius = opts.radius ?? 3 * 32;
    this.produce = opts.produce ?? null;   // {item, days}
    this.bounds = opts.bounds ?? null;     // tile rect the animal may not leave
    this.fed = false;
    this.hasProduce = false;
    this.friendship = 0;
    this.state = 'idle';
    this.t = Math.random() * 3;
    this.animT = Math.random();
    this.box = { w: 20, h: 8 };
  }

  update(map, dt, rng = Math.random) {
    this.t -= dt;
    this.animT += dt;
    if (this.t <= 0) {
      const r = rng();
      this.state = r < 0.45 ? 'idle' : r < 0.8 ? 'walk' : 'action';
      this.t = 1.5 + rng() * 3;
      if (this.state === 'walk') {
        const ang = rng() * Math.PI * 2;
        this.tx = this.homeX + Math.cos(ang) * this.radius;
        this.ty = this.homeY + Math.sin(ang) * this.radius;
        if (this.bounds) {   // never wander out of the pen
          const b = this.bounds;
          this.tx = Math.max((b.c0 + 0.5) * 32, Math.min((b.c1 + 0.5) * 32, this.tx));
          this.ty = Math.max((b.r0 + 1) * 32, Math.min((b.r1 + 1) * 32, this.ty));
        }
      }
    }
    if (this.state !== 'walk') return;
    const dx = this.tx - this.x, dy = this.ty - this.y;
    const d = Math.hypot(dx, dy);
    if (d < 4) { this.state = 'idle'; return; }
    this.dirX = dx < 0 ? -1 : 1;
    const nx = this.x + (dx / d) * this.speed * dt;
    const ny = this.y + (dy / d) * this.speed * dt;
    if (!map.collides(nx - this.box.w / 2, this.y - this.box.h, this.box.w, this.box.h)) this.x = nx;
    if (!map.collides(this.x - this.box.w / 2, ny - this.box.h, this.box.w, this.box.h)) this.y = ny;
  }

  frame() {
    // Kecepatan langkah diambil dari manifest tiap hewan: sapi yang berjalan
    // pelan tidak boleh mengayun kakinya secepat ayam.
    const fps = sprite(this.kind).def?.fps ?? 6;
    if (this.state === 'action') return ACTION[Math.floor(this.animT * ACTION_FPS) % ACTION.length];
    if (this.state === 'walk') return WALK[Math.floor(this.animT * fps) % WALK.length];
    return IDLE[Math.floor(this.animT * IDLE_FPS) % IDLE.length];
  }

  /** Called on a new day: fed animals make produce and gain friendship. */
  newDay() {
    if (this.produce && this.fed) { this.hasProduce = true; this.friendship = Math.min(10, this.friendship + 1); }
    this.fed = false;
  }

  collect() {
    if (!this.hasProduce) return null;
    this.hasProduce = false;
    return this.produce.item;
  }

  draw(ctx, camX, camY) {
    const { def, img } = sprite(this.kind);
    const [fw, fh] = def.frame;
    const sx = this.frame() * fw;
    const dx = Math.round(this.x - camX), dy = Math.round(this.y - camY);
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath();
    ctx.ellipse(dx, dy - 1, fw * 0.28, fw * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
    if (this.dirX > 0) {
      ctx.save();
      ctx.translate(dx, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(img, sx, 0, fw, fh, -Math.round(fw / 2), dy - fh, fw, fh);
      ctx.restore();
    } else {
      ctx.drawImage(img, sx, 0, fw, fh, dx - Math.round(fw / 2), dy - fh, fw, fh);
    }
    if (this.hasProduce) {
      ctx.fillStyle = '#e8b83a';
      ctx.fillRect(dx - 2, dy - fh - 8, 4, 4);
    }
  }
}
