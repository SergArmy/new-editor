function deepFreeze(obj) {
  if (obj && typeof obj === 'object' && !Object.isFrozen(obj)) {
    Object.freeze(obj);
    for (const key of Object.keys(obj)) deepFreeze(obj[key]);
  }
  return obj;
}

export class StateSnapshot {
  constructor(state) {
    this.timestamp = Date.now();
    this.state = deepFreeze(structuredClone(state));
  }

  get data() { return this.state; }
}


