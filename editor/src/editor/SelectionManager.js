export class SelectionManager {
  constructor() {
    this.selectedBlocks = new Set();
    this.anchorBlock = null;
  }

  /**
   * @param {string} blockId
   */
  select(blockId) {
    this.selectedBlocks.clear();
    this.selectedBlocks.add(blockId);
    this.anchorBlock = blockId;
  }

  /**
   * @param {string} blockId
   */
  toggle(blockId) {
    if (this.selectedBlocks.has(blockId)) {
      this.selectedBlocks.delete(blockId);
    } else {
      this.selectedBlocks.add(blockId);
    }
    if (!this.anchorBlock) this.anchorBlock = blockId;
  }

  /**
   * @param {string} startId
   * @param {string} endId
   * @param {Function} [getBetweenIds] - функция для получения ID блоков между start и end
   */
  selectRange(startId, endId, getBetweenIds) {
    this.selectedBlocks.clear();
    const ids = getBetweenIds ? getBetweenIds(startId, endId) : [startId, endId];
    ids.forEach(id => this.selectedBlocks.add(id));
    this.anchorBlock = startId;
  }

  clear() {
    this.selectedBlocks.clear();
    this.anchorBlock = null;
  }

  /**
   * @param {string} blockId
   * @returns {boolean}
   */
  isSelected(blockId) {
    return this.selectedBlocks.has(blockId);
  }

  /**
   * @returns {string[]}
   */
  getSelected() {
    return Array.from(this.selectedBlocks);
  }

  /**
   * @returns {string|null}
   */
  getAnchor() {
    return this.anchorBlock;
  }
}

