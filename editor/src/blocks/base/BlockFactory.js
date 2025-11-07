import { Block } from './Block.js';
import { BlockRegistry } from './BlockRegistry.js';

export class BlockFactory {
  /**
   * @param {BlockRegistry} registry
   */
  constructor(registry) {
    this.registry = registry;
  }

  /**
   * @param {Object} data
   * @returns {Block}
   */
  create(data) {
    const BlockClass = this.registry.get(data.type) || Block;
    return new BlockClass(data);
  }
}

