export class ToolbarGroup {
  /**
   * @param {Object} options
   * @param {string} [options.label]
   */
  constructor(options = {}) {
    this.label = options.label || '';
    this.buttons = [];
  }

  /**
   * @param {HTMLElement} button
   */
  addButton(button) {
    this.buttons.push(button);
  }

  /**
   * @returns {HTMLElement}
   */
  render() {
    const group = document.createElement('div');
    group.className = 'toolbar-group';
    if (this.label) {
      const labelEl = document.createElement('span');
      labelEl.className = 'toolbar-group-label';
      labelEl.textContent = this.label;
      group.appendChild(labelEl);
    }
    this.buttons.forEach(btn => {
      group.appendChild(btn);
    });
    return group;
  }
}

