// Procedural Web Audio: music box melody, day/night ambience, and SFX.
//
// Ported from the sibling project "Game Cozy" (app/src/game/audio.ts) at the
// user's request, so both games sound like the same world. Nothing is loaded
// from disk — every sound is synthesised, which means zero download weight and
// a melody that never repeats itself exactly.
//
// Why pentatonic: every note in the scale sounds fine next to every other note,
// so a random walk through it can never land on a sour interval. That is what
// lets the melody be generated on the fly instead of composed.

const PENTA = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1318.5]; // C5 D5 E5 G5 A5 C6 E6
const BASSLINE = [130.81, 98.0, 110.0, 87.31];                          // C3 G2 A2 F2

const SETTINGS_KEY = 'lk_audio';
const DEFAULTS = { musicVolume: 0.15, sfxVolume: 0.6, muted: false };

export class AudioSystem {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicBus = null;
    this.ambBus = null;
    this.sfxBus = null;
    this.started = false;
    this.musicTimer = null;
    this.ambTimer = null;
    this.nextNoteTime = 0;
    this.noteIdx = 0;
    this.melodyPos = 2;
    this.ambience = 'day';
    this.settings = { ...DEFAULTS, ...readSettings() };
  }

  get muted() { return this.settings.muted; }

  /** Must be called from the first user gesture; browsers block audio before that. */
  unlock() {
    if (this.started) {
      if (this.ctx?.state === 'suspended') this.ctx.resume();
      return;
    }
    try {
      const AC = window.AudioContext ?? window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.settings.muted ? 0 : 1;
      this.master.connect(this.ctx.destination);

      this.musicBus = this.ctx.createGain();
      this.musicBus.gain.value = this.settings.musicVolume;
      this.musicBus.connect(this.master);

      this.ambBus = this.ctx.createGain();
      this.ambBus.gain.value = this.settings.musicVolume * 0.64;
      this.ambBus.connect(this.master);

      this.sfxBus = this.ctx.createGain();
      this.sfxBus.gain.value = this.settings.sfxVolume;
      this.sfxBus.connect(this.master);

      this.started = true;
      this.startMusic();
      this.scheduleAmbience();
    } catch (e) {
      console.warn('[audio] gagal init', e);
    }
  }

  // ------------------------------------------------------------- settings
  setVolume(v) {
    this.settings.musicVolume = clamp01(v);
    this.settings.muted = false;
    this.applyVolume();
    writeSettings(this.settings);
  }

  setSfxVolume(v) {
    this.settings.sfxVolume = clamp01(v);
    this.applyVolume();
    writeSettings(this.settings);
    this.ui();                       // audible preview of the new level
  }

  toggleMute() {
    this.settings.muted = !this.settings.muted;
    this.applyVolume();
    writeSettings(this.settings);
    return this.settings.muted;
  }

  applyVolume() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    ramp(this.master, this.settings.muted ? 0 : 1, t);
    ramp(this.musicBus, this.settings.musicVolume, t);
    ramp(this.ambBus, this.settings.musicVolume * 0.64, t);
    ramp(this.sfxBus, this.settings.sfxVolume, t);
  }

  /** Bird song by day, crickets by night. */
  setAmbience(mode) { this.ambience = mode; }

  // ---------------------------------------------------------- music box
  startMusic() {
    if (!this.ctx) return;
    this.nextNoteTime = this.ctx.currentTime + 0.2;
    this.noteIdx = 0;
    const tick = () => {
      if (!this.ctx) return;
      // schedule a second ahead so a busy frame never stutters the melody
      while (this.nextNoteTime < this.ctx.currentTime + 1.0) {
        this.scheduleNote(this.nextNoteTime);
        this.nextNoteTime += 0.34;   // ~88 bpm
        this.noteIdx += 1;
      }
    };
    tick();
    this.musicTimer = window.setInterval(tick, 240);
  }

  scheduleNote(t) {
    if (!this.ctx || !this.musicBus) return;
    const step = this.noteIdx % 32;
    if (step % 8 === 0) {
      const bass = BASSLINE[Math.floor(this.noteIdx / 8) % BASSLINE.length];
      this.pluck(bass, t, 2.4, 0.10, 'triangle');
    }
    const rest = step % 4 === 3 && Math.random() < 0.45;   // breathing room
    if (rest) return;
    const drift = Math.random() < 0.62
      ? (Math.random() < 0.5 ? -1 : 1)
      : 2 * (Math.random() < 0.5 ? -1 : 1);
    this.melodyPos = Math.min(PENTA.length - 1, Math.max(0, this.melodyPos + drift));
    const f = PENTA[this.melodyPos];
    const vel = 0.14 + Math.random() * 0.07;
    this.pluck(f, t, 1.5, vel, 'sine');
    this.pluck(f * 3, t, 0.7, vel * 0.18, 'sine');          // music-box shimmer
  }

  pluck(freq, t, dur, vol, type) {
    if (!this.ctx || !this.musicBus) return;
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(this.musicBus);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  // ----------------------------------------------------------- ambience
  scheduleAmbience() {
    if (!this.ctx) return;
    const loop = () => {
      if (!this.ctx) return;
      if (this.ambience === 'day') {
        this.birdChirp();
        this.ambTimer = window.setTimeout(loop, 2600 + Math.random() * 5200);
      } else {
        this.cricket();
        this.ambTimer = window.setTimeout(loop, 900 + Math.random() * 1400);
      }
    };
    loop();
  }

  birdChirp() {
    if (!this.ctx || !this.ambBus || this.muted) return;
    const t0 = this.ctx.currentTime + 0.05;
    const blips = 2 + Math.floor(Math.random() * 3);
    const base = 2200 + Math.random() * 1400;
    for (let i = 0; i < blips; i++) {
      const t = t0 + i * (0.1 + Math.random() * 0.05);
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(base + Math.random() * 500, t);
      osc.frequency.exponentialRampToValueAtTime(base * (0.7 + Math.random() * 0.25), t + 0.07);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.16, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
      osc.connect(g);
      g.connect(this.ambBus);
      osc.start(t);
      osc.stop(t + 0.12);
    }
  }

  cricket() {
    if (!this.ctx || !this.ambBus || this.muted) return;
    const t0 = this.ctx.currentTime + 0.03;
    const pulses = 3 + Math.floor(Math.random() * 4);
    const f = 3800 + Math.random() * 700;
    for (let i = 0; i < pulses; i++) {
      const t = t0 + i * 0.055;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.045, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
      osc.connect(g);
      g.connect(this.ambBus);
      osc.start(t);
      osc.stop(t + 0.06);
    }
  }

  // ---------------------------------------------------------------- SFX
  noiseBuffer(dur) {
    if (!this.ctx) return null;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  noiseHit(t, dur, vol, filterFreq, type = 'lowpass') {
    if (!this.ctx || !this.sfxBus) return;
    const buf = this.noiseBuffer(dur);
    if (!buf) return;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const flt = this.ctx.createBiquadFilter();
    flt.type = type;
    flt.frequency.value = filterFreq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(flt);
    flt.connect(g);
    g.connect(this.sfxBus);
    src.start(t);
  }

  tone(t, f0, f1, dur, vol, type = 'sine') {
    if (!this.ctx || !this.sfxBus) return;
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(f0, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(this.sfxBus);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  now() {
    if (!this.ctx || this.muted) return null;
    return this.ctx.currentTime;
  }

  step() { const t = this.now(); if (t !== null) this.noiseHit(t, 0.05, 0.07, 700 + Math.random() * 200); }

  hoe() {
    const t = this.now(); if (t === null) return;
    this.noiseHit(t, 0.14, 0.28, 320);
    this.tone(t, 170, 85, 0.14, 0.2, 'sine');
  }

  plant() {
    const t = this.now(); if (t === null) return;
    this.tone(t, 620, 940, 0.09, 0.16);
    this.noiseHit(t, 0.05, 0.08, 1600);
  }

  water() {
    const t = this.now(); if (t === null || !this.ctx || !this.sfxBus) return;
    const buf = this.noiseBuffer(0.5);
    if (!buf) return;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const flt = this.ctx.createBiquadFilter();
    flt.type = 'bandpass';
    flt.frequency.setValueAtTime(1100, t);
    flt.frequency.exponentialRampToValueAtTime(2500, t + 0.45);
    flt.Q.value = 2.5;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.2, t + 0.06);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    src.connect(flt);
    flt.connect(g);
    g.connect(this.sfxBus);
    src.start(t);
  }

  harvest() {
    const t = this.now(); if (t === null) return;
    this.noiseHit(t, 0.06, 0.14, 900);
    this.tone(t + 0.03, 660, 660, 0.08, 0.16);
    this.tone(t + 0.11, 990, 990, 0.12, 0.16);
  }

  coin() {
    const t = this.now(); if (t === null) return;
    this.tone(t, 987.77, 987.77, 0.07, 0.16, 'square');
    this.tone(t + 0.07, 1318.5, 1318.5, 0.2, 0.16, 'square');
  }

  talk() {
    const t = this.now(); if (t === null) return;
    this.tone(t, 480, 520, 0.05, 0.1, 'square');
    this.tone(t + 0.07, 560, 600, 0.05, 0.08, 'square');
  }

  ui() { const t = this.now(); if (t !== null) this.tone(t, 700, 880, 0.06, 0.1); }
  denied() { const t = this.now(); if (t !== null) this.tone(t, 220, 180, 0.12, 0.12, 'square'); }

  sleep() {
    const t = this.now(); if (t === null) return;
    this.tone(t, 780, 240, 1.1, 0.14);
    this.tone(t + 0.25, 520, 196, 1.2, 0.1);
  }

  // --- built on the same primitives, for tools this game has and Cozy does not
  chop(felled = false) {
    const t = this.now(); if (t === null) return;
    this.noiseHit(t, felled ? 0.3 : 0.12, felled ? 0.34 : 0.24, 420);
    this.tone(t, 150, felled ? 60 : 90, felled ? 0.3 : 0.13, 0.2, 'triangle');
  }

  rock(broken = false) {
    const t = this.now(); if (t === null) return;
    this.noiseHit(t, broken ? 0.26 : 0.09, broken ? 0.3 : 0.22, 2600, 'highpass');
    this.tone(t, 300, broken ? 110 : 190, broken ? 0.24 : 0.1, 0.14, 'square');
  }

  scythe() {
    const t = this.now(); if (t === null) return;
    this.noiseHit(t, 0.16, 0.16, 3200, 'bandpass');
  }
}

function clamp01(v) { return Math.max(0, Math.min(1, Math.round(v * 100) / 100)); }

function ramp(node, value, t) {
  if (!node) return;
  node.gain.cancelScheduledValues(t);
  node.gain.setTargetAtTime(value, t, 0.05);
}

function readSettings() {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) ?? {}; } catch { return {}; }
}

function writeSettings(s) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch { /* private mode */ }
}
