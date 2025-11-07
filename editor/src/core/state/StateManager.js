import { StateSnapshot } from './StateSnapshot.js';
import { StateDiff } from './StateDiff.js';

export class StateManager {
  constructor(initialState = {}) {
    this._current = new StateSnapshot(initialState);
    this._subscribers = new Set();
  }

  get state() {
    return this._current.data;
  }

  subscribe(listener) {
    this._subscribers.add(listener);
    return () => this._subscribers.delete(listener);
  }

  replaceState(nextState) {
    const prev = this._current;
    const next = new StateSnapshot(nextState);
    if (prev === next || shallowEqual(prev.data, next.data)) return; // quick exit
    this._current = next;
    const diff = StateDiff.diff(prev.data, next.data);
    for (const s of [...this._subscribers]) s({ prev: prev.data, next: next.data, diff });
  }

  setState(updater) {
    const next = typeof updater === 'function' ? updater(this.state) : updater;
    this.replaceState(next);
  }
}

function shallowEqual(a, b) {
  if (a === b) return true;
  if (!a || !b) return false;
  const ka = Object.keys(a); const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  for (const k of ka) if (!Object.is(a[k], b[k])) return false;
  return true;
}


