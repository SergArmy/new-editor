import { monacoLoader } from './MonacoLoader.js';
import { register1CLanguage } from './OneCLanguageConfig.js';
import { registerPlantUmlLanguage } from './PlantUMLLanguageConfig.js';
import { logger } from '../../utils/logger.js';

const registeredLanguages = new Set();

const LANGUAGE_REGISTRARS = {
  bsl: register1CLanguage,
  plantuml: registerPlantUmlLanguage
};

/**
 * Нормализует идентификатор языка до значения, пригодного для Monaco.
 * @param {string} language
 * @returns {string}
 */
function normalizeLanguageId(language) {
  if (!language) {
    return 'plaintext';
  }

  const value = language.toLowerCase();

  if (['1c', '1с', 'bsl', 'bsllanguage'].includes(value)) {
    return 'bsl';
  }

  if (['plantuml', 'puml', 'plant-uml'].includes(value)) {
    return 'plantuml';
  }

  return value;
}

/**
 * Регистрирует язык, если требуется, и возвращает нормализованный идентификатор.
 * @param {any} monaco
 * @param {string} language
 * @returns {string}
 */
function ensureLanguageRegistered(monaco, language) {
  const normalized = normalizeLanguageId(language);

  if (!monaco) {
    return normalized;
  }

  const registrar = LANGUAGE_REGISTRARS[normalized];
  if (registrar && !registeredLanguages.has(normalized)) {
    registrar(monaco);
    registeredLanguages.add(normalized);
    logger.log(`Monaco language registered: ${normalized}`);
  }

  return normalized;
}

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
      language: normalizeLanguageId(options.language || 'javascript'),
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

      // Регистрируем специфические языки, если требуется
      this.options.language = ensureLanguageRegistered(monaco, this.options.language);

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
      this.options.language = normalizeLanguageId(language);
      return;
    }

    // Если язык 1С (BSL) и он еще не зарегистрирован
    const normalized = normalizeLanguageId(language);
    const monaco = monacoLoader.getMonaco();
    const languageId = ensureLanguageRegistered(monaco, normalized);

    if (!monaco) {
      this.options.language = languageId;
      return;
    }

    const model = this.editor.getModel();
    if (model) {
      monaco.editor.setModelLanguage(model, languageId);
    }
    this.options.language = languageId;
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

