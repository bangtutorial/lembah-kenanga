// Tilled soil + crop growth. Soil lives in a Map keyed "c,r" so only touched
// tiles cost memory, and it serializes straight into the save file.
import { emit } from '../core/events.js';

export class Farming {
  constructor(cropData) {
    this.crops = cropData;
    this.soil = new Map(); // "c,r" -> {watered, crop, day, stage, dead}
  }

  key(c, r) { return `${c},${r}`; }
  at(c, r) { return this.soil.get(this.key(c, r)) ?? null; }

  till(c, r) {
    if (this.at(c, r)) return false;
    this.soil.set(this.key(c, r), { watered: false, crop: null, day: 0, stage: 0, dead: false });
    return true;
  }

  water(c, r) {
    const s = this.at(c, r);
    if (!s || s.watered) return false;
    s.watered = true;
    return true;
  }

  waterAll() { for (const s of this.soil.values()) s.watered = true; }

  plant(c, r, cropId, season) {
    const s = this.at(c, r);
    const def = this.crops[cropId];
    if (!s || s.crop || !def) return null;
    if (!def.seasons.includes(season)) return 'season';
    s.crop = cropId; s.day = 0; s.stage = 0; s.dead = false;
    return true;
  }

  /** Total days from planting to the harvest stage. */
  growDays(cropId) { return this.crops[cropId].stageDays.reduce((a, b) => a + b, 0); }

  stageFor(cropId, day) {
    const d = this.crops[cropId].stageDays;
    let acc = 0, stage = 0;
    for (let i = 0; i < d.length; i++) { acc += d[i]; if (day >= acc) stage = i + 1; }
    return stage;
  }

  ripe(s) { return s.crop && !s.dead && s.stage >= 4; }

  harvest(c, r) {
    const s = this.at(c, r);
    if (!s || !this.ripe(s)) return null;
    const def = this.crops[s.crop];
    const item = def.yields;
    if (def.regrowDays) {
      s.day = this.growDays(s.crop) - def.regrowDays;
      s.stage = this.stageFor(s.crop, s.day);
    } else {
      s.crop = null; s.day = 0; s.stage = 0;
    }
    return item;
  }

  /** Clear an empty tilled tile back to plain ground (hoe on empty soil). */
  clear(c, r) {
    const s = this.at(c, r);
    if (!s || s.crop) return false;
    this.soil.delete(this.key(c, r));
    return true;
  }

  /** Called at the start of each new day. */
  newDay(season, rained) {
    let grew = 0;
    for (const [k, s] of this.soil) {
      if (rained) s.watered = true;
      if (s.crop) {
        const def = this.crops[s.crop];
        if (!def.seasons.includes(season)) { s.dead = true; s.crop = null; s.stage = 0; }
        else if (s.watered && !s.dead) {
          s.day += 1;
          const st = this.stageFor(s.crop, s.day);
          if (st !== s.stage) { s.stage = st; grew++; }
        }
      }
      s.watered = false;
      // untended bare soil slowly reverts
      if (!s.crop && !s.dead && Math.random() < 0.06) this.soil.delete(k);
    }
    emit('farm:newday', { grew });
  }

  toJSON() { return [...this.soil.entries()]; }
  load(arr) { if (arr) this.soil = new Map(arr); }
}
