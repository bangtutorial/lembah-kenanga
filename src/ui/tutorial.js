// First-day guidance. A short checklist that ticks itself off as the player
// does each thing, then disappears for good. No modal, no forced steps — it
// sits in a corner and can be dismissed with H.
import { view } from '../render/renderer.js';
import { panel, text, UI } from './draw.js';

// Labels stay short: the panel is fixed width and sits over the world, so a
// wrapped or clipped line reads as a bug.
const STEPS = [
  { id: 'walk', label: 'Jalan: WASD / panah' },
  { id: 'gate', label: 'Masuk petak kebun' },
  { id: 'till', label: 'Cangkul tanah (alat 1)' },
  { id: 'plant', label: 'Tanam benih (alat 6)' },
  { id: 'water', label: 'Siram tanaman (alat 5)' },
  { id: 'sleep', label: 'Tidur di depan rumah' },
];

export class Tutorial {
  constructor() {
    this.done = new Set();
    this.hidden = false;
    this.finished = false;
    this.flash = 0;           // highlights the list when a step is ticked
  }

  /** Mark a step complete; ignores unknown or repeated ids. */
  complete(id) {
    if (this.finished || this.done.has(id)) return;
    if (!STEPS.some((s) => s.id === id)) return;
    this.done.add(id);
    this.flash = 0.8;
    if (this.done.size === STEPS.length) this.finished = true;
  }

  update(dt) { if (this.flash > 0) this.flash -= dt; }
  toggle() { this.hidden = !this.hidden; }

  get active() { return !this.finished && !this.hidden; }

  draw(ctx) {
    if (this.finished || this.hidden) return;
    const w = 244, lh = 20;
    const h = 46 + STEPS.length * lh + 40;   // room for the hint line inside the border
    const x = view.w - w - 8, y = 128;   // clear of the money panel and toasts
    panel(ctx, x, y, w, h);

    const glow = Math.max(0, this.flash);
    text(ctx, 'PANDUAN HARI 1', x + w / 2, y + 14, {
      font: UI.fontTitle, align: 'center', color: glow > 0 ? '#4f9a29' : UI.red,
    });

    STEPS.forEach((s, i) => {
      const done = this.done.has(s.id);
      const ly = y + 40 + i * lh;
      text(ctx, done ? '✓' : '•', x + 16, ly, {
        font: UI.fontBig, color: done ? '#4f9a29' : '#8b7a58',
      });
      text(ctx, s.label, x + 34, ly, {
        font: UI.fontBig, color: done ? '#8b7a58' : UI.outline,
      });
    });

    text(ctx, 'H  sembunyikan', x + w / 2, y + h - 34, { font: UI.font, align: 'center', color: '#7a6647' });
  }

  toJSON() { return { done: [...this.done], hidden: this.hidden, finished: this.finished }; }
  load(d) {
    if (!d) return;
    this.done = new Set(d.done ?? []);
    this.hidden = !!d.hidden;
    this.finished = !!d.finished;
  }
}
