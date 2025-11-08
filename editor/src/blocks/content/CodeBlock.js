import { Block } from '../base/Block.js';
import { MonacoCodeEditor } from '../../integrations/monaco/MonacoCodeEditor.js';
import { logger } from '../../utils/logger.js';

/**
 * @class CodeBlock
 * @description Блок кода с поддержкой Monaco Editor и подсветки синтаксиса 1С (BSL)
 */
export class CodeBlock extends Block {
  /**
   * Поддерживаемые языки программирования
   */
  static SUPPORTED_LANGUAGES = [
    { id: 'bsl', label: '1С (BSL)', aliases: ['1c', '1C'] },
    { id: 'plantuml', label: 'PlantUML', aliases: ['puml', 'plant-uml'] },
    { id: 'javascript', label: 'JavaScript' },
    { id: 'json', label: 'JSON' },
    { id: 'xml', label: 'XML' },
    { id: 'html', label: 'HTML' },
    { id: 'css', label: 'CSS' },
    { id: 'sql', label: 'SQL' }
  ];

  /**
   * @param {Object} data
   * @param {string} [data.code] - код
   * @param {string} [data.language] - язык программирования
   * @param {boolean} [data.lineNumbers] - показывать ли нумерацию строк
   * @param {boolean} [data.minimap] - показывать ли миникарту
   * @param {boolean} [data.readOnly] - только для чтения
   * @param {boolean} [data.useMonaco] - использовать Monaco Editor
   */
  constructor(data) {
    super(data);
    // Поддерживаем оба формата: data.code (прямой) и data.data.code (из Document)
    const blockData = this.data || {};
    this.code = data.code || blockData.code || '';
    this.language = this._normalizeLanguage(data.language || blockData.language || 'bsl');
    this.lineNumbers = data.lineNumbers !== undefined ? data.lineNumbers :
      (blockData.lineNumbers !== undefined ? blockData.lineNumbers : true);
    this.minimap = data.minimap !== undefined ? data.minimap :
      (blockData.minimap !== undefined ? blockData.minimap : false); // По умолчанию выключена
    this.readOnly = data.readOnly !== undefined ? data.readOnly :
      (blockData.readOnly !== undefined ? blockData.readOnly : false);

    // Используем Monaco для всех поддерживаемых языков
    this.useMonaco = data.useMonaco !== undefined ? data.useMonaco :
      (blockData.useMonaco !== undefined ? blockData.useMonaco : true);

    /** @type {MonacoCodeEditor|null} */
    this.monacoEditor = null;

    /** @type {HTMLElement|null} */
    this.editorContainer = null;

    /** @type {HTMLElement|null} */
    this.headerElement = null;

    /** @type {HTMLElement|null} */
    this.languageDropdown = null;

    /** @type {HTMLElement|null} */
    this.settingsDropdown = null;

    /** @type {boolean} */
    this.isLanguageDropdownOpen = false;

    /** @type {boolean} */
    this.isSettingsDropdownOpen = false;

    /** @type {number|null} */
    this.height = data.height || blockData.height || null; // Высота в пикселях, null = авто

    /** @type {HTMLElement|null} */
    this.resizeHandle = null;

    /** @type {boolean} */
    this.isResizing = false;
  }

  /**
   * Нормализует язык программирования
   * @param {string} lang
   * @returns {string}
   * @private
   */
  _normalizeLanguage(lang) {
    if (!lang) return 'bsl';

    const normalized = lang.toLowerCase();

    // Проверяем алиасы для 1С
    if (['1c', '1с'].includes(normalized)) {
      return 'bsl';
    }

    if (['plantuml', 'puml', 'plant-uml'].includes(normalized)) {
      return 'plantuml';
    }

    // Проверяем, есть ли язык в списке поддерживаемых
    const found = CodeBlock.SUPPORTED_LANGUAGES.find(
      l => l.id === normalized || (l.aliases && l.aliases.includes(lang))
    );

    return found ? found.id : 'bsl';
  }

  /**
   * Получает отображаемое имя языка
   * @param {string} langId
   * @returns {string}
   * @private
   */
  _getLanguageLabel(langId) {
    const found = CodeBlock.SUPPORTED_LANGUAGES.find(l => l.id === langId);
    return found ? found.label : langId.toUpperCase();
  }

  /**
   * Рендерит блок кода
   * @returns {HTMLElement}
   */
  render() {
    const el = super.render();
    this.element = el; // Сохраняем ссылку на элемент
    el.className = 'block code-block document-block';
    el.setAttribute('data-language', this.language);

    // Создаем заголовок с элементами управления
    this.headerElement = this._createHeader();
    el.appendChild(this.headerElement);

    // Контейнер для редактора
    this.editorContainer = document.createElement('div');
    this.editorContainer.className = 'code-editor-container';
    el.appendChild(this.editorContainer);

    // Применяем начальную высоту, если задана
    if (this.height) {
      this.editorContainer.style.height = `${this.height}px`;
    }

    // Resize handle для изменения размера
    this.resizeHandle = this._createResizeHandle();
    el.appendChild(this.resizeHandle);

    // Сначала рендерим fallback редактор синхронно (для видимости кода)
    // Затем пытаемся загрузить Monaco асинхронно
    this._renderFallbackEditor();

    // Инициализация Monaco редактора (асинхронно, если нужно)
    if (this.useMonaco) {
      setTimeout(() => {
        this._initializeEditor();
      }, 0);
    }

    return el;
  }

  /**
   * Создает заголовок блока кода с элементами управления
   * @returns {HTMLElement}
   * @private
   */
  _createHeader() {
    const header = document.createElement('div');
    header.className = 'code-block-header';

    // Левая часть с кнопками
    const leftControls = document.createElement('div');
    leftControls.className = 'code-header-left';

    // Кнопка копирования
    const copyBtn = document.createElement('button');
    copyBtn.className = 'code-copy-btn';
    copyBtn.innerHTML = '<i class="fa-light fa-copy"></i>';
    copyBtn.setAttribute('aria-label', 'Копировать код');
    copyBtn.setAttribute('title', 'Копировать код');
    copyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this._copyCode();
    });

    // Кнопка выбора языка
    const languageBtn = document.createElement('button');
    languageBtn.className = 'code-language-btn';
    languageBtn.textContent = this._getLanguageLabel(this.language);
    languageBtn.setAttribute('aria-label', 'Выбрать язык');
    languageBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this._toggleLanguageDropdown();
    });

    // Выпадающий список языков
    this.languageDropdown = this._createLanguageDropdown();

    const languageContainer = document.createElement('div');
    languageContainer.className = 'code-language-container';
    languageContainer.appendChild(languageBtn);
    languageContainer.appendChild(this.languageDropdown);

    leftControls.appendChild(copyBtn);
    leftControls.appendChild(languageContainer);

    // Правая часть с настройками
    const rightControls = document.createElement('div');
    rightControls.className = 'code-header-right';

    // Кнопка настроек (шестеренка)
    const settingsBtn = document.createElement('button');
    settingsBtn.className = 'code-settings-btn';
    settingsBtn.innerHTML = '<i class="fa-light fa-gear"></i>';
    settingsBtn.setAttribute('aria-label', 'Настройки редактора');
    settingsBtn.setAttribute('title', 'Настройки');
    settingsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this._toggleSettingsDropdown();
    });

    // Выпадающий список настроек
    this.settingsDropdown = this._createSettingsDropdown();

    const settingsContainer = document.createElement('div');
    settingsContainer.className = 'code-settings-container';
    settingsContainer.appendChild(settingsBtn);
    settingsContainer.appendChild(this.settingsDropdown);

    rightControls.appendChild(settingsContainer);

    // Собираем заголовок
    header.appendChild(leftControls);
    header.appendChild(rightControls);

    // Закрываем dropdowns при клике вне их
    document.addEventListener('click', (e) => {
      if (this.isLanguageDropdownOpen && !languageContainer.contains(e.target)) {
        this._closeLanguageDropdown();
      }
      if (this.isSettingsDropdownOpen && !settingsContainer.contains(e.target)) {
        this._closeSettingsDropdown();
      }
    });

    return header;
  }

  /**
   * Создает выпадающий список языков
   * @returns {HTMLElement}
   * @private
   */
  _createLanguageDropdown() {
    const dropdown = document.createElement('div');
    dropdown.className = 'code-language-dropdown';
    dropdown.style.display = 'none';

    const sortedLanguages = [...CodeBlock.SUPPORTED_LANGUAGES].sort((a, b) =>
      a.label.localeCompare(b.label, 'ru-RU')
    );

    sortedLanguages.forEach(lang => {
      const item = document.createElement('button');
      item.className = 'code-language-item';
      item.textContent = lang.label;
      item.setAttribute('data-language', lang.id);

      if (lang.id === this.language) {
        item.classList.add('active');
      }

      item.addEventListener('click', (e) => {
        e.stopPropagation();
        this._changeLanguage(lang.id);
        this._closeLanguageDropdown();
      });

      dropdown.appendChild(item);
    });

    return dropdown;
  }

  /**
   * Создает выпадающий список настроек
   * @returns {HTMLElement}
   * @private
   */
  _createSettingsDropdown() {
    const dropdown = document.createElement('div');
    dropdown.className = 'code-settings-dropdown';
    dropdown.style.display = 'none';

    // Тумблер нумерации строк
    const lineNumbersToggle = this._createToggleItem(
      'line-numbers',
      'Нумерация строк',
      this.lineNumbers,
      (checked) => this._toggleLineNumbers(checked)
    );

    // Тумблер миникарты
    const minimapToggle = this._createToggleItem(
      'minimap',
      'Миникарта',
      this.minimap,
      (checked) => this._toggleMinimap(checked)
    );

    dropdown.appendChild(lineNumbersToggle);
    dropdown.appendChild(minimapToggle);

    return dropdown;
  }

  /**
   * Создает элемент тумблера для выпадающего списка
   * @param {string} id
   * @param {string} label
   * @param {boolean} checked
   * @param {Function} onChange
   * @returns {HTMLElement}
   * @private
   */
  _createToggleItem(id, label, checked, onChange) {
    const item = document.createElement('div');
    item.className = 'code-settings-item';

    const labelEl = document.createElement('label');
    labelEl.className = 'code-settings-label';
    labelEl.setAttribute('for', `toggle-${id}-${this.id}`);

    const labelText = document.createElement('span');
    labelText.className = 'code-settings-text';
    labelText.textContent = label;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `toggle-${id}-${this.id}`;
    checkbox.className = 'code-settings-checkbox';
    checkbox.checked = checked;
    checkbox.addEventListener('change', (e) => {
      onChange(e.target.checked);
    });

    const slider = document.createElement('span');
    slider.className = 'code-settings-slider';

    labelEl.appendChild(labelText);
    labelEl.appendChild(checkbox);
    labelEl.appendChild(slider);
    item.appendChild(labelEl);

    return item;
  }

  /**
   * Копирует код в буфер обмена
   * @private
   */
  async _copyCode() {
    try {
      const code = this.monacoEditor ? this.monacoEditor.getValue() : this.code;
      await navigator.clipboard.writeText(code);

      // Визуальная обратная связь с bounce анимацией
      const copyBtn = this.headerElement?.querySelector('.code-copy-btn');
      if (copyBtn) {
        const icon = copyBtn.querySelector('i');
        if (icon) {
          // Добавляем bounce анимацию
          icon.classList.add('fa-bounce');
          copyBtn.classList.add('copied');

          setTimeout(() => {
            icon.classList.remove('fa-bounce');
            copyBtn.classList.remove('copied');
          }, 1000);
        }
      }

      logger.log('Code copied to clipboard');
    } catch (error) {
      logger.error('Failed to copy code:', error);
    }
  }

  /**
   * Создает resize handle для изменения размера блока
   * @returns {HTMLElement}
   * @private
   */
  _createResizeHandle() {
    const handle = document.createElement('div');
    handle.className = 'code-resize-handle';
    handle.setAttribute('aria-label', 'Изменить размер блока');
    handle.setAttribute('title', 'Перетащите для изменения размера');

    // Иконка для визуального указания на возможность изменения размера
    const icon = document.createElement('i');
    icon.className = 'fa-light fa-grip-lines';
    handle.appendChild(icon);

    // Обработчики событий для изменения размера
    handle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this._startResize(e);
    });

    // Предотвращаем выделение текста при перетаскивании
    handle.addEventListener('selectstart', (e) => {
      e.preventDefault();
    });

    return handle;
  }

  /**
   * Начинает изменение размера блока
   * @param {MouseEvent} e
   * @private
   */
  _startResize(e) {
    this.isResizing = true;
    const startY = e.clientY;
    const startHeight = this.editorContainer.offsetHeight;
    const minHeight = 100; // Минимальная высота
    const maxHeight = window.innerHeight - 200; // Максимальная высота

    // Добавляем класс для визуальной обратной связи
    this.element?.classList.add('resizing');
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';

    const onMouseMove = (moveEvent) => {
      if (!this.isResizing) return;

      const deltaY = moveEvent.clientY - startY;
      let newHeight = startHeight + deltaY;

      // Ограничиваем высоту
      if (newHeight < minHeight) {
        newHeight = minHeight;
      } else if (newHeight > maxHeight) {
        newHeight = maxHeight;
      }

      // Применяем новую высоту
      this.height = newHeight;
      this.editorContainer.style.height = `${newHeight}px`;

      // Обновляем Monaco Editor при изменении размера
      if (this.monacoEditor) {
        this.monacoEditor.layout();
      }
    };

    const onMouseUp = () => {
      this.isResizing = false;
      this.element?.classList.remove('resizing');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';

      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);

      // Сохраняем высоту для будущих загрузок
      this._notifyChange();
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  /**
   * Переключает выпадающий список языков
   * @private
   */
  _toggleLanguageDropdown() {
    if (this.isLanguageDropdownOpen) {
      this._closeLanguageDropdown();
    } else {
      // Закрываем настройки если они открыты
      if (this.isSettingsDropdownOpen) {
        this._closeSettingsDropdown();
      }
      this._openLanguageDropdown();
    }
  }

  /**
   * Открывает выпадающий список языков
   * @private
   */
  _openLanguageDropdown() {
    if (this.languageDropdown) {
      this.languageDropdown.style.display = 'block';
      this.isLanguageDropdownOpen = true;
    }
  }

  /**
   * Закрывает выпадающий список языков
   * @private
   */
  _closeLanguageDropdown() {
    if (this.languageDropdown) {
      this.languageDropdown.style.display = 'none';
      this.isLanguageDropdownOpen = false;
    }
  }

  /**
   * Переключает выпадающий список настроек
   * @private
   */
  _toggleSettingsDropdown() {
    if (this.isSettingsDropdownOpen) {
      this._closeSettingsDropdown();
    } else {
      // Закрываем языки если они открыты
      if (this.isLanguageDropdownOpen) {
        this._closeLanguageDropdown();
      }
      this._openSettingsDropdown();
    }
  }

  /**
   * Открывает выпадающий список настроек
   * @private
   */
  _openSettingsDropdown() {
    if (this.settingsDropdown) {
      this.settingsDropdown.style.display = 'block';
      this.isSettingsDropdownOpen = true;

      // Добавляем анимацию спина к шестеренке
      const settingsBtn = this.headerElement?.querySelector('.code-settings-btn i');
      if (settingsBtn) {
        settingsBtn.classList.add('fa-spin');
        setTimeout(() => {
          settingsBtn.classList.remove('fa-spin');
        }, 500); // 0.5 секунды
      }
    }
  }

  /**
   * Закрывает выпадающий список настроек
   * @private
   */
  _closeSettingsDropdown() {
    if (this.settingsDropdown) {
      this.settingsDropdown.style.display = 'none';
      this.isSettingsDropdownOpen = false;
    }
  }

  /**
   * Изменяет язык программирования
   * @param {string} langId
   * @private
   */
  async _changeLanguage(langId) {
    if (this.language === langId) return;

    this.language = langId;

    // Обновляем кнопку
    const languageBtn = this.headerElement?.querySelector('.code-language-btn');
    if (languageBtn) {
      languageBtn.textContent = this._getLanguageLabel(langId);
    }

    // Обновляем активный элемент в dropdown
    if (this.languageDropdown) {
      const items = this.languageDropdown.querySelectorAll('.code-language-item');
      items.forEach(item => {
        if (item.getAttribute('data-language') === langId) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });
    }

    // Обновляем Monaco Editor
    if (this.monacoEditor) {
      await this.monacoEditor.setLanguage(langId);
    }

    // Уведомляем об изменении
    this._notifyChange();

    logger.log(`Language changed to: ${langId}`);
  }

  /**
   * Переключает нумерацию строк
   * @param {boolean} enabled
   * @private
   */
  _toggleLineNumbers(enabled) {
    this.lineNumbers = enabled;

    if (this.monacoEditor) {
      this.monacoEditor.updateOptions({ lineNumbers: enabled });
    }

    this._notifyChange();
    logger.log(`Line numbers ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Переключает миникарту
   * @param {boolean} enabled
   * @private
   */
  _toggleMinimap(enabled) {
    this.minimap = enabled;

    if (this.monacoEditor) {
      this.monacoEditor.updateOptions({ minimap: enabled });
    }

    this._notifyChange();
    logger.log(`Minimap ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Инициализирует Monaco редактор (асинхронно)
   * @private
   */
  async _initializeEditor() {
    if (!this.editorContainer || !this.useMonaco) {
      return;
    }

    try {
      // Сохраняем код на случай, если нужно будет восстановить fallback
      const codeToShow = this.code;

      // Устанавливаем минимальную высоту для контейнера
      this.editorContainer.style.height = '300px';
      this.editorContainer.style.minHeight = '300px';

      // Очищаем fallback редактор перед инициализацией Monaco
      // (Monaco требует пустой контейнер)
      this.editorContainer.innerHTML = '';

      this.monacoEditor = new MonacoCodeEditor(this.editorContainer, {
        value: codeToShow,
        language: this.language,
        readOnly: this.readOnly,
        lineNumbers: this.lineNumbers,
        minimap: this.minimap,
        theme: this._getMonacoTheme()
      });

      await this.monacoEditor.initialize();

      // Подписываемся на изменения
      this.monacoEditor.onDidChangeContent((value) => {
        this.code = value;
        this._notifyChange();
      });

      logger.log(`Monaco editor initialized for language: ${this.language}`);
    } catch (error) {
      logger.warn('Failed to initialize Monaco, restoring fallback editor:', error);
      // Если Monaco не загрузился, восстанавливаем fallback редактор
      this._renderFallbackEditor();
    }
  }

  /**
   * Рендерит fallback редактор (простой <pre>)
   * @private
   */
  _renderFallbackEditor() {
    if (!this.editorContainer) {
      return;
    }

    this.editorContainer.style.height = 'auto';

    const pre = document.createElement('pre');
    pre.className = `code-content language-${this.language}`;

    if (this.readOnly) {
      pre.textContent = this.code;
    } else {
      // Если не read-only, используем textarea
      const textarea = document.createElement('textarea');
      textarea.className = 'code-textarea';
      textarea.value = this.code;
      textarea.addEventListener('input', (e) => {
        this.code = e.target.value;
        this._notifyChange();
      });
      pre.appendChild(textarea);
    }

    this.editorContainer.innerHTML = '';
    this.editorContainer.appendChild(pre);
  }

  /**
   * Получает тему Monaco в зависимости от текущей темы приложения
   * @private
   * @returns {string}
   */
  _getMonacoTheme() {
    // Для блоков кода всегда используем темную тему, так как фон блока темный (#2d3748)
    // Это обеспечивает консистентность с дизайном блока кода
    return 'vs-dark';
  }

  /**
   * Уведомляет об изменении кода
   * @private
   */
  _notifyChange() {
    // Можно добавить событие изменения для StateManager
    // this.emit('change', { code: this.code });
  }

  /**
   * Устанавливает код
   * @param {string} code
   */
  setCode(code) {
    this.code = code;
    if (this.monacoEditor) {
      this.monacoEditor.setValue(code);
    } else {
      // Обновляем fallback editor
      const textarea = this.editorContainer?.querySelector('textarea');
      const pre = this.editorContainer?.querySelector('pre');
      if (textarea) {
        textarea.value = code;
      } else if (pre) {
        pre.textContent = code;
      }
    }
  }

  /**
   * Устанавливает язык
   * @param {string} language
   */
  async setLanguage(language) {
    this.language = language;
    if (this.monacoEditor) {
      await this.monacoEditor.setLanguage(language);
    }
  }

  /**
   * Устанавливает тему
   * @param {string} theme
   */
  setTheme(theme) {
    if (this.monacoEditor) {
      this.monacoEditor.setTheme(theme === 'dark' ? 'vs-dark' : 'vs');
    }
  }

  /**
   * Сериализация в JSON
   * @returns {Object}
   */
  toJSON() {
    return {
      ...super.toJSON(),
      code: this.code,
      language: this.language,
      lineNumbers: this.lineNumbers,
      minimap: this.minimap,
      readOnly: this.readOnly,
      useMonaco: this.useMonaco,
      height: this.height
    };
  }

  /**
   * Очищает ресурсы при удалении блока
   */
  dispose() {
    // Удаляем слушателей событий
    if (this.headerElement) {
      const languageBtn = this.headerElement.querySelector('.code-language-btn');
      if (languageBtn) {
        languageBtn.replaceWith(languageBtn.cloneNode(true));
      }
    }

    if (this.monacoEditor) {
      this.monacoEditor.dispose();
      this.monacoEditor = null;
    }

    super.dispose && super.dispose();
  }
}

