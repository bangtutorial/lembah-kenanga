// Keyboard + mouse state with "pressed this frame" edge detection.
const down = new Set();
const pressed = new Set();

const BINDINGS = {
  up: ['KeyW', 'ArrowUp'],
  down: ['KeyS', 'ArrowDown'],
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
  interact: ['KeyE', 'Space', 'Enter'],
  run: ['ShiftLeft', 'ShiftRight'],
  drop: ['Backspace', 'Delete'],
  gift: ['KeyG'],
  menu: ['Escape'],
  inventory: ['KeyI', 'Tab'],
  eat: ['KeyC'],
  nextTool: ['KeyX'],
  prevTool: ['KeyZ'],
  zoom: ['KeyF'],
  debugSeason: ['KeyN'],
  debugTime: ['KeyT'],
};

// Backspace ikut dicegah: di sebagian peramban ia masih memicu 'kembali'.
const PREVENT = ['Space', 'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Backspace'];

window.addEventListener('keydown', (e) => {
  if (PREVENT.includes(e.code)) e.preventDefault();
  if (e.repeat) return;
  down.add(e.code);
  pressed.add(e.code);
});
window.addEventListener('keyup', (e) => down.delete(e.code));
window.addEventListener('blur', () => { down.clear(); pressed.clear(); });

export const mouse = { x: 0, y: 0, clicked: false, wheel: 0 };

export function bindMouse(canvas, view) {
  const toLogical = (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - r.left) * (canvas.width / r.width);
    mouse.y = (e.clientY - r.top) * (canvas.height / r.height);
  };
  canvas.addEventListener('mousemove', toLogical);
  canvas.addEventListener('mousedown', (e) => { toLogical(e); mouse.clicked = true; });
  canvas.addEventListener('wheel', (e) => { mouse.wheel = Math.sign(e.deltaY); e.preventDefault(); }, { passive: false });
}

export const input = {
  held(action) { return BINDINGS[action].some((c) => down.has(c)); },
  pressed(action) { return BINDINGS[action].some((c) => pressed.has(c)); },

  /** 1..9 if a number key was pressed this frame, else 0. */
  digit() {
    for (let i = 1; i <= 9; i++) if (pressed.has(`Digit${i}`)) return i;
    return 0;
  },

  /** Movement axis as {x, y} in [-1, 1]; diagonals normalized. */
  axis() {
    let x = (this.held('right') ? 1 : 0) - (this.held('left') ? 1 : 0);
    let y = (this.held('down') ? 1 : 0) - (this.held('up') ? 1 : 0);
    if (x && y) { x *= Math.SQRT1_2; y *= Math.SQRT1_2; }
    return { x, y };
  },

  /** Call once at the end of every update tick. */
  endFrame() { pressed.clear(); mouse.clicked = false; mouse.wheel = 0; },
};
