/**
 * @typedef {Object} BlockData
 * @property {string} id
 * @property {string} type
 * @property {number} position
 * @property {string|null} parentId
 * @property {boolean} protected
 * @property {Object} data
 */

export class Block {
  /**
   * @param {BlockData} data
   */
  constructor(data) {
    this.id = data.id;
    this.type = data.type;
    this.position = data.position || 0;
    this.parentId = data.parentId || null;
    this.protected = data.protected || false;
    this.data = data.data || {};
  }

  /**
   * @returns {HTMLElement}
   */
  render() {
    const el = document.createElement('div');
    el.className = `block block-${this.type}`;
    el.dataset.blockId = this.id;
    return el;
  }

  /**
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      position: this.position,
      parentId: this.parentId,
      protected: this.protected,
      data: this.data
    };
  }
}

