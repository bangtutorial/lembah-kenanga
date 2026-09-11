// A map = terrain grid (prerendered per season) + solid grid + static objects.
import { assets } from '../render/assets.js';

export const TILE = 32;

export class GameMap {
  constructor({ id, cols, rows, base = 'grass_spring' }) {
    this.id = id;
    this.cols = cols;
    this.rows = rows;
    this.w = cols * TILE;
    this.h = rows * TILE;
    this.terrain = new Array(cols * rows).fill(base);
    this.solid = new Uint8Array(cols * rows);
    this.objects = [];
    this.spawn = { x: this.w / 2, y: this.h / 2 };
    this._canvas = null;
    this._canvasSeason = null;
    // Where the hoe works. Maps override this with their own plot bounds;
    // by default nothing on a map can be tilled.
    this.tillable = () => false;
    this.road = new Set();
    // Tiles whose terrain is animated. The prerendered canvas holds frame 0;
    // the renderer paints the live frame over these on top of it.
    this.animatedTiles = [];
    // Sprites that lie flat on the ground and are walked over (the jetty).
    // Drawn between the terrain and everything else, so they never y-sort in
    // front of the player standing on them.
    this.decals = [];
    this.portals = [];      // [{c0,r0,c1,r1,to,entry}]
    this.entries = {};      // { name: {c, r, dir} }
    this.indoor = false;
  }

  idx(c, r) { return r * this.cols + c; }
  inBounds(c, r) { return c >= 0 && r >= 0 && c < this.cols && r < this.rows; }
  isSolid(c, r) { return !this.inBounds(c, r) || this.solid[this.idx(c, r)] === 1; }
  setSolid(c, r, v = 1) { if (this.inBounds(c, r)) this.solid[this.idx(c, r)] = v; }
  terrainAt(c, r) { return this.inBounds(c, r) ? this.terrain[this.idx(c, r)] : null; }

  setTerrain(c, r, name) {
    if (!this.inBounds(c, r)) return;
    this.terrain[this.idx(c, r)] = name;
    this._canvas = null; // rebuild on next draw
  }

  /** Mark a w x h tile footprint solid, anchored at its bottom-left tile. */
  block(c, r, w, h) {
    for (let y = r - h + 1; y <= r; y++) for (let x = c; x < c + w; x++) this.setSolid(x, y);
  }

  /** Whether a world-px AABB overlaps any solid tile. */
  collides(x, y, w, h) {
    const c0 = Math.floor(x / TILE), c1 = Math.floor((x + w - 1) / TILE);
    const r0 = Math.floor(y / TILE), r1 = Math.floor((y + h - 1) / TILE);
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) if (this.isSolid(c, r)) return true;
    return false;
  }

  /** Portal the given tile belongs to, if any. */
  portalAt(c, r) {
    return this.portals.find((p) => c >= p.c0 && c <= p.c1 && r >= p.r0 && r <= p.r1) ?? null;
  }

  /** Seasonal variants fall back to the spring texture until they exist. */
  terrainFor(name, season) {
    if (name === 'grass_spring' && season !== 'spring') {
      const seasonal = `grass_${season}`;
      if (assets.images.has(seasonal)) return seasonal;
    }
    return name;
  }

  /** Prerender the whole terrain layer once per season. */
  terrainCanvas(season) {
    if (this._canvas && this._canvasSeason === season) return this._canvas;
    const cv = document.createElement('canvas');
    cv.width = this.w; cv.height = this.h;
    const ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const name = this.terrainFor(this.terrain[this.idx(c, r)], season);
        const img = assets.images.get(name);
        if (!img) continue;
        // An animated tile ships as a horizontal strip, so blitting the whole
        // image would spill its later frames over the neighbouring tiles.
        // Bake frame 0; the renderer animates it afterwards.
        const cols = assets.manifest?.sprites?.[name]?.cols ?? 1;
        if (cols > 1) ctx.drawImage(img, 0, 0, TILE, TILE, c * TILE, r * TILE, TILE, TILE);
        else ctx.drawImage(img, c * TILE, r * TILE);
      }
    }
    this._canvas = cv;
    this._canvasSeason = season;
    return cv;
  }
}
