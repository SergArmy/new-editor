export class Button {
  /**
   * @param {Object} options
   * @param {string} [options.text]
   * @param {string} [options.icon]
   * @param {Function} [options.onClick]
   * @param {boolean} [options.disabled]
   * @param {string} [options.className]
   */
  constructor(options = {}) {
    this.text = options.text || '';
    this.icon = options.icon || '';
    this.onClick = options.onClick || null;
    this.disabled = options.disabled || false;
    this.className = options.className || '';
  }

  /**
   * @returns {HTMLElement}
   */
  render() {
    const btn = document.createElement('button');
    btn.className = `btn ${this.className}`;
    btn.disabled = this.disabled;
    if (this.icon) {
      const iconEl = document.createElement('span');
      iconEl.className = `icon ${this.icon}`;
      btn.appendChild(iconEl);
    }
    if (this.text) {
      btn.appendChild(document.createTextNode(this.text));
    }
    if (this.onClick) {
      btn.addEventListener('click', this.onClick);
    }
    return btn;
  }
}

