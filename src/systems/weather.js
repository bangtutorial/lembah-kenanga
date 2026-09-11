// Weather picked once per day from the season, plus the particle field that
// draws it. Rain waters every tilled tile overnight.
const NAMES = { sunny: 'Cerah', rain: 'Hujan', snow: 'Salju', wind: 'Berangin' };
const ICON = { sunny: 0, rain: 1, snow: 2, wind: 3 };

export class Weather {
  constructor() { this.kind = 'sunny'; this.next = 'sunny'; this.particles = []; }

  get name() { return NAMES[this.kind]; }
  get iconIndex() { return ICON[this.kind]; }
  get isRaining() { return this.kind === 'rain'; }

  /** Pick tomorrow's weather without applying it (used by the TV forecast). */
  pick(season, rng = Math.random) {
    const r = rng();
    if (season === 'winter') return r < 0.35 ? 'snow' : r < 0.5 ? 'wind' : 'sunny';
    if (season === 'spring') return r < 0.3 ? 'rain' : r < 0.4 ? 'wind' : 'sunny';
    if (season === 'summer') return r < 0.15 ? 'rain' : 'sunny';
    return r < 0.25 ? 'rain' : r < 0.55 ? 'wind' : 'sunny';
  }

  /** Apply the forecast as today's weather and draw a new forecast. */
  advance(season, rng = Math.random) {
    this.kind = this.next ?? this.pick(season, rng);
    this.next = this.pick(season, rng);
    this.particles.length = 0;
    return this.kind;
  }

  nameOf(kind) { return NAMES[kind]; }
  iconOf(kind) { return ICON[kind]; }

  roll(season, rng = Math.random) {
    const r = rng();
    if (season === 'winter') this.kind = r < 0.35 ? 'snow' : r < 0.5 ? 'wind' : 'sunny';
    else if (season === 'spring') this.kind = r < 0.3 ? 'rain' : r < 0.4 ? 'wind' : 'sunny';
    else if (season === 'summer') this.kind = r < 0.15 ? 'rain' : 'sunny';
    else this.kind = r < 0.25 ? 'rain' : r < 0.55 ? 'wind' : 'sunny';
    this.next = this.pick(season, rng);
    this.particles.length = 0;
    return this.kind;
  }

  /** Particles live in screen space so they never need culling. */
  update(dt, w, h, season) {
    const want = this.kind === 'rain' ? 90 : this.kind === 'snow' ? 60 : season === 'autumn' ? 18 : 0;
    while (this.particles.length < want) {
      this.particles.push({
        x: Math.random() * (w + 200) - 100,
        y: Math.random() * h,
        vx: this.kind === 'rain' ? -60 : Math.random() * 30 - 15,
        vy: this.kind === 'rain' ? 520 : this.kind === 'snow' ? 60 : 40,
        f: Math.floor(Math.random() * 2),
        sway: Math.random() * Math.PI * 2,
      });
    }
    while (this.particles.length > want) this.particles.pop();
    for (const p of this.particles) {
      p.sway += dt * 2;
      p.x += (p.vx + (this.kind === 'rain' ? 0 : Math.sin(p.sway) * 20)) * dt;
      p.y += p.vy * dt;
      if (p.y > h + 16) { p.y = -16; p.x = Math.random() * (w + 200) - 100; }
      if (p.x < -110) p.x = w + 90;
      if (p.x > w + 100) p.x = -100;
    }
  }

  /** Index into the `particles` sprite sheet for this weather. */
  spriteIndex(p, season) {
    if (this.kind === 'rain') return 0;
    if (this.kind === 'snow') return 2 + p.f;
    if (season === 'autumn') return 4 + p.f;
    return 6 + p.f;
  }

  toJSON() { return { kind: this.kind, next: this.next }; }
  load(d) { if (d) { this.kind = d.kind; this.next = d.next ?? d.kind; } }
}
