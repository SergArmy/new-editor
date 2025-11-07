export class ComputedSignal {
  constructor(compute, deps = []) {
    this._compute = compute;
    this._deps = deps;
    this._subscribers = new Set();
    this._value = this._compute();
    this._unsubscribe = deps.map(d => d.subscribe(() => this._recompute()));
  }

  get value() { return this._value; }

  subscribe(listener) {
    this._subscribers.add(listener);
    return () => this._subscribers.delete(listener);
  }

  _recompute() {
    const next = this._compute();
    if (Object.is(this._value, next)) return;
    this._value = next;
    for (const s of [...this._subscribers]) s(this._value);
  }
}


