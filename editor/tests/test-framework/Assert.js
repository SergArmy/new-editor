export class Assert {
  static equal(actual, expected, message) {
    if (actual != expected) throw new Error(message || `Expected ${actual} == ${expected}`);
  }
  static strictEqual(actual, expected, message) {
    if (actual !== expected) throw new Error(message || `Expected ${actual} === ${expected}`);
  }
  static isTrue(value, message) {
    if (value !== true) throw new Error(message || `Expected true, got ${value}`);
  }
  static isFalse(value, message) {
    if (value !== false) throw new Error(message || `Expected false, got ${value}`);
  }
  static isDefined(value, message) {
    if (value === undefined) throw new Error(message || `Expected defined value`);
  }
  static isNull(value, message) {
    if (value !== null) throw new Error(message || `Expected null, got ${value}`);
  }
  static isNotNull(value, message) {
    if (value === null) throw new Error(message || `Expected not null`);
  }
}


