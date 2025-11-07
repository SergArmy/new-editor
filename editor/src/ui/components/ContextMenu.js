export class ContextMenu {
  /**
   * @param {Array<{label: string, onClick: Function, disabled?: boolean}>} items
   */
  constructor(items = []) {
    this.items = items;
    this.menuEl = null;
  }

  /**
   * @param {number} x
   * @param {number} y
   */
  show(x, y) {
    if (this.menuEl) this.hide();
    
    this.menuEl = document.createElement('div');
    this.menuEl.className = 'context-menu';
    this.menuEl.style.left = `${x}px`;
    this.menuEl.style.top = `${y}px`;
    
    this.items.forEach(item => {
      const itemEl = document.createElement('div');
      itemEl.className = `context-menu-item ${item.disabled ? 'disabled' : ''}`;
      itemEl.textContent = item.label;
      if (!item.disabled) {
        itemEl.addEventListener('click', () => {
          item.onClick();
          this.hide();
        });
      }
      this.menuEl.appendChild(itemEl);
    });
    
    document.body.appendChild(this.menuEl);
    
    // Закрываем меню при клике вне его
    const clickHandler = (e) => {
      if (this.menuEl && !this.menuEl.contains(e.target)) {
        this.hide();
        document.removeEventListener('click', clickHandler);
        document.removeEventListener('contextmenu', clickHandler);
      }
    };
    
    // Закрываем меню при правом клике вне его
    const contextMenuHandler = (e) => {
      if (this.menuEl && !this.menuEl.contains(e.target)) {
        this.hide();
        document.removeEventListener('click', clickHandler);
        document.removeEventListener('contextmenu', contextMenuHandler);
      }
    };
    
    // Используем setTimeout, чтобы не закрыть меню сразу после открытия
    setTimeout(() => {
      document.addEventListener('click', clickHandler);
      document.addEventListener('contextmenu', contextMenuHandler);
    }, 100);
  }

  hide() {
    if (this.menuEl) {
      this.menuEl.remove();
      this.menuEl = null;
    }
  }
}

