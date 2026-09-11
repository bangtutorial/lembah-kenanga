// Area registry + persistent per-area state.
//
// Maps are rebuilt deterministically from their seed, so the save only needs to
// record what CHANGED: which objects were removed (chopped trees, broken rocks,
// cleared weeds) and, for the farm, the soil.
import { buildValley } from './valley.js';

// Everything happens on one map. Interiors are switched off for now: shops are
// served at their doorstep and sleeping happens at the front door, so there is
// no loading fade anywhere in the game. `world/house.js` is kept for when the
// house interior comes back.
const BUILDERS = { valley: buildValley };
export const AREA_NAMES = { valley: 'Lembah Kenanga' };

const cache = new Map();
/** Removed object ids per area: { farm: Set<number>, ... } */
const removed = new Map();

export function getArea(id) {
  if (!cache.has(id)) {
    const build = BUILDERS[id];
    if (!build) throw new Error(`area tidak dikenal: ${id}`);
    const map = build();
    map.objects.forEach((o, i) => { o.id = i; });
    cache.set(id, map);
    applyRemovals(id);
  }
  return cache.get(id);
}

function applyRemovals(id) {
  const gone = removed.get(id);
  if (!gone?.size) return;
  const map = cache.get(id);
  map.objects = map.objects.filter((o) => {
    if (!gone.has(o.id)) return true;
    const c = Math.floor(o.x / 32), r = Math.floor((o.y - 1) / 32);
    map.setSolid(c, r, 0);
    return false;
  });
}

export function markRemoved(areaId, obj) {
  if (!removed.has(areaId)) removed.set(areaId, new Set());
  removed.get(areaId).add(obj.id);
}

export function removalsToJSON() {
  return Object.fromEntries([...removed].map(([k, v]) => [k, [...v]]));
}

export function removalsFromJSON(data) {
  removed.clear();
  cache.clear();
  for (const [k, v] of Object.entries(data ?? {})) removed.set(k, new Set(v));
}

export function resetAreas() { cache.clear(); removed.clear(); }
