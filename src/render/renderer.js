// Canvas 2D renderer. Integer pixel zoom, but the logical viewport follows the
// window so there is no letterboxing: view = floor(window / zoom).
import { emit } from '../core/events.js';

export const MIN_VIEW = { w: 640, h: 360 }; // never show less than this at any zoom
export const MAX_ZOOM = 4;

/** Live logical viewport size — read view.w / view.h, never cache them. */
export const view = { w: 960, h: 540, zoom: 1 };

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.zoomOverride = loadZoom(); // 0 = auto, otherwise a fixed integer zoom
    this.fit();
    window.addEventListener('resize', () => this.fit());
  }

  fit() {
    const ww = window.innerWidth, wh = window.innerHeight;
    let zoom = this.zoomOverride || Math.floor(Math.min(ww / MIN_VIEW.w, wh / MIN_VIEW.h));
    this.applyZoom(Math.max(1, Math.min(MAX_ZOOM, zoom)));
  }

  applyZoom(zoom) {
    view.zoom = zoom;
    view.w = Math.floor(window.innerWidth / zoom);
    view.h = Math.floor(window.innerHeight / zoom);
    this.canvas.width = view.w;
    this.canvas.height = view.h;
    this.canvas.style.width = `${view.w * zoom}px`;
    this.canvas.style.height = `${view.h * zoom}px`;
    this.ctx.imageSmoothingEnabled = false;
    emit('view:resize', view);
  }

  /** Cycle zoom: auto -> 1 -> 2 -> 3 -> 4 -> auto. */
  cycleZoom() {
    this.zoomOverride = (this.zoomOverride + 1) % (MAX_ZOOM + 1);
    this.fit();
    saveZoom(this.zoomOverride);
    return this.zoomOverride;
  }

  /** Move one step along auto -> x1 -> ... -> x4, used by the settings menu. */
  stepZoom(dir) {
    const next = this.zoomOverride + dir;
    this.zoomOverride = Math.max(0, Math.min(MAX_ZOOM, next));
    this.fit();
    saveZoom(this.zoomOverride);
    return this.zoomOverride;
  }

  clear(color = '#000') {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, view.w, view.h);
  }
}

const ZOOM_KEY = 'lk_zoom';
function loadZoom() {
  try { return Math.max(0, Math.min(MAX_ZOOM, Number(localStorage.getItem(ZOOM_KEY)) || 0)); } catch { return 0; }
}
function saveZoom(z) {
  try { localStorage.setItem(ZOOM_KEY, String(z)); } catch { /* private mode */ }
}

/** Draw one frame of a grid sprite sheet at (x, y) = pivot bottom-center in screen px. */
export function drawFrame(ctx, img, fw, fh, col, row, x, y) {
  ctx.drawImage(img, col * fw, row * fh, fw, fh, Math.round(x - fw / 2), Math.round(y - fh), fw, fh);
}
