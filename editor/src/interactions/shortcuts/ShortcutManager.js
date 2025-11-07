import { KeyboardHandler } from './KeyboardHandler.js';

export class ShortcutManager {
  constructor() {
    this.handler = new KeyboardHandler();
    this.setupGlobalListeners();
  }

  setupGlobalListeners() {
    document.addEventListener('keydown', (e) => {
      this.handler.handle(e);
    });
  }

  /**
   * @param {string} shortcut
   * @param {Function} callback
   * @param {Object} [options]
   */
  register(shortcut, callback, options = {}) {
    this.handler.on(shortcut, callback, options);
  }

  enable() {
    this.handler.enable();
  }

  disable() {
    this.handler.disable();
  }
}

