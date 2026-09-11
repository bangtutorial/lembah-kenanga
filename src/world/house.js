// Interior of the player's house.
//
// Kept deliberately small (18x11 tiles): a starter room should feel snug, and
// an oversized floor with a handful of furniture reads as empty.
import { GameMap, TILE } from './map.js';

const T = (n) => n * TILE;
// furniture sheet order: bed table chair wardrobe tv rug lamp chest
const FURN = { bed: 0, table: 1, chair: 2, wardrobe: 3, tv: 4, rug: 5, lamp: 6, chest: 7 };

export function buildHouse() {
  const map = new GameMap({ id: 'house', cols: 18, rows: 11, base: 'wood_floor' });
  map.indoor = true;

  const obj = (sprite, c, r, extra = {}) => {
    const o = { sprite, x: T(c) + TILE / 2, y: T(r) + TILE, ...extra };
    map.objects.push(o);
    return o;
  };

  // back wall (the sprite is 32x64, so one object covers rows 0 and 1)
  for (let c = 0; c < map.cols; c++) {
    obj('wall', c, 1, { kind: 'wall' });
    map.setSolid(c, 0);
    map.setSolid(c, 1);
  }
  for (let r = 0; r < map.rows; r++) { map.setSolid(0, r); map.setSolid(map.cols - 1, r); }
  for (let c = 0; c < map.cols; c++) map.setSolid(c, map.rows - 1);

  // --- along the back wall: bed, chest, TV, wardrobe, lamp
  obj('furniture', 2, 4, { kind: 'bed', col: FURN.bed });
  map.block(2, 4, 2, 3);
  map.bed = { c: 2, r: 4 };

  obj('furniture', 5, 4, { kind: 'chest', col: FURN.chest });
  map.setSolid(5, 4);
  map.chest = { c: 5, r: 4 };

  obj('furniture', 9, 4, { kind: 'tv', col: FURN.tv });
  map.setSolid(9, 4);

  obj('furniture', 12, 4, { kind: 'decor', col: FURN.wardrobe });
  map.block(12, 4, 1, 2);

  obj('furniture', 15, 4, { kind: 'decor', col: FURN.lamp });
  map.setSolid(15, 4);

  // --- living area: a rug under a table flanked by two chairs
  obj('furniture', 8, 9, { kind: 'decor', col: FURN.rug });
  obj('furniture', 6, 8, { kind: 'decor', col: FURN.chair });
  map.setSolid(6, 8);
  obj('furniture', 8, 8, { kind: 'decor', col: FURN.table });
  map.setSolid(8, 8);
  obj('furniture', 10, 8, { kind: 'decor', col: FURN.chair });
  map.setSolid(10, 8);
  obj('furniture', 15, 8, { kind: 'decor', col: FURN.table });
  map.setSolid(15, 8);

  // --- door back out to the farm, bottom centre
  const doorC = 13, doorR = map.rows - 1;
  map.setSolid(doorC, doorR, 0);
  map.portals.push({ c0: doorC, r0: doorR, c1: doorC, r1: doorR, to: 'valley', entry: 'houseDoor' });
  map.entries = { fromFarm: { c: doorC, r: doorR - 1, dir: 'up' } };
  map.spawn = { x: T(doorC) + TILE / 2, y: T(doorR) };
  return map;
}
