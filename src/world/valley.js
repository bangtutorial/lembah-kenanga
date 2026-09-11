// Lembah Kenanga — one single outdoor map holding the farm, the village, the
// forest and the shore, 48x48 tiles.
//
// Rationale: separate areas meant half-empty maps and a loading fade between
// them. One map keeps every landmark within a short walk and lets the woods
// between the districts do the work a portal used to do.
//
// The map reads north to south: farm and pasture up top, the village and its
// plaza on the east, the forest filling the south-west, and the shore along
// the bottom edge. One lane runs from the high street down to the jetty, so
// the player never has to guess which way the sea is.
//
// Build order and every constant here follow DESIGN.md §3.2-3.4.
import { GameMap, TILE } from './map.js';
import { makeRng } from '../core/rng.js';
import { auditArea, scatter, FACING } from './layout.js';

const T = (n) => n * TILE;
const F = FACING.fence;

export function buildValley() {
  const map = new GameMap({ id: 'valley', cols: 48, rows: 48 });
  const rng = makeRng(20260908);

  const obj = (sprite, c, r, extra = {}) => {
    const o = { sprite, x: T(c) + TILE / 2, y: T(r) + TILE, ...extra };
    map.objects.push(o);
    return o;
  };

  // ---- anchors -------------------------------------------------------------
  const house = { c: 10, r: 6, w: 5 };
  const doorC = house.c + 2;                          // 12 — the farm's spine
  const mainRow = 20;                                 // the valley's high street
  const garden = { c0: 2, r0: 10, c1: 8, r1: 16 };    // 7x7 planting plot
  const pen = { c0: 16, r0: 5, c1: 23, r1: 12 };      // 8x8 animal yard
  const gardenGateR = 13;
  const penGateC = 19;
  const plaza = { c0: 30, r0: 16, c1: 38, r1: 23 };   // 9x8 paved square
  const plazaCx = 34, plazaCy = 19;                   // symmetry axis of the plaza
  const woods = { c0: 24, c1: 28 };                   // belt separating farm and village

  // southern districts
  const forest = { c0: 1, c1: 27, r0: 22, r1: 35 };   // woodland below the farm
  const pond = { c0: 5, c1: 11, r0: 26, r1: 30 };     // still water inside it
  const beachRow = 36;                                // first row of sand
  const seaRow = 40;                                  // first row of open water
  // The lane to the shore is the same one that already drops past the smithy.
  // Two parallel lanes one tile apart read as a single road twice as wide as
  // every other road on the map.
  const spineC = plaza.c0 - 2;
  const forestLaneC = doorC;                          // the farm spine, continued south
  const clinicRow = 29, homeRow = 34;                 // door rows of the south district
  // The jetty stops four rows short of the bottom edge: the camera clamps to the
  // map, so without that open water the far end would sit behind the hotbar.
  const dock = { c: spineC, r0: beachRow + 3, r1: 43 };

  const landmarks = [];
  const doorTiles = [];
  // Where light comes from after dark. Radii are in pixels and deliberately
  // generous: a pool that stops at the doorstep reads as a bug, not as a lamp.
  const lights = [];
  const light = (c, r, radius, kind) => lights.push({
    x: T(c) + TILE / 2, y: T(r) + TILE / 2, r: radius, kind, phase: rng() * 10,
  });

  // ---- 1. roads ------------------------------------------------------------
  const road = new Set();
  const carve = (c, r) => { if (map.inBounds(c, r)) { road.add(`${c},${r}`); map.setTerrain(c, r, 'dirt'); } };
  const pave = (c, r) => { if (map.inBounds(c, r)) map.setTerrain(c, r, 'plaza'); };
  const onRoad = (c, r) => road.has(`${c},${r}`);

  for (let r = house.r + 2; r <= mainRow; r++) carve(doorC, r);          // door -> high street
  for (let c = doorC; c <= map.cols - 2; c++) carve(c, mainRow);         // high street, farm spine to the tree wall
  for (let c = garden.c1 + 2; c < doorC; c++) carve(c, gardenGateR);     // spur to the garden gate
  for (let r = pen.r1 + 2; r < mainRow; r++) carve(penGateC, r);         // spur from the pen gate

  // south: one lane per district, all hanging off the high street
  for (let r = mainRow; r <= dock.r0 - 1; r++) carve(spineC, r);         // high street -> jetty
  for (let r = mainRow; r <= 34; r++) carve(forestLaneC, r);             // farm -> forest
  for (let c = forestLaneC; c <= spineC; c++) carve(c, 34);              // forest -> shore lane
  for (let c = forestLaneC; c <= 17; c++) carve(c, 27);                  // spur to the flower cottage
  for (let c = spineC; c <= 36; c++) carve(c, clinicRow + 1);            // road under the clinic
  for (let c = spineC; c <= map.cols - 3; c++) carve(c, homeRow + 1);    // the villagers' street
  for (let c = spineC; c <= 36; c++) carve(c, beachRow + 2);             // spur to the fisher's hut

  // ---- 2. fenced areas -----------------------------------------------------
  /**
   * `gate` menandai satu tile sebagai jalan masuk. `gate.open` berarti tile itu
   * dibiarkan kosong — hanya celah di pagar, tanpa sprite gerbang.
   *
   * Itu bukan sekadar selera: sprite gerbangnya digambar mendatar, jadi ia hanya
   * cocok di sisi atas atau bawah cincin. Ditaruh di sisi kiri atau kanan yang
   * pagarnya tegak, ia terlihat seperti papan yang jatuh melintang.
   */
  const fenceRing = (area, gate) => {
    const c0 = area.c0 - 1, c1 = area.c1 + 1, r0 = area.r0 - 1, r1 = area.r1 + 1;
    const put = (c, r, col) => {
      if (onRoad(c, r)) return;
      const isGate = gate && gate.c === c && gate.r === r;
      if (isGate && gate.open) return;                 // celah terbuka, tanpa apa pun
      obj('fence', c, r, { kind: isGate ? 'gate' : 'fence', col: isGate ? F.gate : col });
      if (!isGate) map.setSolid(c, r);
    };
    for (let c = c0 + 1; c < c1; c++) { put(c, r0, F.h); put(c, r1, F.h); }
    for (let r = r0 + 1; r < r1; r++) { put(c0, r, F.v); put(c1, r, F.v); }
    put(c0, r0, F.cornerTL); put(c1, r0, F.cornerTR);
    put(c0, r1, F.cornerBL); put(c1, r1, F.cornerBR);
    return { c0, c1, r0, r1 };
  };

  // Kebun: jalan masuknya di sisi kanan, tempat pagarnya tegak, jadi dibiarkan
  // sebagai celah terbuka. Kandang: jalan masuknya di sisi bawah yang pagarnya
  // mendatar, jadi sprite gerbang memang pas di sana.
  const gardenFence = fenceRing(garden, { c: garden.c1 + 1, r: gardenGateR, open: true });
  const penFence = fenceRing(pen, { c: penGateC, r: pen.r1 + 1 });
  // Petak kebun diberi tanah sendiri, bukan rumput. Tanpa itu batas kebun cuma
  // ditandai pagar, dan begitu pemain berdiri di dalamnya tidak ada lagi
  // petunjuk di mana cangkul boleh dipakai. Warnanya sengaja lebih gelap dari
  // tanah jalan supaya keduanya tidak tertukar.
  for (let r = garden.r0; r <= garden.r1; r++) {
    for (let c = garden.c0; c <= garden.c1; c++) if (!onRoad(c, r)) map.setTerrain(c, r, 'garden_soil');
  }
  map.garden = garden;
  map.pen = pen;
  landmarks.push({ name: 'Jalan Masuk Kebun', at: { c: garden.c1 + 1, r: gardenGateR } });
  landmarks.push({ name: 'Gerbang Kandang', at: { c: penGateC, r: pen.r1 + 1 } });

  // ---- 3. plaza paving -----------------------------------------------------
  for (let r = plaza.r0; r <= plaza.r1; r++) {
    for (let c = plaza.c0; c <= plaza.c1; c++) (r === mainRow ? carve : pave)(c, r);
  }

  // ---- 4. buildings — every door has road on the tile below it -------------
  const building = (sprite, kind, name, c, r, wTiles, doorOffset) => {
    obj(sprite, c, r, { kind }).x = T(c) + (wTiles * TILE) / 2;
    map.block(c, r, wTiles, 2);
    const door = { c: c + doorOffset, r };
    // The glow sits on the wall itself, not on the road below it, so it looks
    // like it is coming out of the windows.
    light(door.c, door.r, 86, 'window');
    landmarks.push({ name, door });
    doorTiles.push([door.c, door.r]);
    return door;
  };

  // farm side
  obj('house_lv1', house.c, house.r, { kind: 'house' }).x = T(house.c) + 80;
  map.block(house.c, house.r, house.w, 2);
  map.door = { c: doorC, r: house.r + 1 };
  light(doorC, house.r, 96, 'window');
  map.spawn = { x: T(doorC) + TILE / 2, y: T(house.r + 3) };
  landmarks.push({ name: 'Rumah', door: map.door });
  doorTiles.push([map.door.c, map.door.r]);

  // Both barns sit clear of penGateC: the gate is on the pen's south fence, so
  // anything spanning that column walls the yard off completely. The barn is
  // six tiles wide in an eight-tile pen and cannot avoid the column, so it goes
  // along the north edge instead; the coop is narrow enough to tuck into the
  // south-east corner beside the gate.
  obj('barn', pen.c0 + 1, pen.r0 + 1, { kind: 'barn' }).x = T(pen.c0 + 1) + 96;
  map.block(pen.c0 + 1, pen.r0 + 1, 6, 2);
  landmarks.push({ name: 'Lumbung', at: { c: pen.c0 + 4, r: pen.r0 + 1 } });

  obj('coop', pen.c0 + 4, pen.r0 + 6, { kind: 'coop' }).x = T(pen.c0 + 4) + 64;
  map.block(pen.c0 + 4, pen.r0 + 6, 4, 2);
  landmarks.push({ name: 'Kandang Ayam', at: { c: pen.c0 + 6, r: pen.r0 + 6 } });

  obj('well', doorC + 2, house.r + 2, { kind: 'well' });
  map.block(doorC + 2, house.r + 2, 2, 1);
  map.well = { c: doorC + 2, r: house.r + 2 };
  landmarks.push({ name: 'Sumur', at: map.well });

  obj('shipping_bin', doorC + 2, house.r + 5, { kind: 'bin' });
  map.block(doorC + 2, house.r + 5, 2, 1);
  map.bin = { c: doorC + 2, r: house.r + 5 };
  landmarks.push({ name: 'Kotak Jual', at: map.bin });

  obj('props', house.c - 1, house.r + 2, { kind: 'decor', col: 0 });     // mailbox

  // village side
  map.townHallDoor = building('town_hall', 'town_hall', 'Balai Desa', plazaCx - 3, plaza.r0 - 3, 7, 3);
  for (let r = map.townHallDoor.r + 1; r < plaza.r0; r++) carve(plazaCx, r);

  map.storeDoor = building('store', 'store', 'Toko', plaza.c0 - 8, mainRow - 3, 6, 3);
  for (let r = map.storeDoor.r + 1; r <= mainRow; r++) carve(map.storeDoor.c, r);

  map.warungDoor = building('warung', 'warung', 'Warung', plaza.c1 + 3, mainRow - 3, 5, 2);
  for (let r = map.warungDoor.r + 1; r <= mainRow; r++) carve(map.warungDoor.c, r);

  // The smithy faces south like every other building, so it needs a road on the
  // row BELOW it. The lane running past it is the shore spine, already carved.
  map.smithDoor = building('blacksmith', 'blacksmith', 'Pandai Besi', plazaCx - 2, plaza.r1 + 3, 5, 2);
  for (let c = spineC; c <= plaza.c1; c++) carve(c, map.smithDoor.r + 1);

  // south district: the clinic, then a row of villagers' houses on one street
  map.clinicDoor = building('clinic', 'clinic', 'Klinik', spineC + 1, clinicRow, 6, 3);

  [spineC + 1, spineC + 7, spineC + 13].forEach((c, i) => {
    const o = obj('houses_villager', c, homeRow, { kind: 'home', col: i });
    o.x = T(c) + (4 * TILE) / 2;
    light(c + 2, homeRow, 86, 'window');
    map.block(c, homeRow, 4, 2);
    landmarks.push({ name: `Rumah Warga ${i + 1}`, at: { c: c + 2, r: homeRow } });
    doorTiles.push([c + 2, homeRow]);
  });

  // forest and shore
  map.raniDoor = building('hut_rani', 'hut', 'Pondok Rani', 14, 26, 4, 2);
  map.wulanDoor = building('hut_wulan', 'hut', 'Pondok Nenek Wulan', 33, beachRow + 1, 4, 2);

  // ---- 5. plaza furniture, symmetric about (plazaCx, plazaCy) -------------
  // one row below the plaza centre so the tall water jet clears the town hall door
  obj('fountain', plazaCx, plazaCy, { kind: 'fountain', animated: true });
  map.block(plazaCx - 2, plazaCy, 4, 2);
  landmarks.push({ name: 'Air Mancur', at: { c: plazaCx, r: plazaCy } });

  for (const dc of [-3, 3]) {
    for (const dr of [-3, 3]) {
      obj('street_lamp', plazaCx + dc, plazaCy + dr, { kind: 'street_lamp' });
      map.setSolid(plazaCx + dc, plazaCy + dr);
      // one tile up: the flame is at the top of the post, not at its foot
      light(plazaCx + dc, plazaCy + dr - 1, 120, 'lamp');
    }
  }
  // flanking greenery on the fountain's own row, clear of the high street
  for (const dc of [-4, 4]) {
    obj('bush', plazaCx + dc, plazaCy, { kind: 'bush', col: 0 });
    map.setSolid(plazaCx + dc, plazaCy);
  }

  obj('notice_board', plaza.c0 - 2, mainRow - 1, { kind: 'notice' });
  map.block(plaza.c0 - 2, mainRow - 1, 2, 1);
  landmarks.push({ name: 'Papan Pengumuman', at: { c: plaza.c0 - 2, r: mainRow - 1 } });
  doorTiles.push([plaza.c0 - 2, mainRow - 1]);

  // ---- 5b. forest pond ----------------------------------------------------
  // An oval, so the pond does not read as a rectangle of blue.
  const pondCx = (pond.c0 + pond.c1) / 2, pondCy = (pond.r0 + pond.r1) / 2;
  const pondRx = (pond.c1 - pond.c0) / 2 + 0.5, pondRy = (pond.r1 - pond.r0) / 2 + 0.5;
  const inPond = (c, r) => ((c - pondCx) / pondRx) ** 2 + ((r - pondCy) / pondRy) ** 2 <= 1;
  const water = [];
  const flood = (c, r) => {
    map.setTerrain(c, r, 'water');
    map.setSolid(c, r);
    water.push([c, r, 'water']);
  };
  for (let r = pond.r0; r <= pond.r1; r++) {
    for (let c = pond.c0; c <= pond.c1; c++) if (inPond(c, r) && !onRoad(c, r)) flood(c, r);
  }
  landmarks.push({ name: 'Kolam Hutan', at: { c: Math.round(pondCx), r: pond.r1 } });

  // lily pads float on the pond: decoration only, the water stays solid
  for (const [c, r, i] of [[pond.c0 + 1, pond.r0 + 2, 0], [pondCx - 1, pondCy, 1],
    [pond.c1 - 1, pond.r1 - 2, 2], [pondCx + 2, pond.r0 + 1, 0]]) {
    const tc = Math.round(c), tr = Math.round(r);
    if (map.terrainAt(tc, tr) === 'water') obj('lilypads', tc, tr, { kind: 'decor', col: i });
  }

  // ---- 5c. the shore ------------------------------------------------------
  for (let r = beachRow; r < map.rows; r++) {
    for (let c = 0; c < map.cols; c++) {
      if (onRoad(c, r)) continue;
      if (r >= seaRow) flood(c, r);
      else map.setTerrain(c, r, 'sand');
    }
  }
  // the lane meeting the sand turns to sand, so no dirt track runs into the sea
  for (let r = beachRow; r < seaRow; r++) map.setTerrain(spineC, r, 'sand');

  // The jetty is a floor, not an obstacle: it is drawn under the player as a
  // decal, and the water beneath it is walked on rather than blocked.
  map.decals = [{ sprite: 'dock', x: T(dock.c) + TILE / 2, y: T(dock.r1) + TILE }];
  for (let r = dock.r0; r <= dock.r1; r++) {
    for (let c = dock.c - 1; c <= dock.c + 1; c++) map.setSolid(c, r, 0);
  }
  landmarks.push({ name: 'Dermaga', at: { c: dock.c, r: dock.r0 } });
  map.animatedTiles = water.filter(([c, r]) => !(r >= dock.r0 && Math.abs(c - dock.c) <= 1));

  obj('boat', dock.c + 3, dock.r1 - 1, { kind: 'boat' });
  map.block(dock.c + 2, dock.r1 - 1, 3, 1);

  // signposts where the lanes fork, so the forest and the shore are findable
  for (const [c, r, name] of [[forestLaneC + 1, 22, 'Simpang Hutan'], [spineC - 1, 33, 'Simpang Pantai']]) {
    obj('props', c, r, { kind: 'decor', col: 1 });
    map.setSolid(c, r);
    landmarks.push({ name, at: { c, r } });
  }

  // ---- 6. zones drive every scattered object ------------------------------
  const inRect = (rect, c, r) => c >= rect.c0 && c <= rect.c1 && r >= rect.r0 && r <= rect.r1;
  const inPlaza = (c, r) => c >= plaza.c0 - 1 && c <= plaza.c1 + 1 && r >= plaza.r0 - 1 && r <= plaza.r1 + 1;

  /** Which zone a tile belongs to — null means "leave it alone". */
  const zoneAt = (c, r) => {
    if (c < 1 || r < 2 || c > map.cols - 2 || r > map.rows - 2) return null;
    if (inPlaza(c, r) || inRect(penFence, c, r)) return null;
    if (inRect(gardenFence, c, r)) return inRect(garden, c, r) ? 'plot' : null;
    if (r >= seaRow) return null;                                 // open water grows nothing
    if (r >= beachRow) return 'sand';
    if (map.terrainAt(c, r) === 'water') return null;             // the pond
    if (inRect(forest, c, r)) return 'forest';
    if (c >= woods.c0 && c <= woods.c1) return 'woods';           // belt between farm and village
    if (r <= 3) return 'woods';                                   // wooded rim
    if (c <= 1 || c >= map.cols - 2) return 'woods';
    if (r >= mainRow + 3) return 'rough';                         // scrubland south of the street
    return 'verge';                                               // ordinary grass
  };

  // Passable decoration (weeds, mushrooms, flowers, shells) leaves the tile
  // walkable, so isSolid alone would happily let a bush land on top of a
  // mushroom — and then E picks the berries and the mushroom is unreachable.
  // One object per tile, always.
  const taken = new Set();

  const canPlace = (c, r, pad) => {
    if (taken.has(`${c},${r}`)) return false;
    for (let y = r - pad; y <= r + pad; y++) {
      for (let x = c - pad; x <= c + pad; x++) {
        if (!map.inBounds(x, y) || map.isSolid(x, y) || onRoad(x, y)) return false;
      }
    }
    return true;
  };

  const make = (kind, c, r) => {
    taken.add(`${c},${r}`);
    switch (kind) {
      case 'tree': obj('oak', c, r, { kind: 'tree', seasonal: true, hp: 4, drop: 'wood' }); map.setSolid(c, r); break;
      case 'pine': obj('pine', c, r, { kind: 'tree', hp: 4, drop: 'wood' }); map.setSolid(c, r); break;
      case 'rock': obj('rocks', c, r, { kind: 'rock', col: Math.floor(rng() * 3), hp: 3, drop: 'stone' }); map.setSolid(c, r); break;
      case 'stump': obj('props', c, r, { kind: 'stump', col: 2, hp: 3, drop: 'wood' }); map.setSolid(c, r); break;
      case 'log': obj('props', c, r, { kind: 'log', col: 3, hp: 2, drop: 'wood' }); map.setSolid(c, r); break;
      case 'bush': obj('bush', c, r, { kind: 'bush', col: rng() < 0.35 ? 1 : 0, drop: 'berry' }); map.setSolid(c, r); break;
      case 'weed': obj('weeds', c, r, { kind: 'weed', col: Math.floor(rng() * 4), drop: 'fiber', passable: true }); break;
      case 'coconut': obj('coconut', c, r, { kind: 'tree', hp: 5, drop: 'wood' }); map.setSolid(c, r); break;
      case 'mushroom': obj('mushrooms', c, r, { kind: 'pick', col: Math.floor(rng() * 3), drop: 'mushroom', passable: true }); break;
      case 'flower': obj('flowers', c, r, { kind: 'pick', col: Math.floor(rng() * 4), drop: 'wildflower', passable: true }); break;
      case 'shell': {
        const col = Math.floor(rng() * 4);
        obj('beach_items', c, r, { kind: 'pick', col, drop: col === 3 ? 'seaweed' : 'seashell', passable: true });
        break;
      }
      default: break;
    }
  };

  const counts = scatter(map, { rng, zoneAt, canPlace, doorTiles, make });

  // A wall of trees encloses the valley on three sides; the fourth is the sea,
  // which already stops the player.
  for (let c = 0; c < map.cols; c++) if (canPlace(c, 0, 0)) make('tree', c, 0);
  for (let r = 1; r < beachRow; r++) {
    if (canPlace(0, r, 0)) make('tree', 0, r);
    if (canPlace(map.cols - 1, r, 0)) make('tree', map.cols - 1, r);
  }

  // ---- 7. rules ------------------------------------------------------------
  map.tillable = (c, r) => c >= garden.c0 && c <= garden.c1 && r >= garden.r0 && r <= garden.r1;
  map.road = road;
  // The same zoning that placed the trees also tells the ambient wildlife where
  // it belongs, so a butterfly never ends up over the sea.
  map.zoneAt = zoneAt;
  map.lights = lights;
  map.entries = { houseDoor: { c: doorC, r: house.r + 2, dir: 'down' } };
  map.npcSpots = {
    harun: { c: plazaCx, r: plaza.r0 + 1 },
    sari: { c: map.storeDoor.c + 2, r: map.storeDoor.r + 2 },
    jaka: { c: map.smithDoor.c + 2, r: map.smithDoor.r + 1 },   // dua tile dari pintunya, bukan satu
    dadang: { c: map.warungDoor.c - 2, r: map.warungDoor.r + 2 },
    ratna: { c: map.clinicDoor.c + 2, r: map.clinicDoor.r + 1 },
    rani: { c: map.raniDoor.c + 2, r: map.raniDoor.r + 1 },
    wulan: { c: map.wulanDoor.c - 2, r: map.wulanDoor.r + 1 },
    bayu: { c: dock.c, r: dock.r0 + 1 },        // on the jetty itself; the sea pens him in
  };
  // Tempat yang bisa disebut namanya oleh jadwal NPC di `npcs.json`. Menaruh
  // koordinat di berkas data akan membuat setiap penggeseran bangunan
  // memutuskan jadwal tanpa ada yang menyadarinya.
  map.places = {
    plaza: { c: plazaCx, r: plazaCy + 3 },
    balai: { c: map.townHallDoor.c + 2, r: map.townHallDoor.r + 2 },
    toko: { c: map.storeDoor.c + 2, r: map.storeDoor.r + 2 },
    warung: { c: map.warungDoor.c - 2, r: map.warungDoor.r + 2 },
    bengkel: { c: map.smithDoor.c + 2, r: map.smithDoor.r + 1 },
    klinik: { c: map.clinicDoor.c + 2, r: map.clinicDoor.r + 1 },
    papan: { c: plaza.c0 - 3, r: mainRow + 1 },
    kolam: { c: pond.c1 + 2, r: pond.r1 },
    hutan: { c: map.raniDoor.c + 2, r: map.raniDoor.r + 1 },
    pantai: { c: map.wulanDoor.c - 2, r: map.wulanDoor.r + 1 },
    dermaga: { c: dock.c, r: dock.r0 + 1 },
  };

  map.hubs = [
    { name: 'Rumah', c: map.door.c, r: map.door.r },
    { name: 'Plaza', c: plazaCx, r: plazaCy },
    { name: 'Hutan', c: map.raniDoor.c, r: map.raniDoor.r },
    { name: 'Pantai', c: dock.c, r: dock.r0 },
  ];
  map.scatterCounts = counts;

  // kept on the map so the result can be read back without scraping the console
  map.audit = auditArea(map, { landmarks, portals: [] });
  return map;
}
