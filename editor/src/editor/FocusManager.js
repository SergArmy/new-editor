export class FocusManager {
  constructor() {
    this.focusedBlock = null;
    this.focusedElement = null;
  }

  /**
   * @param {string} blockId
   * @param {HTMLElement} element
   */
  focus(blockId, element = null) {
    if (this.focusedElement) {
      this.focusedElement.classList.remove('focused');
    }
    this.focusedBlock = blockId;
    if (element) {
      this.focusedElement = element;
      element.classList.add('focused');
      element.focus();
    }
  }

  blur() {
    if (this.focusedElement) {
      this.focusedElement.classList.remove('focused');
      this.focusedElement.blur();
    }
    this.focusedBlock = null;
    this.focusedElement = null;
  }

  /**
   * @returns {string|null}
   */
  getFocused() {
    return this.focusedBlock;
  }
}

