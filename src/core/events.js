// Tiny pub/sub. Systems talk through events, UI never polls game state.
const listeners = new Map();

export function on(name, fn) {
  if (!listeners.has(name)) listeners.set(name, new Set());
  listeners.get(name).add(fn);
  return () => listeners.get(name).delete(fn);
}

export function emit(name, payload) {
  const set = listeners.get(name);
  if (!set) return;
  for (const fn of set) fn(payload);
}
