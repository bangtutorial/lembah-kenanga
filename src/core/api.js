// Alamat endpoint API, diturunkan dari alamat modul ini sendiri.
//
// Semula jalurnya ditulis mutlak, `/api/chat`. Itu hanya benar kalau game
// dipasang di akar domain. Dipasang di subfolder — contoh.com/lembah-kenanga —
// jalur mutlak meleset ke contoh.com/api/chat, dan obrolan serta akun
// mati tanpa pesan kesalahan yang jelas.
//
// `import.meta.url` selalu tahu di mana berkas ini benar-benar berada, jadi
// akar pasang bisa dihitung sekali di sini dan tidak ada satu pun tempat lain
// yang perlu tahu game sedang dipasang di mana.
const INSTALL_ROOT = new URL('../../', import.meta.url);   // src/core/ -> akar pasang

/** `apiUrl('chat?after=3')` -> '.../lembah-kenanga/api/chat?after=3' */
export function apiUrl(path) {
  return new URL('api/' + String(path).replace(/^\/+/, ''), INSTALL_ROOT).href;
}
