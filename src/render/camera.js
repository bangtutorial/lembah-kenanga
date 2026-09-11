// Top-down follow camera: per-axis deadzone, frame-rate independent smoothing,
// clamped so the view never leaves the map.
export class Camera {
  constructor(viewW, viewH) {
    this.viewW = viewW;
    this.viewH = viewH;
    this.x = 0; // top-left of the view in world px
    this.y = 0;
    this.focusX = 0;
    this.focusY = 0;
    this.deadzone = { x: 48, y: 32 }; // half extents (96x64 box)
    this.rate = 8;
    this.bounds = { w: viewW, h: viewH };
  }

  snapTo(tx, ty) {
    this.focusX = tx; this.focusY = ty;
    this.x = tx - this.viewW / 2; this.y = ty - this.viewH / 2;
    this.clamp();
  }

  follow(tx, ty, dt) {
    const dx = tx - this.focusX, dy = ty - this.focusY;
    this.focusX += Math.sign(dx) * Math.max(0, Math.abs(dx) - this.deadzone.x);
    this.focusY += Math.sign(dy) * Math.max(0, Math.abs(dy) - this.deadzone.y);
    const t = 1 - Math.exp(-this.rate * dt);
    this.x += (this.focusX - this.viewW / 2 - this.x) * t;
    this.y += (this.focusY - this.viewH / 2 - this.y) * t;
    this.clamp();
  }

  clamp() {
    // Maps smaller than the viewport are centred instead of clamped, which
    // leaves a negative offset the renderer letterboxes around (house interior).
    this.x = this.bounds.w <= this.viewW
      ? (this.bounds.w - this.viewW) / 2
      : Math.max(0, Math.min(this.bounds.w - this.viewW, this.x));
    this.y = this.bounds.h <= this.viewH
      ? (this.bounds.h - this.viewH) / 2
      : Math.max(0, Math.min(this.bounds.h - this.viewH, this.y));
  }

  /** Integer offsets for pixel-perfect blitting. */
  get ix() { return Math.round(this.x); }
  get iy() { return Math.round(this.y); }
}
