export class DragPreview {
  constructor() {
    this.preview = null;
  }

  /**
   * @param {HTMLElement} element
   * @param {number} x
   * @param {number} y
   */
  create(element, x, y) {
    this.preview = element.cloneNode(true);
    this.preview.style.position = 'fixed';
    this.preview.style.pointerEvents = 'none';
    this.preview.style.opacity = '0.5';
    this.preview.style.zIndex = '10000';
    this.preview.style.left = x + 'px';
    this.preview.style.top = y + 'px';
    document.body.appendChild(this.preview);
    return this.preview;
  }

  /**
   * @param {number} x
   * @param {number} y
   */
  update(x, y) {
    if (this.preview) {
      this.preview.style.left = x + 'px';
      this.preview.style.top = y + 'px';
    }
  }

  remove() {
    if (this.preview) {
      document.body.removeChild(this.preview);
      this.preview = null;
    }
  }
}

