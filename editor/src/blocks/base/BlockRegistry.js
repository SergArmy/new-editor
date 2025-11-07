/**
 * @typedef {typeof Block} BlockClass
 */

export class BlockRegistry {
  constructor() {
    /** @type {Map<string, BlockClass>} */
    this.registry = new Map();
  }

  /**
   * @param {string} type
   * @param {BlockClass} BlockClass
   */
  register(type, BlockClass) {
    this.registry.set(type, BlockClass);
  }

  /**
   * @param {string} type
   * @returns {BlockClass|undefined}
   */
  get(type) {
    return this.registry.get(type);
  }

  /**
   * @returns {string[]}
   */
  getTypes() {
    return Array.from(this.registry.keys());
  }
}

