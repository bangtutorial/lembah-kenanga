// Versioned JSON saves in localStorage. Keeps a .bak of the previous write so a
// bad write can be recovered. Migrations run in order v -> v+1.
export const SAVE_VERSION = 3;

/**
 * Karakter yang bisa dipilih pemain. Satu daftar dipakai homepage (kartu
 * pemilih dan daftar warga) dan game (sprite serta foto obrolan), supaya
 * menambah karakter berikutnya cukup menambah satu baris di sini.
 */
export const AVATARS = [
  { id: 'player_m', label: 'Arya' },
  { id: 'player_f', label: 'Laras' },
  { id: 'player_m2', label: 'Damar' },
  { id: 'player_f2', label: 'Nadia' },
];

/**
 * Profil lama menyimpan `gender` ('m' / 'f'), bukan id avatar. Simpanan yang
 * sudah ada tidak boleh kehilangan wajahnya hanya karena pilihannya bertambah,
 * jadi nilai lama diterjemahkan di sini, di satu tempat.
 */
export function avatarOf(profile) {
  const id = profile?.avatar;
  if (id && AVATARS.some((a) => a.id === id)) return id;
  return profile?.gender === 'f' ? 'player_f' : 'player_m';
}
const KEY = (slot) => `lk_save_${slot}`;
const NEWGAME_KEY = 'lk_newgame';
const PROFILE_KEY = 'lk_profile';

const MIGRATIONS = {
  // v1 predates tools, farming, weather and animals: seed them with the
  // same starting kit a new game gets.
  1: (d) => {
    d.inv = {
      index: 0,
      slots: [
        { id: 'hoe', count: 1 }, { id: 'axe', count: 1 }, { id: 'pickaxe', count: 1 },
        { id: 'scythe', count: 1 }, { id: 'watering_can', count: 1, water: 40 },
        { id: 'seed_turnip', count: 15 },
        ...new Array(18).fill(null),
      ],
    };
    d.soil = [];
    d.shipping = [];
    d.weather = { kind: 'sunny' };
    d.player = { ...d.player, energy: 100, maxEnergy: 100 };
    return d;
  },
  // v3 merges the separate farm/town maps into one 'valley' map, so old
  // positions and per-area removals no longer mean anything.
  2: (d) => {
    d.area = 'valley';
    d.removals = {};
    delete d.player?.x;
    delete d.player?.y;
    return d;
  },
};

export function hasSave(slot = 0) {
  try { return localStorage.getItem(KEY(slot)) !== null; } catch { return false; }
}

export function writeSave(data, slot = 0) {
  const json = JSON.stringify({ ...data, version: SAVE_VERSION, savedAt: Date.now() });
  try {
    const prev = localStorage.getItem(KEY(slot));
    if (prev) localStorage.setItem(KEY(slot) + '.bak', prev);
    localStorage.setItem(KEY(slot), json);
    return true;
  } catch (e) {
    console.warn('save failed', e);
    return false;
  }
}

export function readSave(slot = 0) {
  let raw;
  try { raw = localStorage.getItem(KEY(slot)); } catch { return null; }
  if (!raw) return null;
  let data;
  try { data = JSON.parse(raw); } catch {
    try { data = JSON.parse(localStorage.getItem(KEY(slot) + '.bak')); } catch { return null; }
    if (!data) return null;
  }
  let v = data.version ?? 0;
  if (v > SAVE_VERSION) throw new Error(`Save dari versi lebih baru (${v})`);
  while (v < SAVE_VERSION) {
    if (MIGRATIONS[v]) data = MIGRATIONS[v](data);
    v += 1;
    data.version = v;
  }
  return data;
}

export function deleteSave(slot = 0) {
  try { localStorage.removeItem(KEY(slot)); localStorage.removeItem(KEY(slot) + '.bak'); } catch {}
}

/**
 * Who the player is, kept apart from the save file.
 *
 * The homepage handoff below is consumed on the first read, and the save file
 * is only written when the player sleeps — so between "start a new game" and
 * "sleep for the first time" there was nowhere the name lived. Reloading the
 * page in that window turned Iqbal back into the default Petani, and the chat
 * made that visible to everyone else too.
 */
export function writeProfile(p) {
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); } catch {}
}

export function readProfile() {
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY)); } catch { return null; }
}

/** Handoff from the homepage: {name, gender, farmName}. Consumed once by the game. */
export function setNewGame(opts) { try { localStorage.setItem(NEWGAME_KEY, JSON.stringify(opts)); } catch {} }
export function takeNewGame() {
  try {
    const raw = localStorage.getItem(NEWGAME_KEY);
    if (!raw) return null;
    localStorage.removeItem(NEWGAME_KEY);
    return JSON.parse(raw);
  } catch { return null; }
}
