// 24-slot inventory; the first 9 slots are the hotbar.
import { emit } from '../core/events.js';

export const SLOTS = 24;
export const HOTBAR = 9;

let ITEMS = {};
export function setItemData(data) { ITEMS = data; }
export function itemDef(id) { return ITEMS[id]; }
export function itemName(id) { return ITEMS[id]?.name ?? id; }

export class Inventory {
  constructor() {
    this.slots = new Array(SLOTS).fill(null); // {id, count, water?}
    this.index = 0;                            // selected hotbar slot
  }

  get held() { return this.slots[this.index]; }

  maxStack(id) { return ITEMS[id]?.stack ?? 99; }

  /** Add items; returns how many did NOT fit. */
  add(id, count = 1, extra = null) {
    const max = this.maxStack(id);
    if (max > 1) {
      for (const s of this.slots) {
        if (s && s.id === id && s.count < max) {
          const move = Math.min(count, max - s.count);
          s.count += move; count -= move;
          if (count === 0) { emit('inv:change', this); return 0; }
        }
      }
    }
    for (let i = 0; i < SLOTS && count > 0; i++) {
      if (!this.slots[i]) {
        const move = Math.min(count, max);
        this.slots[i] = { id, count: move, ...(extra || {}) };
        count -= move;
      }
    }
    emit('inv:change', this);
    return count;
  }

  removeAt(i, count = 1) {
    const s = this.slots[i];
    if (!s) return false;
    s.count -= count;
    if (s.count <= 0) this.slots[i] = null;
    emit('inv:change', this);
    return true;
  }

  count(id) { return this.slots.reduce((n, s) => n + (s?.id === id ? s.count : 0), 0); }

  swap(a, b) {
    [this.slots[a], this.slots[b]] = [this.slots[b], this.slots[a]];
    emit('inv:change', this);
  }

  toJSON() { return { slots: this.slots, index: this.index }; }
  load(d) { if (d) { this.slots = d.slots; this.index = d.index ?? 0; } }
}
