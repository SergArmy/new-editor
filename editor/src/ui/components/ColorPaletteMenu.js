let activePalette = null;

const DEFAULT_COLORS = ['#2563EB', '#7C3AED', '#F97316', '#059669', '#DB2777', '#0EA5E9', '#D97706', '#0F172A'];

/**
 * @param {{
 *   anchor?: HTMLElement,
 *   triggerEvent?: MouseEvent | PointerEvent | KeyboardEvent,
 *   colors?: string[],
 *   currentColor?: string,
 *   onSelect?: (color: string) => void,
 *   title?: string
 * }} options
 */
export function openColorPalette(options = {}) {
  if (activePalette) {
    closeColorPalette();
  }

  const palette = new ColorPaletteMenu(options);
  palette.open();
  activePalette = palette;
  return palette;
}

export function closeColorPalette() {
  if (!activePalette) {
    return;
  }
  activePalette.destroy();
  activePalette = null;
}

class ColorPaletteMenu {
  constructor(options) {
    this.options = this.#normalizeOptions(options);
    this.root = null;
    this.abortController = null;
  }

  open() {
    this.root = this.#createRoot();
    document.body.appendChild(this.root);
    this.#position();
    requestAnimationFrame(() => {
      if (this.root) {
        this.root.classList.add('is-visible');
      }
    });
    this.#bindListeners();
  }

  destroy() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    if (this.root) {
      this.root.classList.remove('is-visible');
      this.root.remove();
      this.root = null;
    }
    if (activePalette === this) {
      activePalette = null;
    }
  }

  #createRoot() {
    const container = document.createElement('div');
    container.className = 'color-palette-menu';
    container.setAttribute('role', 'dialog');
    container.setAttribute('aria-label', this.options.title || 'Выбор цвета');

    const title = document.createElement('div');
    title.className = 'color-palette-title';
    title.textContent = this.options.title || 'Выберите цвет';
    container.appendChild(title);

    const grid = document.createElement('div');
    grid.className = 'color-palette-grid';

    this.options.colors.forEach((color) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'color-palette-option';
      button.style.setProperty('--palette-color', color);
      button.dataset.color = color;
      if (this.options.currentColor && this.options.currentColor.toLowerCase() === color.toLowerCase()) {
        button.classList.add('is-active');
      }
      button.addEventListener('click', () => {
        if (typeof this.options.onSelect === 'function') {
          this.options.onSelect(color);
        }
        closeColorPalette();
      });
      button.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          button.click();
        }
      });
      grid.appendChild(button);
    });

    container.appendChild(grid);
    return container;
  }

  #bindListeners() {
    this.abortController = new AbortController();
    const { signal } = this.abortController;

    document.addEventListener('mousedown', (event) => {
      if (!this.root || !(event.target instanceof Node)) {
        return;
      }
      if (!this.root.contains(event.target)) {
        closeColorPalette();
      }
    }, { signal, capture: true });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeColorPalette();
      }
    }, { signal, capture: true });
  }

  #position() {
    if (!this.root) {
      return;
    }

    const anchorRect = this.options.anchor?.getBoundingClientRect();
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;

    if (anchorRect) {
      x = anchorRect.left + anchorRect.width / 2;
      y = anchorRect.bottom + 8;
    } else if (this.options.triggerEvent && 'clientX' in this.options.triggerEvent) {
      x = this.options.triggerEvent.clientX;
      y = this.options.triggerEvent.clientY + 8;
    }

    const paletteRect = this.root.getBoundingClientRect();
    let left = Math.max(12, x - paletteRect.width / 2);
    let top = Math.max(12, y);

    if (left + paletteRect.width > window.innerWidth - 12) {
      left = window.innerWidth - paletteRect.width - 12;
    }
    if (top + paletteRect.height > window.innerHeight - 12) {
      top = Math.max(12, window.innerHeight - paletteRect.height - 12);
    }

    this.root.style.left = `${left}px`;
    this.root.style.top = `${top}px`;
  }

  #normalizeOptions(options) {
    const palette = Array.isArray(options.colors) && options.colors.length > 0
      ? [...options.colors]
      : [...DEFAULT_COLORS];

    return {
      anchor: options.anchor || null,
      triggerEvent: options.triggerEvent || null,
      onSelect: typeof options.onSelect === 'function' ? options.onSelect : null,
      colors: palette,
      currentColor: options.currentColor || null,
      title: options.title || 'Выбор цвета'
    };
  }
}
