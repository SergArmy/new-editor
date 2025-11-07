/**
 * InlineFormatManager - управляет inline форматированием в contentEditable элементах
 * Поддерживает жирный, курсив, ссылки и другие форматы
 */
export class InlineFormatManager {
  /**
   * Применяет форматирование к выделенному тексту
   * @param {HTMLElement} element - contentEditable элемент
   * @param {string} format - тип форматирования ('bold', 'italic', 'underline', 'strikethrough', 'code')
   * @param {boolean} useExecCommand - использовать execCommand (по умолчанию false)
   * @returns {boolean} - успешно ли применено форматирование
   */
  static applyFormat(element, format, useExecCommand = false) {
    if (!element || !element.isContentEditable) {
      return false;
    }

    const selection = window.getSelection();
    if (selection.rangeCount === 0) {
      return false;
    }

    const range = selection.getRangeAt(0);
    
    // Если нет выделения, ничего не делаем
    if (range.collapsed) {
      return false;
    }

    try {
      if (useExecCommand) {
        // Используем document.execCommand (создает свою историю)
        document.execCommand(format, false, null);
        return true;
      } else {
        // Создаем элемент форматирования напрямую (без истории execCommand)
        const tagMap = {
          'bold': 'strong',
          'italic': 'em',
          'underline': 'u',
          'strikethrough': 's',
          'code': 'code'
        };
        
        const tag = tagMap[format];
        if (!tag) {
          return false;
        }
        
        // Извлекаем содержимое выделения
        const fragment = range.extractContents();
        
        // Создаем элемент форматирования
        const formatElement = document.createElement(tag);
        formatElement.appendChild(fragment);
        
        // Вставляем отформатированный элемент
        range.insertNode(formatElement);
        
        // Устанавливаем курсор после элемента
        range.setStartAfter(formatElement);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        
        return true;
      }
    } catch (e) {
      console.warn('Failed to apply format:', e);
      return false;
    }
  }

  /**
   * Переключает форматирование (включает/выключает)
   * @param {HTMLElement} element - contentEditable элемент
   * @param {string} format - тип форматирования
   * @param {boolean} useExecCommand - использовать execCommand (по умолчанию true для совместимости с клавиатурными сочетаниями)
   * @returns {boolean} - успешно ли переключено форматирование
   */
  static toggleFormat(element, format, useExecCommand = true) {
    if (!element || !element.isContentEditable) {
      return false;
    }

    const selection = window.getSelection();
    if (selection.rangeCount === 0) {
      return false;
    }

    try {
      if (useExecCommand) {
        // Используем document.execCommand (для клавиатурных сочетаний)
        // Проверяем, применено ли уже форматирование
        const isActive = document.queryCommandState(format);
        
        // Переключаем форматирование
        document.execCommand(format, false, null);
        return true;
      } else {
        // Используем прямое создание элементов (без истории execCommand)
        return this.applyFormat(element, format, false);
      }
    } catch (e) {
      console.warn('Failed to toggle format:', e);
      return false;
    }
  }

  /**
   * Создает ссылку из выделенного текста
   * @param {HTMLElement} element - contentEditable элемент
   * @param {string} url - URL ссылки
   * @param {string} [text] - текст ссылки (если не указан, используется выделенный текст)
   * @returns {boolean} - успешно ли создана ссылка
   */
  static createLink(element, url, text = null) {
    if (!element || !element.isContentEditable) {
      return false;
    }

    const selection = window.getSelection();
    if (selection.rangeCount === 0) {
      return false;
    }

    const range = selection.getRangeAt(0);
    
    // Если нет выделения и не указан текст, ничего не делаем
    if (range.collapsed && !text) {
      return false;
    }

    try {
      // Если указан текст, вставляем его
      if (text && range.collapsed) {
        const textNode = document.createTextNode(text);
        range.insertNode(textNode);
        range.selectNodeContents(textNode);
        selection.removeAllRanges();
        selection.addRange(range);
      }

      // Создаем ссылку
      document.execCommand('createLink', false, url);
      
      // Добавляем классы к созданной ссылке
      const links = element.querySelectorAll('a[href="' + url + '"]');
      links.forEach(link => {
        link.classList.add('link', 'link-external');
      });

      return true;
    } catch (e) {
      console.warn('Failed to create link:', e);
      return false;
    }
  }

  /**
   * Автоматически создает ссылки из URL в тексте
   * @param {HTMLElement} element - contentEditable элемент
   * @returns {number} - количество созданных ссылок
   */
  static autoLinkUrls(element) {
    if (!element || !element.isContentEditable) {
      return 0;
    }

    const text = element.textContent || '';
    const urlRegex = /https?:\/\/[^\s]+/g;
    const urls = text.match(urlRegex);
    
    if (!urls || urls.length === 0) {
      return 0;
    }

    let linkCount = 0;
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node);
    }

    textNodes.forEach(textNode => {
      const nodeText = textNode.textContent;
      const matches = [...nodeText.matchAll(urlRegex)];
      
      if (matches.length > 0) {
        // Проверяем, не является ли уже ссылкой
        let parent = textNode.parentElement;
        while (parent && parent !== element) {
          if (parent.tagName === 'A') {
            return; // Уже ссылка, пропускаем
          }
          parent = parent.parentElement;
        }

        // Создаем ссылки в обратном порядке, чтобы не сбить индексы
        for (let i = matches.length - 1; i >= 0; i--) {
          const match = matches[i];
          const url = match[0];
          const startIndex = match.index;
          const endIndex = startIndex + url.length;

          // Разделяем текстовый узел
          const beforeText = nodeText.substring(0, startIndex);
          const linkText = nodeText.substring(startIndex, endIndex);
          const afterText = nodeText.substring(endIndex);

          // Создаем элементы
          const link = document.createElement('a');
          link.href = url;
          link.textContent = linkText;
          link.classList.add('link', 'link-external');

          // Заменяем текстовый узел
          if (beforeText) {
            const beforeNode = document.createTextNode(beforeText);
            textNode.parentNode.insertBefore(beforeNode, textNode);
          }
          textNode.parentNode.insertBefore(link, textNode);
          if (afterText) {
            const afterNode = document.createTextNode(afterText);
            textNode.parentNode.insertBefore(afterNode, textNode);
          }
          textNode.remove();

          linkCount++;
        }
      }
    });

    return linkCount;
  }

  /**
   * Применяет форматирование из markdown-шортката
   * @param {HTMLElement} element - contentEditable элемент
   * @param {string} format - тип форматирования ('bold', 'italic')
   * @param {number} start - начальная позиция
   * @param {number} end - конечная позиция
   * @returns {boolean} - успешно ли применено форматирование
   */
  static applyFormatToRange(element, format, start, end) {
    if (!element || !element.isContentEditable) {
      return false;
    }

    try {
      const selection = window.getSelection();
      const range = document.createRange();
      
      // Находим текстовые узлы и позиции
      const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );

      let currentPos = 0;
      let startNode = null;
      let startOffset = 0;
      let endNode = null;
      let endOffset = 0;

      let node;
      while (node = walker.nextNode()) {
        const nodeLength = node.textContent.length;
        
        if (!startNode && currentPos + nodeLength >= start) {
          startNode = node;
          startOffset = start - currentPos;
        }
        
        if (!endNode && currentPos + nodeLength >= end) {
          endNode = node;
          endOffset = end - currentPos;
          break;
        }
        
        currentPos += nodeLength;
      }

      if (startNode && endNode) {
        range.setStart(startNode, startOffset);
        range.setEnd(endNode, endOffset);
        selection.removeAllRanges();
        selection.addRange(range);
        
        // Применяем форматирование
        document.execCommand(format, false, null);
        return true;
      }

      return false;
    } catch (e) {
      console.warn('Failed to apply format to range:', e);
      return false;
    }
  }

  /**
   * Получает HTML содержимое элемента с форматированием
   * @param {HTMLElement} element - contentEditable элемент
   * @returns {string} - HTML содержимое
   */
  static getHTML(element) {
    if (!element) {
      return '';
    }
    return element.innerHTML || '';
  }

  /**
   * Устанавливает HTML содержимое элемента
   * @param {HTMLElement} element - contentEditable элемент
   * @param {string} html - HTML содержимое
   */
  static setHTML(element, html) {
    if (!element) {
      return;
    }
    element.innerHTML = html || '';
  }
}

