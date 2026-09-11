// Fishing: cast, wait for a bite, then a reeling mini-game.
//
// The mini-game is the Stardew shape, because it is the one that works: a
// vertical track, a fish that drifts up and down it, and a bar the player keeps
// over the fish. Holding the button pushes the bar up, releasing lets it fall,
// and nothing else is involved — one key, no aiming, playable while tired.
//
// Everything below is expressed in a normalised 0..1 track, so the UI can be
// any height on screen without touching the numbers here.
import { emit } from '../core/events.js';

const WAIT = [1.2, 4.5];        // seconds before a bite, before bait
const BITE_WINDOW = 0.9;        // seconds to hook it once it bites
const ZONE_ACCEL = -2.6;        // track units per second squared, holding
const ZONE_GRAVITY = 1.9;       // ... and letting go
const ZONE_BOUNCE = 0.25;       // how much speed survives hitting an end
const GAIN = 0.5;               // progress per second while the fish is inside
const DRAIN = 0.32;             // ... and outside

/** Difficulty 1..5 -> how twitchy the fish is and how much bar you get. */
const zoneHeight = (d) => 0.34 - 0.04 * (d - 1);
const fishSpeed = (d) => 0.55 + 0.22 * (d - 1);

export class Fishing {
  constructor(species, rng = Math.random) {
    this.species = species;      // [{id, item, water, seasons, hours, difficulty, weight}]
    this.rng = rng;
    this.reset();
  }

  reset() {
    this.state = 'idle';         // idle | wait | bite | reel | done
    this.target = null;          // {c, r} water tile the float sits on
    this.fish = null;
    this.t = 0;
    this.progress = 0;
    this.zoneY = 0.5;
    this.zoneV = 0;
    this.fishY = 0.5;
    this.fishTo = 0.5;
    this.fishT = 0;
    this.result = null;          // {item, name} | 'lost' | 'missed'
  }

  get active() { return this.state !== 'idle'; }
  get zoneH() { return this.fish ? zoneHeight(this.fish.difficulty) : 0.34; }

  /**
   * Pick a catch for this spot. `water` is 'pond' or 'sea'; `lucky` is true
   * when the float landed next to a visible shadow, which is the only reason
   * to aim at all.
   */
  roll(water, season, hour, lucky) {
    const pool = this.species.filter((s) =>
      (s.water === water || s.water === 'any')
      && (!s.seasons || s.seasons.includes(season))
      && (!s.hours || (hour >= s.hours[0] && hour < s.hours[1])));
    if (!pool.length) return this.species.find((s) => s.id === 'junk_boot') ?? this.species[0];
    // A shadow tilts the draw toward the rarer end: rarity is the inverse of
    // weight, so squaring the odds of the scarce ones is enough.
    const weight = (s) => (lucky ? 100 / (s.weight || 1) : s.weight || 1);
    let total = 0;
    for (const s of pool) total += weight(s);
    let n = this.rng() * total;
    for (const s of pool) { n -= weight(s); if (n <= 0) return s; }
    return pool[pool.length - 1];
  }

  /** Throw the float at a water tile. */
  cast(target, { water, season, hour, lucky = false, bait = false }) {
    this.reset();
    this.state = 'wait';
    this.target = target;
    this.water = water;
    this.fish = this.roll(water, season, hour, lucky);
    const [lo, hi] = WAIT;
    const span = hi - lo;
    // Bait and a visible shadow each halve the wait, and they stack.
    const scale = (bait ? 0.5 : 1) * (lucky ? 0.5 : 1);
    this.t = (lo + this.rng() * span) * scale;
    emit('fish:cast', { target });
  }

  /** E during `bite` hooks the fish; during `reel` it is the hold key. */
  hook() {
    if (this.state !== 'bite') return false;
    this.state = 'reel';
    this.progress = 0.35;
    this.zoneY = 0.5 - this.zoneH / 2;
    this.zoneV = 0;
    this.fishY = 0.5;
    this.fishTo = 0.5;
    this.fishT = 0;
    emit('fish:hook', { fish: this.fish });
    return true;
  }

  cancel() {
    if (!this.active) return;
    this.reset();
    emit('fish:cancel', {});
  }

  update(dt, held) {
    if (this.state === 'wait') {
      if ((this.t -= dt) <= 0) { this.state = 'bite'; this.t = BITE_WINDOW; emit('fish:bite', { fish: this.fish }); }
      return;
    }
    if (this.state === 'bite') {
      // Miss the window and the fish is gone — that is the whole point of it.
      if ((this.t -= dt) <= 0) { this.state = 'done'; this.result = 'missed'; emit('fish:missed', {}); }
      return;
    }
    if (this.state !== 'reel') return;

    const h = this.zoneH;
    this.zoneV += (held ? ZONE_ACCEL : ZONE_GRAVITY) * dt;
    this.zoneY += this.zoneV * dt;
    if (this.zoneY < 0) { this.zoneY = 0; this.zoneV *= -ZONE_BOUNCE; }
    if (this.zoneY > 1 - h) { this.zoneY = 1 - h; this.zoneV *= -ZONE_BOUNCE; }

    // The fish picks a new spot on the track every so often and swims to it;
    // a smooth chase reads as a living thing, a teleport reads as a bug.
    if ((this.fishT -= dt) <= 0) {
      this.fishTo = this.rng();
      this.fishT = 0.35 + this.rng() * 0.9;
    }
    const step = fishSpeed(this.fish.difficulty) * dt;
    this.fishY += Math.max(-step, Math.min(step, this.fishTo - this.fishY));
    this.fishY = Math.max(0, Math.min(1, this.fishY));

    const inside = this.fishY >= this.zoneY && this.fishY <= this.zoneY + h;
    this.progress += (inside ? GAIN : -DRAIN) * dt;
    if (this.progress >= 1) { this.state = 'done'; this.result = { ...this.fish }; emit('fish:caught', { fish: this.fish }); }
    else if (this.progress <= 0) { this.state = 'done'; this.result = 'lost'; emit('fish:lost', {}); }
  }

  /** Take the finished result once; the caller decides what to do with it. */
  take() {
    if (this.state !== 'done') return null;
    const r = this.result;
    this.reset();
    return r;
  }
}

/**
 * Fish shadows drifting over open water. They are the only cue telling the
 * player where casting is worth it, so they wander slowly and stay well inside
 * the water rather than clipping the shore.
 */
export class Shadows {
  constructor(map, perTiles = 20, rng = Math.random) {
    this.map = map;
    this.rng = rng;
    this.list = [];
    const open = [];
    for (const [c, r] of map.animatedTiles) {
      // keep to tiles surrounded by water, so a shadow never straddles the sand
      let ok = true;
      for (let dr = -1; dr <= 1 && ok; dr++) {
        for (let dc = -1; dc <= 1 && ok; dc++) {
          if (map.terrainAt(c + dc, r + dr) !== 'water') ok = false;
        }
      }
      if (ok) open.push([c, r]);
    }
    this.open = open;

    // Stock each body of water separately. Spread over every open tile at once,
    // the sea's 258 tiles swallowed the whole quota and the forest pond — eleven
    // tiles — reliably got none, so the pond looked dead to fish.
    for (const body of this.bodies(open)) {
      const n = Math.max(2, Math.round(body.length / perTiles));
      for (let i = 0; i < n; i++) this.list.push(this.spawn(body));
    }
  }

  /** Split open tiles into connected bodies of water. */
  bodies(open) {
    const key = (c, r) => `${c},${r}`;
    const left = new Map(open.map(([c, r]) => [key(c, r), [c, r]]));
    const out = [];
    while (left.size) {
      const [k0, start] = left.entries().next().value;
      left.delete(k0);
      const group = [start], queue = [start];
      while (queue.length) {
        const [c, r] = queue.pop();
        for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const k = key(c + dc, r + dr);
          const t = left.get(k);
          if (!t) continue;
          left.delete(k);
          group.push(t);
          queue.push(t);
        }
      }
      out.push(group);
    }
    return out;
  }

  spawn(body = this.open) {
    const [c, r] = body[Math.floor(this.rng() * body.length)];
    return {
      x: c * 32 + 16, y: r * 32 + 16,
      tx: c * 32 + 16, ty: r * 32 + 16,
      dirX: 1, wait: this.rng() * 3, body,
      animT: this.rng() * 2,
      // A fixed offset per fish so they do not all flap in lockstep. It must be
      // fixed: deriving it from the live x made the tail flicker at the speed
      // the fish was swimming instead of a steady four frames a second.
      phase: this.rng() * 10,
    };
  }

  update(dt) {
    for (const s of this.list) {
      s.animT += dt;
      if ((s.wait -= dt) > 0) continue;
      const dx = s.tx - s.x, dy = s.ty - s.y;
      const d = Math.hypot(dx, dy);
      if (d < 3) {
        const [c, r] = s.body[Math.floor(this.rng() * s.body.length)];
        // only drift to somewhere nearby, so shadows do not shoot across the map
        if (Math.abs(c * 32 - s.x) < 240 && Math.abs(r * 32 - s.y) < 240) { s.tx = c * 32 + 16; s.ty = r * 32 + 16; }
        s.wait = 0.5 + this.rng() * 2.5;
        continue;
      }
      const v = 18 * dt;
      s.dirX = dx < 0 ? -1 : 1;
      s.x += (dx / d) * v;
      s.y += (dy / d) * v;
    }
  }

  /** The shadow nearest a tile, within `range` pixels. */
  near(c, r, range = 44) {
    const x = c * 32 + 16, y = r * 32 + 16;
    return this.list.find((s) => Math.hypot(s.x - x, s.y - y) <= range) ?? null;
  }
}
