export class Modal {
  /**
   * @param {Object} options
   * @param {string} [options.title]
   * @param {HTMLElement|string} [options.content]
   * @param {Function} [options.onClose]
   */
  constructor(options = {}) {
    this.title = options.title || '';
    this.content = options.content || '';
    this.onClose = options.onClose || null;
    this.overlay = null;
  }

  /**
   * @returns {HTMLElement}
   */
  render() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    
    const header = document.createElement('div');
    header.className = 'modal-header';
    const title = document.createElement('h2');
    title.textContent = this.title;
    header.appendChild(title);
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'modal-close';
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', () => this.close(overlay));
    header.appendChild(closeBtn);
    
    const body = document.createElement('div');
    body.className = 'modal-body';
    if (typeof this.content === 'string') {
      body.innerHTML = this.content;
    } else if (this.content instanceof HTMLElement) {
      body.appendChild(this.content);
    }
    
    modal.appendChild(header);
    modal.appendChild(body);
    overlay.appendChild(modal);
    
    overlay.addEventListener('click', (e) => {
      // Закрываем только при клике именно на overlay, а не на модальное окно
      if (e.target === overlay) {
        this.close(overlay);
      }
    });
    
    return overlay;
  }

  /**
   * @param {HTMLElement} [overlay]
   */
  close(overlay = null) {
    const target = overlay || this.overlay;
    if (target) {
      target.remove();
      this.overlay = null;
      if (this.onClose) this.onClose();
    }
  }

  /**
   * Скрывает модальное окно
   */
  hide() {
    this.close();
  }

  /**
   * @param {HTMLElement} container
   */
  show(container = document.body) {
    if (this.overlay) {
      // Если уже показано, просто возвращаемся
      return;
    }
    this.overlay = this.render();
    container.appendChild(this.overlay);
  }
}

