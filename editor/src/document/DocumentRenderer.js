import { BlockRenderer } from '../blocks/base/BlockRenderer.js';

/**
 * DocumentRenderer - отвечает за рендеринг всего документа
 * Использует BlockRenderer для рендеринга отдельных блоков
 */
export class DocumentRenderer {
  /**
   * @param {BlockRenderer} blockRenderer
   * @param {HTMLElement} container
   */
  constructor(blockRenderer, container) {
    this.blockRenderer = blockRenderer;
    this.container = container;
    this._blockElements = new Map(); // Map<blockId, HTMLElement>
  }

  /**
   * Рендерит весь документ
   * @param {Document} document
   */
  render(document) {
    if (!document || !document.blocks) {
      this.container.innerHTML = '';
      this._blockElements.clear();
      return;
    }

    // Сортируем блоки по position
    const sortedBlocks = [...document.blocks].sort((a, b) => a.position - b.position);

    // Очищаем контейнер
    this.container.innerHTML = '';
    this._blockElements.clear();

    // Рендерим все блоки
    sortedBlocks.forEach(blockData => {
      const blockElement = this.blockRenderer.render(blockData);
      if (blockElement) {
        blockElement.setAttribute('data-block-id', blockData.id);
        blockElement.classList.add('document-block');
        this.container.appendChild(blockElement);
        this._blockElements.set(blockData.id, blockElement);
      }
    });
  }

  /**
   * Рендерит один блок и добавляет его в документ
   * @param {Object} blockData
   * @param {number} [domIndex] - индекс для вставки в DOM (если не указан, добавляется в конец)
   */
  renderBlock(blockData, domIndex = undefined) {
    const blockElement = this.blockRenderer.render(blockData);
    if (!blockElement) return null;

    blockElement.setAttribute('data-block-id', blockData.id);
    blockElement.classList.add('document-block');

    if (domIndex !== undefined && domIndex >= 0) {
      // Вставляем на определенную позицию
      // ВАЖНО: фильтруем только блоки, исключая drop-zone-indicator
      const existingBlocks = Array.from(this.container.children)
        .filter(el => !el.classList.contains('drop-zone-indicator'));

      if (domIndex >= existingBlocks.length) {
        // Вставляем в конец, но после последнего блока (не после drop zone)
        if (existingBlocks.length > 0) {
          const lastBlock = existingBlocks[existingBlocks.length - 1];
          // Вставляем после последнего блока (находим его следующий sibling или вставляем в конец)
          const nextSibling = lastBlock.nextSibling;
          if (nextSibling) {
            this.container.insertBefore(blockElement, nextSibling);
          } else {
            this.container.appendChild(blockElement);
          }
        } else {
          this.container.appendChild(blockElement);
        }
      } else {
        // Вставляем перед блоком с индексом domIndex
        this.container.insertBefore(blockElement, existingBlocks[domIndex]);
      }
    } else {
      // Добавляем в конец
      this.container.appendChild(blockElement);
    }

    this._blockElements.set(blockData.id, blockElement);
    return blockElement;
  }

  /**
   * Удаляет блок из DOM
   * @param {string} blockId
   */
  removeBlock(blockId) {
    const element = this._blockElements.get(blockId);
    if (element && element.parentNode) {
      element.parentNode.removeChild(element);
      this._blockElements.delete(blockId);
    }
  }

  /**
   * Обновляет существующий блок
   * @param {Object} blockData
   */
  updateBlock(blockData) {
    const element = this._blockElements.get(blockData.id);
    if (element) {
      // Перерендерим блок
      const newElement = this.blockRenderer.render(blockData);
      if (newElement) {
        newElement.setAttribute('data-block-id', blockData.id);
        newElement.classList.add('document-block');
        element.parentNode.replaceChild(newElement, element);
        this._blockElements.set(blockData.id, newElement);
      }
    }
  }

  /**
   * Получает DOM элемент блока
   * @param {string} blockId
   * @returns {HTMLElement|undefined}
   */
  getBlockElement(blockId) {
    return this._blockElements.get(blockId);
  }

  /**
   * Очищает рендерер
   */
  clear() {
    this.container.innerHTML = '';
    this._blockElements.clear();
  }
}

