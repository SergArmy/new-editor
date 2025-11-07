export class SelectionRenderer {
  /**
   * @param {HTMLElement} element
   * @param {boolean} selected
   */
  static render(element, selected) {
    if (selected) {
      element.classList.add('selected');
    } else {
      element.classList.remove('selected');
    }
  }

  /**
   * @param {HTMLElement[]} elements
   * @param {Set<string>} selectedIds
   */
  static renderAll(elements, selectedIds) {
    elements.forEach(el => {
      const id = el.dataset.blockId;
      this.render(el, selectedIds.has(id));
    });
  }
}

