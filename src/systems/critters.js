// Ambient wildlife: butterflies, birds, fireflies, dragonflies, crabs.
//
// Nothing here is interactive and nothing here is saved. Its whole job is to
// stop the valley looking like a diorama between the moments the player is
// doing something. Each kind belongs to a zone and a time of day, so the beach
// gets crabs and the forest gets fireflies rather than the same confetti
// everywhere.
//
// Two motion styles cover all five:
//   - `air`   free-floating, drawn above everything, drifts on a sine wobble
//   - `ground` hops between tiles and is y-sorted with the player
import { TILE } from '../world/map.js';

/**
 * kinds: sprite name, where it lives, when it is out, and how it moves.
 * `night` counts from 18:00 to 06:00; `off` keeps a kind out of the world
 * without deleting it, for the ones we have art for but do not want on screen.
 */
export const KINDS = {
  // Kept to the forest and kept thin: spread across the open grass as well,
  // butterflies read as confetti drifting over everything the player is trying
  // to look at rather than as something living in the woods.
  butterfly: { sprite: 'butterfly', zones: ['forest'], night: false, style: 'air', per100: 1.5, speed: 26, fps: 9, wobble: 7 },
  // Art is finished and registered; hidden for now.
  bird: { sprite: 'bird', zones: ['woods', 'forest', 'verge'], night: false, style: 'ground', per100: 0.9, speed: 34, fps: 6, off: true },
  // per100 is high because the zone is tiny: only the rim of the forest pond,
  // sixteen tiles in all. Three dragonflies over it, not one lonely wanderer.
  dragonfly: { sprite: 'dragonfly', zones: ['water_edge'], night: false, style: 'air', per100: 20, speed: 44, fps: 12, wobble: 4 },
  crab: { sprite: 'crab', zones: ['sand'], night: false, style: 'ground', per100: 2.4, speed: 20, fps: 5 },
  firefly: { sprite: 'firefly', zones: ['forest', 'woods'], night: true, style: 'air', per100: 1.4, speed: 14, fps: 3, wobble: 10 },
};

const FADE = 1.5;   // seconds to appear or disappear when their shift changes

export class Critters {
  constructor(map, rng = Math.random) {
    this.map = map;
    this.rng = rng;
    this.list = [];
    this.t = 0;

    const spots = this.collectSpots();
    for (const [kind, rule] of Object.entries(KINDS)) {
      if (rule.off) continue;
      const tiles = rule.zones.flatMap((z) => spots[z] ?? []);
      if (!tiles.length) continue;
      const n = Math.max(1, Math.round(tiles.length * rule.per100 / 100));
      for (let i = 0; i < n; i++) this.list.push(this.spawn(kind, rule, tiles));
    }
  }

  /** Walkable tiles grouped by zone, plus the shoreline dragonflies want. */
  collectSpots() {
    const map = this.map;
    const out = { water_edge: [] };
    const zoneAt = map.zoneAt ?? (() => null);
    for (let r = 1; r < map.rows - 1; r++) {
      for (let c = 1; c < map.cols - 1; c++) {
        // Dragonflies hover over the water itself, so they are collected from
        // the wet side of the shore rather than from a walkable zone — and only
        // fresh water. Sand on the far bank means this is the sea, and a
        // dragonfly over salt water is a small lie the eye does notice.
        if (map.terrainAt(c, r) === 'water') {
          let fresh = false;
          for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const t = map.terrainAt(c + dc, r + dr);
            if (t === 'water' || t == null) continue;
            if (t === 'sand') { fresh = false; break; }
            fresh = true;
          }
          if (fresh) out.water_edge.push([c, r]);
          continue;
        }
        if (map.isSolid(c, r)) continue;
        const z = zoneAt(c, r);
        if (!z) continue;
        (out[z] ??= []).push([c, r]);
      }
    }
    return out;
  }

  spawn(kind, rule, tiles) {
    const [c, r] = tiles[Math.floor(this.rng() * tiles.length)];
    const x = c * TILE + TILE / 2, y = r * TILE + TILE / 2;
    return {
      kind, rule, tiles,
      x, y, tx: x, ty: y,
      dirX: this.rng() < 0.5 ? -1 : 1,
      phase: this.rng() * 10,
      wait: this.rng() * 3,
      alpha: 0,
      // Fliers ride a little above their tile; the offset never changes, so
      // they read as "in the air" instead of jittering up and down.
      lift: rule.style === 'air' ? 6 + this.rng() * 10 : 0,
    };
  }

  /** `hour` is 0..23; each kind fades in and out as its shift starts and ends. */
  update(dt, hour) {
    this.t += dt;
    const night = hour >= 18 || hour < 6;
    for (const s of this.list) {
      const wanted = s.rule.night === night ? 1 : 0;
      s.alpha += (wanted - s.alpha) * Math.min(1, dt / FADE);
      if (s.alpha < 0.02) continue;

      if ((s.wait -= dt) > 0) continue;
      const dx = s.tx - s.x, dy = s.ty - s.y;
      const d = Math.hypot(dx, dy);
      if (d < 3) {
        const [c, r] = s.tiles[Math.floor(this.rng() * s.tiles.length)];
        // Only hop somewhere nearby: a butterfly that teleports across the
        // valley reads as a glitch, not as a butterfly.
        const nx = c * TILE + TILE / 2, ny = r * TILE + TILE / 2;
        if (Math.abs(nx - s.x) < 190 && Math.abs(ny - s.y) < 190) { s.tx = nx; s.ty = ny; }
        s.wait = s.rule.style === 'ground' ? 0.6 + this.rng() * 2.4 : 0.2 + this.rng() * 1.2;
        continue;
      }
      const v = s.rule.speed * dt;
      if (Math.abs(dx) > 1) s.dirX = dx < 0 ? -1 : 1;
      s.x += (dx / d) * v;
      s.y += (dy / d) * v;
    }
  }

  /**
   * Ground-dwellers join the y-sorted pass; fliers are drawn over everything.
   *
   * The night shift is separated out because the dusk overlay is a `multiply`
   * pass: a firefly drawn before it gets multiplied down to nothing, which is
   * the one time of day it is supposed to be the brightest thing on screen.
   */
  split() {
    const ground = [], airDay = [], airNight = [];
    for (const s of this.list) {
      if (s.alpha < 0.02) continue;
      if (s.rule.style !== 'air') ground.push(s);
      else (s.rule.night ? airNight : airDay).push(s);
    }
    return { ground, airDay, airNight };
  }

  /** Screen position, including the flier's bob. */
  place(s) {
    const bob = s.rule.style === 'air' ? Math.sin(this.t * 3 + s.phase) * (s.rule.wobble ?? 0) : 0;
    return { x: s.x, y: s.y - s.lift + bob };
  }
}
