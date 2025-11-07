import { MetadataLinkParser } from './MetadataLinkParser.js';
import { metadataRegistry } from './MetadataRegistry.js';
import { Tooltip } from '../../ui/components/Tooltip.js';
import { logger } from '../../utils/logger.js';

/**
 * @class MetadataLinkRenderer
 * @description Рендерит ссылки на объекты метаданных с дополнительной информацией
 */
export class MetadataLinkRenderer {
  constructor() {
    /** @type {Map<string, Tooltip>} */
    this.tooltips = new Map();
  }

  /**
   * Рендерит ссылку на метаданные
   * @param {HTMLElement} container - контейнер для ссылок
   * @param {string} text - текст со ссылками
   */
  render(container, text) {
    if (!text) {
      return;
    }

    // Очищаем контейнер
    container.innerHTML = '';

    // Парсим текст и создаем элементы
    const parts = this._parseTextWithLinks(text);
    
    parts.forEach(part => {
      if (part.isLink) {
        const linkElement = this._createLinkElement(part);
        container.appendChild(linkElement);
      } else {
        const textNode = document.createTextNode(part.text);
        container.appendChild(textNode);
      }
    });
  }

  /**
   * Парсит текст и разбивает на части (текст и ссылки)
   * @private
   * @param {string} text
   * @returns {Array<{text: string, isLink: boolean, link?: Object}>}
   */
  _parseTextWithLinks(text) {
    const parts = [];
    let lastIndex = 0;
    const regex = new RegExp(MetadataLinkParser.METADATA_LINK_REGEX);
    let match;

    while ((match = regex.exec(text)) !== null) {
      // Добавляем текст до ссылки
      if (match.index > lastIndex) {
        parts.push({
          text: text.substring(lastIndex, match.index),
          isLink: false
        });
      }

      // Добавляем ссылку
      const link = MetadataLinkParser.parseLink(match[0]);
      if (link) {
        parts.push({
          text: link.displayName,
          isLink: true,
          link
        });
      }

      lastIndex = match.index + match[0].length;
    }

    // Добавляем остаток текста
    if (lastIndex < text.length) {
      parts.push({
        text: text.substring(lastIndex),
        isLink: false
      });
    }

    return parts;
  }

  /**
   * Создает элемент ссылки
   * @private
   * @param {Object} part
   * @returns {HTMLElement}
   */
  _createLinkElement(part) {
    const link = document.createElement('a');
    link.href = part.link.href;
    link.className = 'metadata-link';
    link.setAttribute('data-type', part.link.type);
    link.setAttribute('data-name', part.link.name);
    link.textContent = part.text;

    // Добавляем иконку
    const icon = document.createElement('span');
    icon.className = 'metadata-link-icon';
    icon.textContent = '⚙'; // Можно заменить на SVG иконку
    link.insertBefore(icon, link.firstChild);

    // Добавляем tooltip с информацией
    this._attachTooltip(link, part.link);

    // Обработчик клика
    link.addEventListener('click', (e) => {
      e.preventDefault();
      this._handleLinkClick(part.link);
    });

    return link;
  }

  /**
   * Прикрепляет tooltip к ссылке
   * @private
   * @param {HTMLElement} element
   * @param {Object} link
   */
  _attachTooltip(element, link) {
    // Получаем информацию об объекте из реестра
    const metadataObj = metadataRegistry.get(link.type, link.name);
    
    let tooltipContent = `<div class="metadata-tooltip">
      <div class="metadata-tooltip-header">${link.displayName}</div>`;
    
    if (metadataObj) {
      if (metadataObj.description) {
        tooltipContent += `<div class="metadata-tooltip-description">${metadataObj.description}</div>`;
      }
      
      if (metadataObj.uuid) {
        tooltipContent += `<div class="metadata-tooltip-uuid">UUID: ${metadataObj.uuid}</div>`;
      }
    } else {
      tooltipContent += `<div class="metadata-tooltip-warning">⚠ Объект не найден в конфигурации</div>`;
    }
    
    tooltipContent += `</div>`;

    const tooltip = new Tooltip(element, {
      content: tooltipContent,
      placement: 'top',
      html: true
    });

    this.tooltips.set(`${link.type}:${link.name}`, tooltip);
  }

  /**
   * Обработчик клика по ссылке
   * @private
   * @param {Object} link
   */
  _handleLinkClick(link) {
    logger.log('Metadata link clicked:', link);
    
    // Эмитим событие для обработки приложением
    const event = new CustomEvent('metadata-link-click', {
      detail: link,
      bubbles: true
    });
    document.dispatchEvent(event);

    // Можно добавить дополнительную логику:
    // - Открыть панель с информацией об объекте
    // - Перейти к описанию объекта в документации
    // - Показать связанные объекты
  }

  /**
   * Очищает все tooltips
   */
  dispose() {
    this.tooltips.forEach(tooltip => tooltip.dispose && tooltip.dispose());
    this.tooltips.clear();
  }
}

