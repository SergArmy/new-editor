export class Dropdown {
  /**
   * @param {Object} options
   * @param {Array<{label: string, value: any, onClick?: Function}>} options.items
   * @param {string} [options.placeholder]
   */
  constructor(options = {}) {
    this.items = options.items || [];
    this.placeholder = options.placeholder || 'Select...';
    this.isOpen = false;
    this.selected = null;
  }

  /**
   * @returns {HTMLElement}
   */
  render() {
    const container = document.createElement('div');
    container.className = 'dropdown';
    
    const trigger = document.createElement('button');
    trigger.className = 'dropdown-trigger';
    trigger.textContent = this.selected?.label || this.placeholder;
    trigger.addEventListener('click', () => this.toggle(container));
    
    const menu = document.createElement('div');
    menu.className = 'dropdown-menu';
    menu.style.display = 'none';
    this.items.forEach(item => {
      const itemEl = document.createElement('div');
      itemEl.className = 'dropdown-item';
      itemEl.textContent = item.label;
      itemEl.addEventListener('click', () => {
        this.select(item, container);
        if (item.onClick) item.onClick(item.value);
      });
      menu.appendChild(itemEl);
    });
    
    container.appendChild(trigger);
    container.appendChild(menu);
    return container;
  }

  /**
   * @param {HTMLElement} container
   */
  toggle(container) {
    this.isOpen = !this.isOpen;
    const menu = container.querySelector('.dropdown-menu');
    menu.style.display = this.isOpen ? 'block' : 'none';
  }

  /**
   * @param {Object} item
   * @param {HTMLElement} container
   */
  select(item, container) {
    this.selected = item;
    const trigger = container.querySelector('.dropdown-trigger');
    trigger.textContent = item.label;
    this.isOpen = false;
    const menu = container.querySelector('.dropdown-menu');
    menu.style.display = 'none';
  }
}

