export class DropZone {
  /**
   * @param {HTMLElement} element
   * @param {Function} onDrop
   */
  constructor(element, onDrop) {
    this.element = element;
    this.onDrop = onDrop;
    this.isActive = false;
  }

  activate() {
    this.isActive = true;
    this.element.classList.add('drop-zone-active');
  }

  deactivate() {
    this.isActive = false;
    this.element.classList.remove('drop-zone-active');
  }

  /**
   * @param {Object} data
   */
  handleDrop(data) {
    if (this.isActive && this.onDrop) {
      this.onDrop(data);
    }
  }
}

