// Game clock. 1 game minute = 0.4 s real (24 s per hour, 8 min per day).
// A day runs 06:00 -> 02:00 (minute 0 .. 1200). Passing 02:00 forces sleep.
//
// Stardew memakai 0,7 detik per menit dan itulah angka awal di sini. Terlalu
// lambat: menunggu malam tiba makan delapan menit nyata, dan sebagian besarnya
// dihabiskan berdiri menunggu, bukan bermain. Angka ini bukan soal realisme —
// ia menentukan berapa banyak yang muat dikerjakan dalam satu hari, dan sehari
// di sini isinya lebih sedikit daripada di Stardew.
import { emit } from './events.js';

export const SEASONS = ['spring', 'summer', 'autumn', 'winter'];
export const SEASON_NAMES = { spring: 'Semi', summer: 'Panas', autumn: 'Gugur', winter: 'Dingin' };
export const DAY_NAMES = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
export const DAYS_PER_SEASON = 28;
export const DAY_START_HOUR = 6;
export const DAY_END_MINUTE = 20 * 60; // 02:00 next morning
const SECONDS_PER_MINUTE = 24 / 60;

export class GameTime {
  constructor() {
    this.year = 1;
    this.seasonIndex = 0;
    this.day = 1;        // 1..28
    this.minute = 120;   // minutes since 06:00 -> start 08:00
    this.paused = false;
    this._acc = 0;
  }

  get season() { return SEASONS[this.seasonIndex]; }
  get hour24() { return (DAY_START_HOUR + Math.floor(this.minute / 60)) % 24; }
  get minuteOfHour() { return this.minute % 60; }
  get dayName() { return DAY_NAMES[(this.day - 1) % 7]; }
  get clockText() {
    const m = Math.floor(this.minuteOfHour / 10) * 10; // HUD ticks every 10 min like Stardew
    return `${String(this.hour24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  get dateText() { return `${this.dayName} ${this.day} ${SEASON_NAMES[this.season]}`; }
  /** 0..1 daylight factor used by the night overlay. */
  get hourFloat() { return DAY_START_HOUR + this.minute / 60; }

  update(dt) {
    if (this.paused) return;
    this._acc += dt;
    while (this._acc >= SECONDS_PER_MINUTE) {
      this._acc -= SECONDS_PER_MINUTE;
      this.minute += 1;
      emit('time:minute', this);
      if (this.minute % 60 === 0) emit('time:hour', this);
      if (this.minute >= DAY_END_MINUTE) emit('time:passout', this);
    }
  }

  /**
   * Lompat maju beberapa menit (istirahat di klinik, misalnya).
   *
   * Dijalankan menit demi menit, bukan sekali tambah, supaya semua yang
   * menunggu 'time:hour' — jadwal warga, lampu malam — tetap kebagian setiap
   * jam yang dilewati. Dua jam hanya 120 putaran; mahalnya tidak terasa.
   */
  skip(minutes) {
    for (let i = 0; i < minutes; i++) {
      this.minute += 1;
      emit('time:minute', this);
      if (this.minute % 60 === 0) emit('time:hour', this);
      if (this.minute >= DAY_END_MINUTE) { emit('time:passout', this); return; }
    }
    this._acc = 0;
  }

  /** Advance to the next morning (sleep). */
  nextDay() {
    this.minute = 0;
    this._acc = 0;
    this.day += 1;
    if (this.day > DAYS_PER_SEASON) {
      this.day = 1;
      this.seasonIndex = (this.seasonIndex + 1) % 4;
      if (this.seasonIndex === 0) this.year += 1;
      emit('time:season', this);
    }
    emit('time:day', this);
  }

  debugNextSeason() {
    this.seasonIndex = (this.seasonIndex + 1) % 4;
    emit('time:season', this);
  }

  toJSON() { return { year: this.year, seasonIndex: this.seasonIndex, day: this.day, minute: this.minute }; }
  load(d) { Object.assign(this, { year: d.year, seasonIndex: d.seasonIndex, day: d.day, minute: d.minute, _acc: 0 }); }
}
