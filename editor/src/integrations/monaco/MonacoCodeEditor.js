import { monacoLoader } from './MonacoLoader.js';
import { register1CLanguage } from './OneCLanguageConfig.js';
import { logger } from '../../utils/logger.js';

/**
 * @class MonacoCodeEditor
 * @description Обертка для Monaco Editor с поддержкой 1С
 */
export class MonacoCodeEditor {
  /**
   * @param {HTMLElement} container - контейнер для редактора
   * @param {Object} options - опции редактора
   * @param {string} [options.value] - начальное значение
   * @param {string} [options.language] - язык программирования
   * @param {string} [options.theme] - тема (light/dark)
   * @param {boolean} [options.readOnly] - только для чтения
   * @param {boolean} [options.lineNumbers] - показывать нумерацию строк
   * @param {boolean} [options.minimap] - показывать миникарту
   */
  constructor(container, options = {}) {
    /** @type {HTMLElement} */
    this.container = container;

    /** @type {Object} */
    this.options = {
      value: options.value || '',
      language: options.language || 'javascript',
      theme: options.theme || 'vs',
      readOnly: options.readOnly || false,
      lineNumbers: options.lineNumbers !== false ? 'on' : 'off',
      minimap: { enabled: options.minimap === true }, // Явная проверка на true
      automaticLayout: true,
      scrollBeyondLastLine: false,
      fontSize: 14,
      tabSize: 4,
      insertSpaces: false
    };

    /** @type {any} */
    this.editor = null;

    /** @type {boolean} */
    this.isInitialized = false;

    /** @type {boolean} */
    this.languageRegistered = false;
  }

  /**
   * Инициализирует редактор
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.isInitialized) {
      logger.warn('Monaco editor already initialized');
      return;
    }

    try {
      // Загружаем Monaco
      const monaco = await monacoLoader.load();

      // Регистрируем язык 1С (BSL), если еще не зарегистрирован
      const is1CLanguage = ['1c', 'bsl', 'BSL', '1C'].includes(this.options.language);
      if (!this.languageRegistered && is1CLanguage) {
        register1CLanguage(monaco);
        this.languageRegistered = true;
        logger.log('1C (BSL) language registered in Monaco');

        // Нормализуем язык к 'bsl'
        if (this.options.language !== 'bsl') {
          this.options.language = 'bsl';
        }
      }

      // Создаем редактор
      this.editor = monaco.editor.create(this.container, this.options);

      this.isInitialized = true;
      logger.log('Monaco editor initialized successfully');

      // Подписываемся на изменения
      this.editor.onDidChangeModelContent(() => {
        this._handleContentChange();
      });

    } catch (error) {
      logger.error('Failed to initialize Monaco editor:', error);
      throw error;
    }
  }

  /**
   * Получает значение редактора
   * @returns {string}
   */
  getValue() {
    if (!this.editor) {
      return this.options.value;
    }
    return this.editor.getValue();
  }

  /**
   * Устанавливает значение редактора
   * @param {string} value
   */
  setValue(value) {
    if (!this.editor) {
      this.options.value = value;
      return;
    }
    this.editor.setValue(value);
  }

  /**
   * Устанавливает язык
   * @param {string} language
   */
  async setLanguage(language) {
    if (!this.editor) {
      this.options.language = language;
      return;
    }

    // Если язык 1С (BSL) и он еще не зарегистрирован
    const is1CLanguage = ['1c', 'bsl', 'BSL', '1C'].includes(language);
    if (is1CLanguage) {
      const monaco = monacoLoader.getMonaco();
      if (monaco && !this.languageRegistered) {
        register1CLanguage(monaco);
        this.languageRegistered = true;
      }
      // Нормализуем к 'bsl'
      language = 'bsl';
    }

    const model = this.editor.getModel();
    if (model) {
      const monaco = monacoLoader.getMonaco();
      monaco.editor.setModelLanguage(model, language);
    }
  }

  /**
   * Устанавливает тему
   * @param {string} theme - 'vs' (light), 'vs-dark' (dark)
   */
  setTheme(theme) {
    if (!this.editor) {
      this.options.theme = theme;
      return;
    }

    const monaco = monacoLoader.getMonaco();
    if (monaco) {
      monaco.editor.setTheme(theme);
    }
  }

  /**
   * Устанавливает режим только для чтения
   * @param {boolean} readOnly
   */
  setReadOnly(readOnly) {
    if (!this.editor) {
      this.options.readOnly = readOnly;
      return;
    }
    this.editor.updateOptions({ readOnly });
  }

  /**
   * Обновляет опции редактора
   * @param {Object} options - новые опции
   */
  updateOptions(options) {
    if (!this.editor) {
      // Обновляем сохраненные опции, если редактор еще не инициализирован
      Object.assign(this.options, this._normalizeOptions(options));
      return;
    }

    this.editor.updateOptions(this._normalizeOptions(options));
  }

  /**
   * Нормализует опции для Monaco Editor
   * @param {Object} options
   * @returns {Object}
   * @private
   */
  _normalizeOptions(options) {
    const normalized = {};

    if (options.lineNumbers !== undefined) {
      normalized.lineNumbers = options.lineNumbers ? 'on' : 'off';
    }

    if (options.minimap !== undefined) {
      normalized.minimap = { enabled: options.minimap };
    }

    if (options.readOnly !== undefined) {
      normalized.readOnly = options.readOnly;
    }

    if (options.theme !== undefined) {
      normalized.theme = options.theme;
    }

    return normalized;
  }

  /**
   * Фокусирует редактор
   */
  focus() {
    if (this.editor) {
      this.editor.focus();
    }
  }

  /**
   * Изменяет размер редактора
   */
  layout() {
    if (this.editor) {
      this.editor.layout();
    }
  }

  /**
   * Уничтожает редактор
   */
  dispose() {
    if (this.editor) {
      this.editor.dispose();
      this.editor = null;
      this.isInitialized = false;
    }
  }

  /**
   * Подписывается на изменения контента
   * @param {Function} callback
   */
  onDidChangeContent(callback) {
    this._changeCallback = callback;
  }

  /**
   * Обработчик изменения контента
   * @private
   */
  _handleContentChange() {
    if (this._changeCallback) {
      this._changeCallback(this.getValue());
    }
  }
}

