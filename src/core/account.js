// Akun pemain: satu username, tanpa kata sandi.
//
// Yang diberikan: keunikan dan cara masuk kembali. Simpanan permainan ikut
// dititipkan ke server dengan kunci username, jadi pemain bisa melanjutkan dari
// peramban atau komputer mana pun cukup dengan mengetik username-nya.
//
// Yang TIDAK diberikan: pembuktian. Tanpa kata sandi, siapa pun yang tahu
// username orang lain bisa mengetiknya dan mengambil alih simpanannya. Itu
// keputusan yang disengaja untuk MVP, bukan sesuatu yang lupa ditambal — dan
// satu-satunya obatnya kata sandi, bukan pemeriksaan tambahan di sini.
//
// Server boleh mati tanpa membuat game ikut mati: setiap pemanggilan gagal
// dengan sopan dan pemanggilnya jatuh kembali ke localStorage.

import { apiUrl } from './api.js';

const KEY = 'lk_username';
const SESSION = 'lk_userkey';

export const RULE = 'Huruf dan angka saja, 3–16 karakter, tanpa spasi.';

/** Pesan kesalahan, atau null kalau bentuknya sah. Cerminan aturan di server. */
export function validate(name) {
  const u = (name ?? '').trim();
  if (!u) return 'Username belum diisi.';
  if (u.length < 3) return 'Username minimal 3 karakter.';
  if (u.length > 16) return 'Username maksimal 16 karakter.';
  if (!/^[A-Za-z0-9]+$/.test(u)) return 'Username hanya boleh huruf dan angka, tanpa spasi.';
  return null;
}

export function currentUsername() {
  try { return localStorage.getItem(KEY) || null; } catch { return null; }
}

export function setUsername(u) {
  try { if (u) localStorage.setItem(KEY, u); else localStorage.removeItem(KEY); } catch {}
}

/**
 * Kunci sesi yang diterbitkan server saat mendaftar atau melanjutkan. Ia
 * dibutuhkan untuk MENULIS simpanan, dan itu satu-satunya tugasnya.
 *
 * Ia bukan bukti identitas: tanpa kata sandi, siapa pun yang mengetik username
 * orang lain akan mendapat kunci baru untuk username itu juga. Gunanya menutup
 * penulisan langsung ke API oleh yang sekadar menebak username, dan menjadi
 * tempat pemeriksaan kata sandi nanti dipasang.
 */
export function sessionKey() {
  try { return localStorage.getItem(SESSION) || null; } catch { return null; }
}

function setSessionKey(k) {
  try { if (k) localStorage.setItem(SESSION, k); else localStorage.removeItem(SESSION); } catch {}
}

async function post(path, payload) {
  const res = await fetch(apiUrl(`player/${path}`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

/** Apakah username masih bebas dipakai. */
export async function check(username) {
  const err = validate(username);
  if (err) return { available: false, reason: err };
  try {
    const d = await post('check', { username: username.trim() });
    return { available: !!d.available, reason: d.reason ?? '' };
  } catch {
    return { available: false, reason: 'Server tidak terhubung — coba lagi.', offline: true };
  }
}

export async function register(username, profile) {
  try {
    const d = await post('register', { username: username.trim(), profile });
    if (d.ok) { setUsername(d.username); setSessionKey(d.key); }
    return d;
  } catch {
    return { ok: false, error: 'Server tidak terhubung.', offline: true };
  }
}

export async function resume(username) {
  try {
    const d = await post('resume', { username: (username ?? '').trim() });
    if (d.ok) { setUsername(d.username); setSessionKey(d.key); }
    return d;
  } catch {
    return { ok: false, error: 'Server tidak terhubung.', offline: true };
  }
}

/**
 * Titipkan simpanan ke server. Sengaja tidak menunggu dan tidak melempar: game
 * sudah menulis ke localStorage lebih dulu, jadi kegagalan di sini berarti
 * "belum tersinkron", bukan "progres hilang".
 */
export function push(profile, save) {
  const username = currentUsername();
  const key = sessionKey();
  if (!username || !key) return Promise.resolve({ ok: false });
  return post('save', { username, key, profile, save }).catch(() => ({ ok: false, offline: true }));
}
