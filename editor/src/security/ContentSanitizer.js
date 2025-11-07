/**
 * ContentSanitizer - санитизация HTML контента для предотвращения XSS атак
 * 
 * Реализует whitelist подход: разрешены только безопасные теги и атрибуты
 * 
 * @module security/ContentSanitizer
 */

/**
 * Whitelist разрешенных HTML тегов
 * @type {Object<string, string[]>}
 */
const ALLOWED_TAGS = {
  // Базовое форматирование
  'strong': [],
  'b': [],
  'em': [],
  'i': [],
  'u': [],
  's': [],
  'del': [],
  'code': [],
  'pre': [],
  
  // Структура
  'p': [],
  'br': [],
  'div': [],
  'span': [],
  'blockquote': [],
  
  // Списки
  'ul': [],
  'ol': [],
  'li': [],
  
  // Заголовки
  'h1': [],
  'h2': [],
  'h3': [],
  'h4': [],
  'h5': [],
  'h6': [],
  
  // Ссылки
  'a': ['href', 'title', 'target', 'rel'],
  
  // Таблицы
  'table': [],
  'thead': [],
  'tbody': [],
  'tr': [],
  'th': ['colspan', 'rowspan'],
  'td': ['colspan', 'rowspan'],
  
  // Изображения
  'img': ['src', 'alt', 'title', 'width', 'height'],
  
  // Специальные символы
  'sub': [],
  'sup': [],
  'mark': [],
  'small': [],
  'abbr': ['title']
};

/**
 * Whitelist разрешенных атрибутов для всех тегов
 * @type {string[]}
 */
const ALLOWED_GLOBAL_ATTRIBUTES = ['class', 'id', 'data-block-id', 'data-theme'];

/**
 * Безопасные протоколы для ссылок и изображений
 * @type {string[]}
 */
const SAFE_PROTOCOLS = ['http:', 'https:', 'mailto:', '#'];

/**
 * ContentSanitizer - класс для санитизации HTML контента
 */
export class ContentSanitizer {
  /**
   * Санитизирует HTML строку, удаляя опасные элементы
   * 
   * @param {string} html - HTML строка для санитизации
   * @param {Object} [options={}] - Опции санитизации
   * @param {boolean} [options.allowImages=true] - Разрешить изображения
   * @param {boolean} [options.allowLinks=true] - Разрешить ссылки
   * @param {string[]} [options.additionalTags=[]] - Дополнительные разрешенные теги
   * @returns {string} - Санитизированный HTML
   */
  static sanitize(html, options = {}) {
    if (!html || typeof html !== 'string') {
      return '';
    }

    const {
      allowImages = true,
      allowLinks = true,
      additionalTags = []
    } = options;

    // Создаем временный контейнер для парсинга
    const temp = document.createElement('div');
    temp.innerHTML = html;

    // Рекурсивно обрабатываем все узлы
    this._sanitizeNode(temp, { allowImages, allowLinks, additionalTags });

    return temp.innerHTML;
  }

  /**
   * Рекурсивная санитизация DOM узла
   * 
   * @private
   * @param {Node} node - DOM узел для обработки
   * @param {Object} options - Опции санитизации
   */
  static _sanitizeNode(node, options) {
    // Обрабатываем все дочерние узлы в обратном порядке (чтобы не сломать индексы при удалении)
    for (let i = node.childNodes.length - 1; i >= 0; i--) {
      const child = node.childNodes[i];

      if (child.nodeType === Node.ELEMENT_NODE) {
        // Обрабатываем элемент
        this._sanitizeElement(child, options);
      } else if (child.nodeType === Node.TEXT_NODE) {
        // Текстовые узлы оставляем как есть
        continue;
      } else {
        // Удаляем все остальные типы узлов (комментарии, CDATA и т.д.)
        node.removeChild(child);
      }
    }
  }

  /**
   * Санитизация HTML элемента
   * 
   * @private
   * @param {Element} element - HTML элемент
   * @param {Object} options - Опции санитизации
   */
  static _sanitizeElement(element, options) {
    const tagName = element.tagName.toLowerCase();
    const allowedTags = { ...ALLOWED_TAGS };
    
    // Добавляем дополнительные теги если указаны
    if (options.additionalTags) {
      for (const tag of options.additionalTags) {
        if (!allowedTags[tag]) {
          allowedTags[tag] = [];
        }
      }
    }

    // Проверяем, разрешен ли тег
    if (!allowedTags[tagName]) {
      // Тег не разрешен - заменяем содержимым
      this._replaceWithContent(element);
      return;
    }

    // Проверяем специальные случаи
    if (tagName === 'a' && !options.allowLinks) {
      this._replaceWithContent(element);
      return;
    }

    if (tagName === 'img' && !options.allowImages) {
      element.remove();
      return;
    }

    // Санитизируем атрибуты
    this._sanitizeAttributes(element, tagName);

    // Рекурсивно обрабатываем дочерние элементы
    this._sanitizeNode(element, options);
  }

  /**
   * Санитизация атрибутов элемента
   * 
   * @private
   * @param {Element} element - HTML элемент
   * @param {string} tagName - Имя тега
   */
  static _sanitizeAttributes(element, tagName) {
    const allowedAttrs = [
      ...ALLOWED_TAGS[tagName] || [],
      ...ALLOWED_GLOBAL_ATTRIBUTES
    ];

    // Обрабатываем все атрибуты в обратном порядке
    const attrs = Array.from(element.attributes);
    for (const attr of attrs) {
      const attrName = attr.name.toLowerCase();

      // Проверяем, разрешен ли атрибут
      if (!allowedAttrs.includes(attrName)) {
        element.removeAttribute(attr.name);
        continue;
      }

      // Специальная обработка для опасных атрибутов
      if (attrName === 'href' || attrName === 'src') {
        if (!this._isSafeUrl(attr.value)) {
          element.removeAttribute(attr.name);
        }
      }

      // Удаляем JavaScript из атрибутов (onclick, onerror и т.д.)
      if (attrName.startsWith('on')) {
        element.removeAttribute(attr.name);
      }

      // Удаляем javascript: протокол из любых атрибутов
      if (attr.value && attr.value.toLowerCase().startsWith('javascript:')) {
        element.removeAttribute(attr.name);
      }
    }
  }

  /**
   * Проверяет, является ли URL безопасным
   * 
   * @private
   * @param {string} url - URL для проверки
   * @returns {boolean}
   */
  static _isSafeUrl(url) {
    if (!url || typeof url !== 'string') {
      return false;
    }

    // Якори разрешены
    if (url.startsWith('#')) {
      return true;
    }

    // Проверяем протокол
    try {
      const urlObj = new URL(url, window.location.href);
      return SAFE_PROTOCOLS.includes(urlObj.protocol);
    } catch (e) {
      // Если не удалось распарсить URL, считаем небезопасным
      return false;
    }
  }

  /**
   * Заменяет элемент его текстовым содержимым
   * 
   * @private
   * @param {Element} element - Элемент для замены
   */
  static _replaceWithContent(element) {
    const parent = element.parentNode;
    if (!parent) return;

    const textNode = document.createTextNode(element.textContent || '');
    parent.replaceChild(textNode, element);
  }

  /**
   * Санитизирует текст при вставке из буфера обмена
   * 
   * @param {string} text - Текст для санитизации
   * @param {Object} [options={}] - Опции санитизации
   * @returns {string} - Санитизированный текст
   */
  static sanitizePaste(text, options = {}) {
    if (!text || typeof text !== 'string') {
      return '';
    }

    // Если текст не содержит HTML, возвращаем как есть
    if (!text.includes('<')) {
      return text;
    }

    // Санитизируем HTML
    return this.sanitize(text, options);
  }

  /**
   * Проверяет, содержит ли HTML опасный контент
   * 
   * @param {string} html - HTML для проверки
   * @returns {boolean} - true если HTML содержит опасные элементы
   */
  static containsDangerousContent(html) {
    if (!html || typeof html !== 'string') {
      return false;
    }

    const dangerous = [
      /<script[\s>]/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe[\s>]/i,
      /<object[\s>]/i,
      /<embed[\s>]/i,
      /<form[\s>]/i
    ];

    return dangerous.some(pattern => pattern.test(html));
  }

  /**
   * Экранирует HTML специальные символы
   * 
   * @param {string} text - Текст для экранирования
   * @returns {string} - Экранированный текст
   */
  static escape(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }

    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };

    return text.replace(/[&<>"']/g, m => map[m]);
  }
}

