// Shared walking-sprite logic for the player and NPCs.
import { sprite } from '../render/assets.js';
import { drawFrame } from '../render/renderer.js';

const DIR_ROW = { down: 0, left: 1, right: 2, up: 3 };
const WALK_SEQ = [1, 2, 3, 2];

export class Character {
  constructor(spriteName, x, y) {
    this.spriteName = spriteName;
    this.x = x;          // feet position, world px
    this.y = y;
    this.dir = 'down';
    this.moving = false;
    this.speed = 96;     // px/s = 3 tiles/s
    this.baseSpeed = 96; // what `speed` is compared against when animating
    this.animT = 0;
    this.box = { w: 18, h: 10 }; // feet collision box, centered on x, bottom at y
    this.onStep = null;         // fired once per stride, for the footstep sound
    this._stepDist = 0;
  }

  /** Move by a unit vector, resolving collisions per axis against the map. */
  move(map, ax, ay, dt) {
    this.moving = ax !== 0 || ay !== 0;
    if (!this.moving) { this.animT = 0; return; }
    if (Math.abs(ax) >= Math.abs(ay)) this.dir = ax > 0 ? 'right' : 'left';
    else this.dir = ay > 0 ? 'down' : 'up';

    const { w, h } = this.box;
    const tryX = this.x + ax * this.speed * dt;
    if (!map.collides(tryX - w / 2, this.y - h, w, h)) this.x = tryX;
    const tryY = this.y + ay * this.speed * dt;
    if (!map.collides(this.x - w / 2, tryY - h, w, h)) this.y = tryY;
    // Legs keep pace with the feet: a sprint has to look like a sprint, and an
    // NPC ambling at half speed should not shuffle at a walker's frame rate.
    this.animT += dt * (this.speed / this.baseSpeed);

    // one footstep every ~24 px walked, independent of frame rate
    this._stepDist += this.speed * dt;
    if (this._stepDist >= 24) { this._stepDist = 0; this.onStep?.(); }
  }

  frame() {
    if (!this.moving) return 0;
    return WALK_SEQ[Math.floor(this.animT * 8) % WALK_SEQ.length];
  }

  draw(ctx, camX, camY) {
    const { def, img } = sprite(this.spriteName);
    // baked contact shadow: characters have none in their sheets by design
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(Math.round(this.x - camX), Math.round(this.y - camY) - 1, 9, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    drawFrame(ctx, img, def.frame[0], def.frame[1], this.frame(), DIR_ROW[this.dir], this.x - camX, this.y - camY);
  }

  /** Tile the character is facing (for interaction). */
  facingTile(tile) {
    const c = Math.floor(this.x / tile), r = Math.floor((this.y - 1) / tile);
    const d = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] }[this.dir];
    return { c: c + d[0], r: r + d[1] };
  }
}
