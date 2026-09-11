// Layout rules shared by every area, and the audit that enforces them.
// The prose version with rationale lives in DESIGN.md §3.2.

export const TILE_PX = 32;
export const WALK_TILES_PER_SEC = 3;      // player speed 96 px/s

/** Hard budgets. Numbers come from travel time, not taste. */
export const LAYOUT = {
  maxSpan: 48,             // tiles per side; the whole valley is one map
  maxWalkBetweenHubs: 34,  // tiles: ~11 s from the farmhouse to the plaza
  maxPortalToLandmark: 12,
  maxLandmarkGap: 14,      // no two neighbouring landmarks further apart
  maxEmptyRun: 8,          // longest side of a completely empty square block
  minDensity: { valley: 0.22, house: 0.20 },
  maxDensity: 0.55,        // above this the map is a thicket, not a place to walk
};

/**
 * Where scattered nature may appear, and how thickly.
 *
 * Without this, decoration lands wherever the RNG points and the map reads as
 * noise: trees in the middle of a lawn, three rocks in a row, a stump against a
 * shop door. Each entry names the zones it belongs to, how much of that zone it
 * may cover, and how far apart two of the same kind must stand.
 */
export const SCATTER = {
  // Order matters: the scarcest, fussiest kinds claim their spots first,
  // otherwise a cheap common kind (trees) fills the zone and starves the rest.
  pine:     { zones: ['woods', 'forest'],          per100: 3, spacing: 4, clearOfBuildings: 3 },
  log:      { zones: ['woods', 'forest'],          per100: 1, spacing: 7, clearOfBuildings: 3 },
  stump:    { zones: ['woods', 'forest', 'rough'], per100: 1, spacing: 6, clearOfBuildings: 3 },
  coconut:  { zones: ['sand'],                     per100: 5, spacing: 4, clearOfBuildings: 3 },
  mushroom: { zones: ['forest'],                   per100: 3, spacing: 3, clearOfBuildings: 2 },
  rock:     { zones: ['rough', 'woods', 'sand'],   per100: 2, spacing: 4, clearOfBuildings: 2 },
  flower:   { zones: ['forest', 'verge'],          per100: 3, spacing: 3, clearOfBuildings: 2 },
  shell:    { zones: ['sand'],                     per100: 6, spacing: 2, clearOfBuildings: 1 },
  bush:     { zones: ['verge', 'woods', 'forest', 'rough'], per100: 3, spacing: 3, clearOfBuildings: 2 },
  tree:     { zones: ['woods', 'forest', 'verge'], per100: 7, spacing: 3, clearOfBuildings: 3 },
  // 'plot' sengaja tidak ada di sini. Rumput liar yang tumbuh di petak kebun
  // memaksa pemain membersihkannya lebih dulu sebelum bisa mencangkul, dan itu
  // pekerjaan yang tidak menghasilkan apa-apa di satu-satunya petak yang memang
  // disediakan untuk bertani.
  weed:     { zones: ['verge', 'rough'],           per100: 5, spacing: 2, clearOfBuildings: 1 },
};

/** Nominal object sizes in tiles (w x h of the drawn sprite, not the footprint). */
export const NOMINAL = {
  house: [5, 5], coop: [4, 4], barn: [6, 5], town_hall: [7, 6],
  store: [6, 5], warung: [5, 4], blacksmith: [5, 5],
  clinic: [6, 5], hut_rani: [4, 4], hut_wulan: [4, 4], houses_villager: [4, 4],
  fountain: [4, 2], notice_board: [2, 2], street_lamp: [1, 2.5],
  well: [2, 2], shipping_bin: [2, 2], dock: [3, 5], boat: [3, 2],
  tree: [2.5, 3], pine: [2.5, 3.5], coconut: [2.5, 4],
  bush: [1.25, 1.25], rocks: [2, 1.5], weeds: [1, 1],
  flowers: [1, 1], mushrooms: [1, 1], lilypads: [1, 1], beach_items: [1, 1],
};

/** Orientation contract for direction-aware tile sets. */
export const FACING = {
  // Every building sprite faces SOUTH: its door is on the bottom edge, so the
  // road it serves must run along the row directly below its footprint.
  buildingFaces: 'south',
  // Fence columns in assets/sprites/nature/fence/fence_sheet.png
  fence: { h: 0, v: 1, post: 2, cornerTL: 3, cornerTR: 4, cornerBL: 5, cornerBR: 6, gate: 7 },
};

const key = (c, r) => `${c},${r}`;

/**
 * Place decoration according to SCATTER. `zoneAt(c, r)` returns a zone name or
 * null; `canPlace(c, r, pad)` rejects roads, solids and reserved rectangles.
 * Returns the number of objects placed per kind.
 */
export function scatter(map, { rng, zoneAt, canPlace, doorTiles = [], make }) {
  const placedAt = new Map();   // kind -> [[c, r], ...]
  const counts = {};
  const zoneArea = {};
  for (let r = 0; r < map.rows; r++) {
    for (let c = 0; c < map.cols; c++) {
      const z = zoneAt(c, r);
      if (z) zoneArea[z] = (zoneArea[z] ?? 0) + 1;
    }
  }

  for (const [kind, rule] of Object.entries(SCATTER)) {
    const budget = rule.zones.reduce((n, z) => n + (zoneArea[z] ?? 0), 0) * rule.per100 / 100;
    const want = Math.round(budget);
    const mine = [];
    placedAt.set(kind, mine);
    let guard = 0;
    while (mine.length < want && guard++ < want * 200) {
      const c = 1 + Math.floor(rng() * (map.cols - 2));
      const r = 2 + Math.floor(rng() * (map.rows - 3));
      const z = zoneAt(c, r);
      if (!z || !rule.zones.includes(z)) continue;
      if (!canPlace(c, r, kind === 'weed' ? 0 : 1)) continue;
      if (doorTiles.some(([dc, dr]) => Math.abs(dc - c) <= 1 && Math.abs(dr - r) <= rule.clearOfBuildings)) continue;
      if (mine.some(([mc, mr]) => Math.abs(mc - c) < rule.spacing && Math.abs(mr - r) < rule.spacing)) continue;
      make(kind, c, r);
      mine.push([c, r]);
    }
    counts[kind] = mine.length;
  }
  return counts;
}

/**
 * Check a built map against LAYOUT. Returns { ok, problems[], metrics }.
 * Called at the end of every area builder; problems are logged, never thrown,
 * so a work-in-progress map still runs.
 */
export function auditArea(map, { landmarks = [], portals = [] } = {}) {
  const problems = [];
  const metrics = {};

  // --- 1. span
  metrics.span = [map.cols, map.rows];
  if (map.cols > LAYOUT.maxSpan || map.rows > LAYOUT.maxSpan) {
    problems.push(`area ${map.cols}x${map.rows} melebihi batas ${LAYOUT.maxSpan} tile `
      + `(${(Math.max(map.cols, map.rows) / WALK_TILES_PER_SEC).toFixed(0)} detik untuk menyeberang)`);
  }

  // --- 2. nothing but the road stands on a road tile
  const onRoad = [];
  for (const o of map.objects) {
    const c = Math.floor(o.x / TILE_PX), r = Math.floor((o.y - 1) / TILE_PX);
    if (map.road.has(key(c, r)) && !['weed', 'gate', 'road'].includes(o.kind)) onRoad.push(`${o.kind}@${c},${r}`);
  }
  if (onRoad.length) problems.push(`objek berdiri di jalan: ${onRoad.slice(0, 6).join(' ')}`);

  // --- 3. every building door touches a road tile
  for (const l of landmarks) {
    if (!l.door) continue;
    const touches = [[0, 1], [0, 0], [1, 1], [-1, 1]].some(([dc, dr]) => map.road.has(key(l.door.c + dc, l.door.r + dr)));
    if (!touches) problems.push(`pintu ${l.name} di ${l.door.c},${l.door.r} tidak menyentuh jalan`);
  }

  // --- 4. landmarks are reachable without a long walk
  const pts = landmarks.filter((l) => l.door ?? l.at).map((l) => ({ name: l.name, ...(l.door ?? l.at) }));
  for (const p of portals) {
    const near = pts.reduce((m, q) => Math.min(m, Math.abs(q.c - p.c) + Math.abs(q.r - p.r)), Infinity);
    if (near > LAYOUT.maxPortalToLandmark) problems.push(`portal ${p.c},${p.r} berjarak ${near} tile dari landmark terdekat`);
  }
  for (const a of pts) {
    const near = pts.reduce((m, b) => (a === b ? m : Math.min(m, Math.abs(a.c - b.c) + Math.abs(a.r - b.r))), Infinity);
    if (near > LAYOUT.maxLandmarkGap) problems.push(`${a.name} terisolasi (${near} tile ke landmark terdekat)`);
  }

  // --- 4b. no hub may be marooned: each one needs a neighbouring hub within
  // a short walk. Checking every pair would fail the moment the map grows a
  // third district, so the rule is about the nearest neighbour, not the extremes.
  if (map.hubs?.length >= 2) {
    metrics.hubWalk = {};
    for (const a of map.hubs) {
      let best = Infinity, who = '';
      for (const b of map.hubs) {
        if (a === b) continue;
        const walk = Math.abs(a.c - b.c) + Math.abs(a.r - b.r);
        if (walk < best) { best = walk; who = b.name; }
      }
      metrics.hubWalk[a.name] = best;
      if (best > LAYOUT.maxWalkBetweenHubs) {
        problems.push(`${a.name} terpencil: ${best} tile ke ${who} (${(best / WALK_TILES_PER_SEC).toFixed(0)} detik), maks ${LAYOUT.maxWalkBetweenHubs}`);
      }
    }
  }

  // --- 5. density and dead space
  // Measured on what the player actually feels: tiles they cannot walk on
  // (buildings, fences, trees, rocks) plus the road network. A map that is
  // almost all open grass reads as empty; one that is almost all blocked reads
  // as a maze.
  let blocked = 0;
  const filled = new Set();
  for (let r = 0; r < map.rows; r++) {
    for (let c = 0; c < map.cols; c++) {
      if (map.solid[r * map.cols + c] || map.road.has(key(c, r))) { blocked++; filled.add(key(c, r)); }
    }
  }
  const total = map.cols * map.rows;
  metrics.density = +(blocked / total).toFixed(3);
  const floor = LAYOUT.minDensity[map.id] ?? 0.12;
  if (metrics.density < floor) {
    problems.push(`kepadatan ${(metrics.density * 100).toFixed(0)}% di bawah minimum ${(floor * 100).toFixed(0)}%`);
  }
  if (metrics.density > LAYOUT.maxDensity) {
    problems.push(`kepadatan ${(metrics.density * 100).toFixed(0)}% di atas maksimum ${(LAYOUT.maxDensity * 100).toFixed(0)}% — terlalu sesak`);
  }

  metrics.largestEmpty = largestEmptySquare(map, filled);
  if (metrics.largestEmpty > LAYOUT.maxEmptyRun) {
    problems.push(`ada ruang kosong ${metrics.largestEmpty}x${metrics.largestEmpty} tile (maks ${LAYOUT.maxEmptyRun})`);
  }

  if (problems.length) console.warn(`[layout:${map.id}]`, problems.join(' | '), metrics);
  return { ok: !problems.length, problems, metrics };
}

/** Side of the biggest square containing no object and no road (classic DP). */
function largestEmptySquare(map, occupied) {
  const row = new Int16Array(map.cols); // dp for the previous row
  let best = 0;
  for (let r = 0; r < map.rows; r++) {
    let diag = 0;   // dp[r-1][c-1]
    let left = 0;   // dp[r][c-1]
    for (let c = 0; c < map.cols; c++) {
      const up = row[c];
      const free = !occupied.has(key(c, r)) && !map.road.has(key(c, r));
      const cur = free ? Math.min(up, left, diag) + 1 : 0;
      diag = up;
      left = cur;
      row[c] = cur;
      if (cur > best) best = cur;
    }
  }
  return best;
}
