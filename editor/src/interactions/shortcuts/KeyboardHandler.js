export class KeyboardHandler {
  constructor() {
    this.handlers = new Map();
    this.isEnabled = true;
  }

  /**
   * @param {string} key
   * @param {Function} handler
   * @param {Object} [options]
   */
  on(key, handler, options = {}) {
    const keyCombo = this.normalizeKey(key);
    if (!this.handlers.has(keyCombo)) {
      this.handlers.set(keyCombo, []);
    }
    this.handlers.get(keyCombo).push({ handler, options });
  }

  /**
   * @param {KeyboardEvent} e
   */
  handle(e) {
    if (!this.isEnabled) return;
    const keyCombo = this.buildKeyCombo(e);
    const handlers = this.handlers.get(keyCombo);
    if (handlers) {
      handlers.forEach(({ handler, options }) => {
        if (options.preventDefault !== false) {
          e.preventDefault();
        }
        handler(e);
      });
    }
  }

  /**
   * @param {KeyboardEvent} e
   * @returns {string}
   */
  buildKeyCombo(e) {
    const parts = [];
    if (e.ctrlKey || e.metaKey) parts.push('Ctrl');
    if (e.altKey) parts.push('Alt');
    if (e.shiftKey) parts.push('Shift');
    const key = e.key.length === 1 ? e.key.toUpperCase() : e.key;
    parts.push(key);
    return parts.join('+');
  }

  /**
   * @param {string} key
   * @returns {string}
   */
  normalizeKey(key) {
    let normalized = key.replace(/cmd/gi, 'Ctrl').replace(/meta/gi, 'Ctrl');
    // Нормализуем регистр: одиночные буквы в верхний регистр, остальное как есть
    const parts = normalized.split('+');
    if (parts.length > 0) {
      const lastPart = parts[parts.length - 1];
      if (lastPart.length === 1) {
        parts[parts.length - 1] = lastPart.toUpperCase();
      }
      normalized = parts.join('+');
    }
    return normalized;
  }

  enable() {
    this.isEnabled = true;
  }

  disable() {
    this.isEnabled = false;
  }
}

