// Public chat client: one long-poll in flight, one POST per message.
//
// The server (tools/chat.py) holds a GET open for up to 25 seconds and answers
// the moment someone speaks, so messages land immediately without a WebSocket
// and without a polling timer hammering the box. If the server is not running
// — someone opened the game straight off the filesystem — every call fails
// quietly and the UI says so rather than throwing.

const STORE_KEY = 'lk_chat_token';
import { apiUrl } from '../core/api.js';
const RETRY = [1000, 2000, 4000, 8000];   // backoff while the server is away

/**
 * A stable id for this tab, used for presence and rate limiting.
 *
 * sessionStorage, not localStorage: it survives a reload but is fresh per tab,
 * so two windows side by side count as two players. That is what "berapa yang
 * online" is asked to mean, and it is also the only way one person can try the
 * chat out on their own machine.
 */
function makeToken() {
  try {
    const saved = sessionStorage.getItem(STORE_KEY);
    if (saved) return saved;
    const t = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem(STORE_KEY, t);
    return t;
  } catch {
    return Math.random().toString(36).slice(2);
  }
}

export class Chat {
  constructor({ name, avatar }) {
    this.token = makeToken();
    this.name = name;
    this.avatar = avatar;
    this.messages = [];
    // Ids of lines this tab posted. The server never echoes tokens back — it
    // has no business telling everyone who is who — so "mine" is tracked here
    // and used to keep the unread badge from counting my own messages.
    this.mine = new Set();
    this.online = 0;
    this.last = 0;
    this.unread = 0;
    this.status = 'connecting';   // connecting | online | offline
    this.error = '';
    this.running = false;
    this.fails = 0;
  }

  setIdentity(name, avatar) {
    this.name = name;
    this.avatar = avatar;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.loop();
  }

  stop() { this.running = false; }

  /**
   * Tell the server we are going. Without this the tab just stops polling and
   * the server keeps counting it as online until the presence window expires,
   * so closing a window left a ghost in the count for the best part of a
   * minute. sendBeacon because a normal fetch is cancelled as the page unloads.
   */
  leave() {
    this.running = false;
    try {
      const blob = new Blob([JSON.stringify({ token: this.token })], { type: 'application/json' });
      navigator.sendBeacon(apiUrl('chat/bye'), blob);
    } catch { /* closing anyway */ }
  }

  async loop() {
    while (this.running) {
      try {
        const q = new URLSearchParams({
          since: String(this.last),
          token: this.token,
          name: this.name,
          avatar: this.avatar,
        });
        const res = await fetch(apiUrl(`chat?${q}`));
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        this.online = data.online ?? 0;
        if (data.messages?.length) {
          for (const m of data.messages) {
            this.messages.push(m);
            if (!m.own && !this.mine.has(m.id)) this.unread++;
          }
          this.messages = this.messages.slice(-150);
          this.last = data.last ?? this.last;
        } else if (data.last != null) {
          this.last = data.last;
        }
        this.status = 'online';
        this.fails = 0;
      } catch (e) {
        this.status = 'offline';
        this.error = 'Server obrolan tidak terhubung.';
        const wait = RETRY[Math.min(this.fails++, RETRY.length - 1)];
        await new Promise((r) => setTimeout(r, wait));
      }
    }
  }

  /** Send one line. Returns an error string, or null when it went through. */
  async send(text) {
    const body = JSON.stringify({ token: this.token, name: this.name, avatar: this.avatar, text });
    try {
      const res = await fetch(apiUrl('chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });
      const data = await res.json();
      if (data.ok && data.id) this.mine.add(data.id);
      return data.ok ? null : (data.error ?? 'Gagal mengirim.');
    } catch {
      return 'Server obrolan tidak terhubung.';
    }
  }
}
