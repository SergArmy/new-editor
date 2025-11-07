export class Signal {
  constructor(initialValue) {
    this._value = initialValue;
    this._subscribers = new Set();
  }

  get value() { return this._value; }

  set value(next) {
    if (Object.is(this._value, next)) return;
    this._value = next;
    this._notify();
  }

  subscribe(listener) {
    this._subscribers.add(listener);
    return () => this._subscribers.delete(listener);
  }

  _notify() {
    for (const s of [...this._subscribers]) s(this._value);
  }
}


