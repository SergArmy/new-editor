export class Tooltip {
  /**
   * @param {HTMLElement} target
   * @param {string} text
   * @param {Object} [options]
   */
  constructor(target, text, options = {}) {
    this.target = target;
    this.text = text;
    this.position = options.position || 'top';
    this.tooltipEl = null;
  }

  show() {
    if (this.tooltipEl) return;
    
    this.tooltipEl = document.createElement('div');
    this.tooltipEl.className = `tooltip tooltip-${this.position}`;
    this.tooltipEl.textContent = this.text;
    document.body.appendChild(this.tooltipEl);
    
    this.updatePosition();
    
    this.target.addEventListener('mouseleave', () => this.hide());
  }

  hide() {
    if (this.tooltipEl) {
      this.tooltipEl.remove();
      this.tooltipEl = null;
    }
  }

  updatePosition() {
    if (!this.tooltipEl) return;
    
    const rect = this.target.getBoundingClientRect();
    const tooltipRect = this.tooltipEl.getBoundingClientRect();
    
    let top, left;
    switch (this.position) {
      case 'top':
        top = rect.top - tooltipRect.height - 8;
        left = rect.left + (rect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = rect.bottom + 8;
        left = rect.left + (rect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = rect.top + (rect.height - tooltipRect.height) / 2;
        left = rect.left - tooltipRect.width - 8;
        break;
      case 'right':
        top = rect.top + (rect.height - tooltipRect.height) / 2;
        left = rect.right + 8;
        break;
    }
    
    this.tooltipEl.style.top = `${top}px`;
    this.tooltipEl.style.left = `${left}px`;
  }
}

