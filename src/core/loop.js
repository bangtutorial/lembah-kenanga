// Fixed-step update (60 Hz) with render every animation frame.
const STEP = 1 / 60;
const MAX_FRAME = 0.25; // clamp after tab switch so we don't spiral

export function startLoop({ update, render }) {
  let last = performance.now();
  let acc = 0;
  let running = true;

  function frame(now) {
    if (!running) return;
    acc += Math.min(MAX_FRAME, (now - last) / 1000);
    last = now;
    while (acc >= STEP) {
      update(STEP);
      acc -= STEP;
    }
    render(acc / STEP);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return { stop() { running = false; } };
}
