/**
 * Утилита для загрузки CSS файлов для экспорта
 */
export class CssLoader {
  /**
   * Получает базовый URL для загрузки CSS файлов
   * @returns {string}
   */
  static getBaseUrl() {
    // Получаем базовый URL из текущего скрипта или документа
    if (typeof window !== 'undefined' && window.location) {
      const url = new URL(window.location.href);
      // Если путь содержит /editor/, используем его как базовый
      if (url.pathname.includes('/editor/')) {
        const editorIndex = url.pathname.indexOf('/editor/');
        return url.origin + url.pathname.substring(0, editorIndex + '/editor/'.length);
      }
      // Иначе используем корень текущего пути
      return url.origin + url.pathname.replace(/\/[^/]*$/, '') + '/';
    }
    return '';
  }

  /**
   * Загружает содержимое CSS файла
   * @param {string} path - путь к CSS файлу (может быть относительным или абсолютным)
   * @returns {Promise<string>}
   */
  static async loadCssFile(path) {
    try {
      // Если путь абсолютный (начинается с http:// или https://), используем его как есть
      // Если относительный, пытаемся найти файл относительно разных базовых путей
      let fullPath = path;
      
      if (!path.startsWith('http://') && !path.startsWith('https://') && !path.startsWith('/')) {
        // Относительный путь - пробуем разные варианты
        const baseUrl = this.getBaseUrl();
        const alternatives = [
          baseUrl + path,
          '/' + path,
          './' + path,
          '../' + path,
          path
        ];
        
        // Пробуем загрузить с разными путями
        for (const altPath of alternatives) {
          try {
            const response = await fetch(altPath);
            if (response.ok) {
              return await response.text();
            }
          } catch (e) {
            // Продолжаем пробовать другие пути
            continue;
          }
        }
      }
      
      // Если не нашли, пробуем загрузить исходный путь
      const response = await fetch(fullPath);
      if (!response.ok) {
        console.warn(`Failed to load CSS file: ${path} (tried: ${fullPath})`);
        return '';
      }
      return await response.text();
    } catch (error) {
      console.warn(`Error loading CSS file ${path}:`, error);
      return '';
    }
  }

  /**
   * Загружает все необходимые CSS файлы для экспорта
   * @param {Array<string>} paths - массив путей к CSS файлам
   * @returns {Promise<string>} - объединенное содержимое CSS файлов
   */
  static async loadCssFiles(paths) {
    const cssContents = await Promise.all(
      paths.map(path => this.loadCssFile(path))
    );
    return cssContents.filter(content => content).join('\n\n');
  }

  /**
   * Загружает CSS файлы и возвращает их содержимое (без фильтрации)
   * Просто загружаем все стили, а элементы редактора скроем отдельными правилами
   * @param {Array<string>} paths - пути к CSS файлам
   * @returns {Promise<string>} - содержимое CSS файлов
   */
  static async loadExportStyles(paths) {
    return await this.loadCssFiles(paths);
  }
}

