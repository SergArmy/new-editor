export class MultiSelect {
  constructor() {
    this.selected = new Set();
    this.anchor = null;
  }

  /**
   * @param {string} id
   */
  select(id) {
    this.selected.clear();
    this.selected.add(id);
    this.anchor = id;
  }

  /**
   * @param {string} id
   */
  toggle(id) {
    if (this.selected.has(id)) {
      this.selected.delete(id);
    } else {
      this.selected.add(id);
    }
    if (!this.anchor) this.anchor = id;
  }

  /**
   * @param {string} startId
   * @param {string} endId
   * @param {Function} getBetweenIds
   */
  selectRange(startId, endId, getBetweenIds) {
    this.selected.clear();
    const ids = getBetweenIds ? getBetweenIds(startId, endId) : [startId, endId];
    ids.forEach(id => this.selected.add(id));
    this.anchor = startId;
  }

  clear() {
    this.selected.clear();
    this.anchor = null;
  }

  /**
   * @returns {string[]}
   */
  getSelected() {
    return Array.from(this.selected);
  }

  /**
   * @param {string} id
   * @returns {boolean}
   */
  isSelected(id) {
    return this.selected.has(id);
  }
}

