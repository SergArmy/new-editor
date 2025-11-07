import { Block } from '../base/Block.js';
import { TextBlockInputHandler } from './TextBlockInputHandler.js';
import { InlineFormatManager } from '../../formatting/InlineFormatManager.js';
import { InlineFormatter } from '../../formatting/InlineFormatter.js';

export class TextBlock extends Block {
  /**
   * @param {Object} data
   * @param {string} [data.text] - текст блока (для обратной совместимости)
   * @param {string} [data.html] - HTML содержимое блока (с форматированием)
   * @param {Object} [data.format] - inline форматирование (для обратной совместимости)
   * @param {Object} [data.editorDeps] - зависимости редактора (slashCommands, markdownShortcuts, eventBus)
   */
  constructor(data) {
    super(data);
    // Поддерживаем оба формата: data.text (прямой) и data.data.text (из Document)
    this.text = data.text || (this.data && this.data.text) || '';
    this.html = data.html || (this.data && this.data.html) || null;
    this.format = data.format || (this.data && this.data.format) || {};
    this.editorDeps = data.editorDeps || null;
    this.inputHandler = null;
    this.contentElement = null;
  }

  render() {
    const el = super.render();
    el.className = 'block text-block';
    
    // Создаем редактируемый элемент
    this.contentElement = document.createElement('div');
    this.contentElement.className = 'text-content';
    this.contentElement.contentEditable = 'true';
    
    // Если есть HTML, используем его, иначе используем текст с форматированием
    if (this.html) {
      this.contentElement.innerHTML = this.html;
    } else if (this.text) {
      // Применяем форматирование к тексту, если оно есть
      if (Object.keys(this.format).length > 0) {
        this.contentElement.innerHTML = InlineFormatter.format(this.text, this.format);
      } else {
        this.contentElement.textContent = this.text;
      }
    }
    
    el.appendChild(this.contentElement);
    
    // Инициализируем обработчик ввода, если есть зависимости
    if (this.editorDeps) {
      this._setupInputHandler();
    }
    
    return el;
  }

  /**
   * Настраивает обработчик ввода
   * @private
   */
  _setupInputHandler() {
    if (!this.contentElement || !this.editorDeps) return;

    const { slashCommands, markdownShortcuts, eventBus } = this.editorDeps;
    
    if (!slashCommands || !markdownShortcuts || !eventBus) return;

    this.inputHandler = new TextBlockInputHandler({
      slashCommands,
      markdownShortcuts,
      onCommand: (config, blockId) => {
        eventBus.emit('textblock:slash-command', { config, blockId });
      },
      onMarkdown: (match, blockId) => {
        eventBus.emit('textblock:markdown-shortcut', { match, blockId });
      }
    });

    this.inputHandler.attach(this.contentElement, this.id);

    // Сохранение изменений в Document с debounce
    this._saveTimeout = null;
    this.contentElement.addEventListener('input', () => {
      clearTimeout(this._saveTimeout);
      this._saveTimeout = setTimeout(() => {
        this._saveChanges();
      }, 500); // Сохраняем через 500мс после последнего изменения
    });

    // Сохраняем при потере фокуса
    this.contentElement.addEventListener('blur', () => {
      clearTimeout(this._saveTimeout);
      this._saveChanges();
    });
  }

  /**
   * Сохраняет изменения блока в Document
   * @private
   */
  _saveChanges() {
    if (!this.contentElement || !this.editorDeps) return;

    const { eventBus } = this.editorDeps;
    if (!eventBus) return;

    // Получаем текущее содержимое
    const html = InlineFormatManager.getHTML(this.contentElement);
    const text = this.contentElement.textContent || '';

    // Обновляем локальные данные
    this.html = html;
    this.text = text;

    // Эмитим событие для обновления в Document
    eventBus.emit('textblock:content-changed', {
      blockId: this.id,
      data: {
        text: text,
        html: html || undefined,
        format: this.format
      }
    });
  }

  /**
   * @param {string} text
   * @param {Object} format
   * @returns {string}
   */
  _formatText(text, format) {
    // Базовая реализация - просто экранирование HTML
    // Полная реализация inline форматирования будет позже
    return text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  toJSON() {
    // Получаем текущее HTML содержимое, если элемент отрендерен
    let html = this.html;
    if (this.contentElement) {
      html = InlineFormatManager.getHTML(this.contentElement);
    }
    
    // Получаем текстовое содержимое для обратной совместимости
    let text = this.text;
    if (this.contentElement) {
      text = this.contentElement.textContent || '';
    }
    
    return {
      ...super.toJSON(),
      text: text,
      html: html || undefined,
      format: this.format
    };
  }
}

