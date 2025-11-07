import { Button } from '../components/Button.js';

export class ToolbarButton extends Button {
  /**
   * @param {Object} options
   * @param {string} options.icon
   * @param {string} [options.tooltip]
   * @param {Function} [options.onClick]
   * @param {boolean} [options.active]
   */
  constructor(options = {}) {
    super({
      icon: options.icon,
      onClick: options.onClick,
      className: `toolbar-button ${options.active ? 'active' : ''}`
    });
    this.tooltip = options.tooltip || '';
    this.active = options.active || false;
  }

  render() {
    const btn = super.render();
    if (this.tooltip) {
      btn.title = this.tooltip;
      btn.setAttribute('aria-label', this.tooltip);
    }
    if (this.active) {
      btn.classList.add('active');
    }
    return btn;
  }

  setActive(active) {
    this.active = active;
    const btn = this.render();
    if (this.active) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  }
}

