export class LinkManager {
  /**
   * Создает HTML строку ссылки
   * @param {string} text
   * @param {string} href
   * @param {string} [type] - external, internal, anchor, metadata
   * @returns {string}
   */
  static createLink(text, href, type = 'external') {
    const classes = `link link-${type}`;
    if (type === 'metadata') {
      // Ссылка на метаданные 1С
      return `<a href="${href}" class="${classes}" data-metadata="true">${text}</a>`;
    }
    return `<a href="${href}" class="${classes}">${text}</a>`;
  }

  /**
   * Извлекает URL из текста
   * @param {string} text
   * @returns {string|null}
   */
  static extractUrl(text) {
    const urlRegex = /https?:\/\/[^\s]+/g;
    const match = text.match(urlRegex);
    return match ? match[0] : null;
  }

  /**
   * Вставляет ссылку в contentEditable элемент
   * @param {HTMLElement} element - contentEditable элемент
   * @param {string} text - текст ссылки
   * @param {string} href - URL ссылки
   * @param {string} [type] - тип ссылки (external, internal, anchor, metadata)
   * @returns {boolean} - успешно ли вставлена ссылка
   */
  static insertLink(element, text, href, type = 'external') {
    if (!element || !element.isContentEditable) {
      return false;
    }

    const selection = window.getSelection();
    if (selection.rangeCount === 0) {
      // Если нет selection, создаем range в конце элемента
      const range = document.createRange();
      range.selectNodeContents(element);
      range.collapse(false); // В конец
      selection.removeAllRanges();
      selection.addRange(range);
    }

    const range = selection.getRangeAt(0);
    
    try {
      // Если есть выделение, заменяем его на ссылку
      if (!range.collapsed) {
        range.deleteContents();
      }

      // Создаем элемент ссылки
      const link = document.createElement('a');
      link.href = href;
      link.textContent = text;
      link.className = `link link-${type}`;
      
      if (type === 'metadata') {
        link.setAttribute('data-metadata', 'true');
      }

      // Вставляем ссылку
      range.insertNode(link);
      
      // Устанавливаем курсор после ссылки
      range.setStartAfter(link);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);

      return true;
    } catch (e) {
      console.warn('Failed to insert link:', e);
      return false;
    }
  }

  /**
   * Обновляет существующую ссылку
   * @param {HTMLAnchorElement} linkElement - элемент ссылки
   * @param {string} text - новый текст ссылки
   * @param {string} href - новый URL
   * @param {string} [type] - новый тип ссылки
   * @returns {boolean} - успешно ли обновлена ссылка
   */
  static updateLink(linkElement, text, href, type = 'external') {
    if (!linkElement || linkElement.tagName !== 'A') {
      return false;
    }

    try {
      linkElement.href = href;
      linkElement.textContent = text;
      linkElement.className = `link link-${type}`;
      
      if (type === 'metadata') {
        linkElement.setAttribute('data-metadata', 'true');
      } else {
        linkElement.removeAttribute('data-metadata');
      }

      return true;
    } catch (e) {
      console.warn('Failed to update link:', e);
      return false;
    }
  }

  /**
   * Получает информацию о ссылке из элемента
   * @param {HTMLAnchorElement} linkElement - элемент ссылки
   * @returns {Object|null} - объект с text, href, type или null
   */
  static getLinkInfo(linkElement) {
    if (!linkElement || linkElement.tagName !== 'A') {
      return null;
    }

    const href = linkElement.getAttribute('href') || '';
    const text = linkElement.textContent || '';
    const isMetadata = linkElement.hasAttribute('data-metadata');
    
    // Определяем тип по классам или атрибутам
    let type = 'external';
    if (isMetadata) {
      type = 'metadata';
    } else if (linkElement.classList.contains('link-internal')) {
      type = 'internal';
    } else if (linkElement.classList.contains('link-anchor')) {
      type = 'anchor';
    } else if (linkElement.classList.contains('link-external')) {
      type = 'external';
    } else if (href.startsWith('#')) {
      type = 'anchor';
    } else if (href.startsWith('metadata:')) {
      type = 'metadata';
    } else if (!href.startsWith('http://') && !href.startsWith('https://')) {
      type = 'internal';
    }

    return { text, href, type };
  }

  /**
   * Проверяет, находится ли курсор внутри ссылки
   * @param {HTMLElement} element - contentEditable элемент
   * @returns {HTMLAnchorElement|null} - элемент ссылки или null
   */
  static getLinkAtCursor(element) {
    if (!element || !element.isContentEditable) {
      return null;
    }

    const selection = window.getSelection();
    if (selection.rangeCount === 0) {
      return null;
    }

    const range = selection.getRangeAt(0);
    let node = range.startContainer;

    // Если курсор в текстовом узле, ищем родительскую ссылку
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentElement;
    }

    // Ищем ближайший элемент <a>
    while (node && node !== element) {
      if (node.tagName === 'A') {
        return node;
      }
      node = node.parentElement;
    }

    return null;
  }
}

