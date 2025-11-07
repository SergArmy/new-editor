export class ThemeManager {
  constructor() {
    this.currentTheme = 'light';
    this.themes = new Map();
  }

  /**
   * @param {string} name
   * @param {Object} theme
   */
  registerTheme(name, theme) {
    this.themes.set(name, theme);
  }

  /**
   * @param {string} name
   */
  setTheme(name) {
    if (!this.themes.has(name)) {
      throw new Error(`Theme ${name} not found`);
    }
    
    this.currentTheme = name;
    const theme = this.themes.get(name);
    const root = document.documentElement;
    
    // Применяем CSS переменные
    Object.entries(theme.variables || {}).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });
    
    root.setAttribute('data-theme', name);
    localStorage.setItem('editor-theme', name);
  }

  /**
   * @returns {string}
   */
  getTheme() {
    return this.currentTheme;
  }

  /**
   * Загружает сохраненную тему из localStorage
   */
  loadSavedTheme() {
    const saved = localStorage.getItem('editor-theme');
    if (saved && this.themes.has(saved)) {
      this.setTheme(saved);
    }
  }
}

