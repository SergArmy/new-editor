import { Block } from '../base/Block.js';
import { CodeBlock } from '../content/CodeBlock.js';

/**
 * @typedef {'text'|'code'} ComparisonContentMode
 */

/**
 * @typedef {'neutral'|'correct'|'incorrect'} ComparisonStatus
 */

/**
 * @typedef {Object} ComparisonSideConfig
 * @property {string} [title]
 * @property {string} [icon]
 * @property {ComparisonStatus} [status]
 * @property {ComparisonContentMode} [mode]
 * @property {string} [language]
 * @property {string|string[]} [content]
 * @property {string[]} [notes]
 */

/**
 * @typedef {Object} ComparisonSectionConfig
 * @property {string} [id]
 * @property {string} [title]
 * @property {string} [description]
 * @property {ComparisonSideConfig} [before]
 * @property {ComparisonSideConfig} [after]
 */

/**
 * @typedef {Object} NormalizedComparisonSide
 * @property {string} id
 * @property {string} title
 * @property {string|null} icon
 * @property {ComparisonStatus} status
 * @property {ComparisonContentMode} mode
 * @property {string|null} language
 * @property {string[]} content
 * @property {string[]} notes
 */

/**
 * @typedef {Object} NormalizedComparisonSection
 * @property {string} id
 * @property {string|null} title
 * @property {string|null} description
 * @property {NormalizedComparisonSide} before
 * @property {NormalizedComparisonSide} after
 */

const VALID_STATUSES = new Set(['neutral', 'correct', 'incorrect']);
const VALID_MODES = new Set(['text', 'code']);
const ICON_LIBRARY = [
  { label: 'Настройки', value: 'fa-light fa-gear' },
  { label: 'Просмотр', value: 'fa-light fa-eye' },
  { label: 'Режим кода', value: 'fa-light fa-code' },
  { label: 'Уменьшить масштаб', value: 'fa-light fa-magnifying-glass-minus' },
  { label: 'Сброс масштаба', value: 'fa-light fa-arrows-rotate' },
  { label: 'Увеличить масштаб', value: 'fa-light fa-magnifying-glass-plus' },
  { label: 'Полноэкранный режим', value: 'fa-light fa-expand' },
  { label: 'Копирование', value: 'fa-light fa-copy' },
  { label: 'Изображение', value: 'fa-light fa-image' },
  { label: 'Закрыть', value: 'fa-light fa-xmark' },
  { label: 'Перемещение', value: 'fa-light fa-grip-lines' },
  { label: 'Рост показателей', value: 'fa-light fa-arrow-trend-up' },
  { label: 'Предупреждение', value: 'fa-light fa-triangle-exclamation' },
  { label: 'Автоматизация', value: 'fa-light fa-gears' },
  { label: 'Команда', value: 'fa-light fa-people-group' },
  { label: 'Документация', value: 'fa-light fa-file-lines' },
  { label: 'Интерфейс', value: 'fa-light fa-display' },
  { label: 'Безопасность', value: 'fa-light fa-shield-check' },
  { label: 'Производительность', value: 'fa-light fa-gauge-high' },
  { label: 'Добавление', value: 'fa-light fa-plus' },
  { label: 'Добавить запись', value: 'fa-light fa-circle-plus' },
  { label: 'Удалить запись', value: 'fa-light fa-trash-can' },
  { label: 'Подтверждено', value: 'fa-light fa-circle-check' },
  { label: 'Отклонено', value: 'fa-light fa-circle-xmark' }
];

/**
 * Блок для визуального сравнения состояний (до/после).
 */
export class ComparisonBlock extends Block {
  /**
   * @param {Object} data
   */
  constructor(data) {
    super(data);

    const source = data.data || data;

    this.title = typeof source.title === 'string' ? source.title : '';
    this.layout = source.layout === 'vertical' ? 'vertical' : 'horizontal';

    /** @type {Map<string, {iconEl: HTMLElement|null, menuEl: HTMLElement|null}>} */
    this._sideControls = new Map();

    /** @type {NormalizedComparisonSection[]} */
    this.sections = this._normalizeSections(source);

    /** @type {AbortController|null} */
    this._iconMenuAbortController = null;
  }

  /**
   * @returns {HTMLElement}
   */
  render() {
    const el = super.render();
    el.className = 'block comparison-block';

    if (this.title) {
      const titleEl = document.createElement('div');
      titleEl.className = 'comparison-title';
      titleEl.textContent = this.title;
      el.appendChild(titleEl);
    }

    if (this.sections.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'comparison-empty';
      emptyState.textContent = 'Нет данных для сравнения';
      el.appendChild(emptyState);
      return el;
    }

    this.sections.forEach(section => {
      const sectionEl = document.createElement('section');
      sectionEl.className = 'comparison-section';
      sectionEl.dataset.sectionId = section.id;

      if (section.title) {
        const sectionTitleEl = document.createElement('div');
        sectionTitleEl.className = 'comparison-section-title';
        sectionTitleEl.textContent = section.title;
        sectionEl.appendChild(sectionTitleEl);
      }

      if (section.description) {
        const descriptionEl = document.createElement('div');
        descriptionEl.className = 'comparison-section-description';
        descriptionEl.textContent = section.description;
        sectionEl.appendChild(descriptionEl);
      }

      const contentEl = document.createElement('div');
      contentEl.className = 'comparison-content';

      const beforeColumn = this._renderColumn(section.before, 'before');
      const afterColumn = this._renderColumn(section.after, 'after');

      contentEl.appendChild(beforeColumn);
      contentEl.appendChild(afterColumn);

      sectionEl.appendChild(contentEl);
      el.appendChild(sectionEl);
    });

    return el;
  }

  /**
   * @returns {Object}
   */
  toJSON() {
    return {
      ...super.toJSON(),
      title: this.title,
      layout: this.layout,
      sections: this.sections.map(section => ({
        id: section.id,
        title: section.title,
        description: section.description,
        before: this._serializeSide(section.before),
        after: this._serializeSide(section.after)
      }))
    };
  }

  /**
   * @private
   * @param {Object} source
   * @returns {NormalizedComparisonSection[]}
   */
  _normalizeSections(source) {
    const sections = Array.isArray(source.sections)
      ? source.sections
      : this._deriveSectionsFromLegacyShape(source);

    return sections.map((section, index) => this._normalizeSection(section, index));
  }

  /**
   * @private
   * @param {Object} source
   * @returns {ComparisonSectionConfig[]}
   */
  _deriveSectionsFromLegacyShape(source) {
    if (!source.before && !source.after) {
      return [];
    }

    return [
      {
        before: source.before || {},
        after: source.after || {}
      }
    ];
  }

  /**
   * @private
   * @param {ComparisonSectionConfig} section
   * @param {number} index
   * @returns {NormalizedComparisonSection}
   */
  _normalizeSection(section, index) {
    const id = typeof section?.id === 'string' && section.id.trim()
      ? section.id.trim()
      : `${this.id}-section-${index + 1}`;

    const title = typeof section?.title === 'string' && section.title.trim()
      ? section.title.trim()
      : null;

    const description = typeof section?.description === 'string' && section.description.trim()
      ? section.description.trim()
      : null;

    const before = this._normalizeSide(section?.before, 'До', `${id}-before`);
    const after = this._normalizeSide(section?.after, 'После', `${id}-after`, 'correct');

    return {
      id,
      title,
      description,
      before,
      after
    };
  }

  /**
   * @private
   * @param {ComparisonSideConfig|undefined} side
   * @param {string} fallbackTitle
   * @param {string} id
   * @param {ComparisonStatus} [defaultStatus='neutral']
   * @returns {NormalizedComparisonSide}
   */
  _normalizeSide(side, fallbackTitle, id, defaultStatus = 'neutral') {
    const title = typeof side?.title === 'string' && side.title.trim()
      ? side.title.trim()
      : fallbackTitle;

    const icon = this._normalizeIcon(side?.icon);

    const status = this._normalizeStatus(side?.status, defaultStatus);
    const mode = this._normalizeMode(side?.mode);
    const language = typeof side?.language === 'string' && side.language.trim()
      ? side.language.trim()
      : this._deriveLanguage(mode, side);

    let content = [];
    if (Array.isArray(side?.content)) {
      content = side.content
        .map(value => (typeof value === 'string' ? value : ''))
        .filter(Boolean);
    } else if (typeof side?.content === 'string') {
      content = this._splitContent(side.content, mode);
    }

    const notes = Array.isArray(side?.notes)
      ? side.notes.map(item => (typeof item === 'string' ? item : '')).filter(Boolean)
      : [];

    return {
      id,
      title,
      icon,
      status,
      mode,
      language,
      content,
      notes
    };
  }

  /**
   * @private
   * @param {string|undefined} status
   * @param {ComparisonStatus} fallback
   * @returns {ComparisonStatus}
   */
  _normalizeStatus(status, fallback) {
    if (typeof status !== 'string') {
      return fallback;
    }

    const trimmed = status.trim().toLowerCase();
    return VALID_STATUSES.has(trimmed) ? /** @type {ComparisonStatus} */ (trimmed) : fallback;
  }

  /**
   * @private
   * @param {string|undefined} mode
   * @returns {ComparisonContentMode}
   */
  _normalizeMode(mode) {
    if (typeof mode !== 'string') {
      return 'text';
    }

    const trimmed = mode.trim().toLowerCase();
    return VALID_MODES.has(trimmed) ? /** @type {ComparisonContentMode} */ (trimmed) : 'text';
  }

  /**
   * @private
   * @param {'text'|'code'} mode
   * @param {ComparisonSideConfig|undefined} side
   * @returns {string|null}
   */
  _deriveLanguage(mode, side) {
    if (mode !== 'code') {
      return null;
    }

    if (typeof side?.language === 'string' && side.language.trim()) {
      return side.language.trim();
    }

    if (typeof side?.format === 'string' && side.format.trim()) {
      return side.format.trim();
    }

    if (typeof side?.type === 'string' && side.type.trim()) {
      return side.type.trim();
    }

    return 'json';
  }

  /**
   * @private
   * @param {string|undefined|null} icon
   * @returns {string|null}
   */
  _normalizeIcon(icon) {
    if (typeof icon !== 'string') {
      return null;
    }

    const trimmed = icon.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  /**
   * @private
   * @param {string} content
   * @param {ComparisonContentMode} mode
   * @returns {string[]}
   */
  _splitContent(content, mode) {
    if (mode === 'code') {
      return content.replace(/\r\n/g, '\n').split('\n');
    }

    // Для текстового контента разбиваем по пустым строкам на абзацы
    return content
      .split(/\n{2,}/g)
      .map(paragraph => paragraph.trim())
      .filter(Boolean);
  }

  /**
   * @private
   * @param {NormalizedComparisonSide} side
   * @param {'before'|'after'} role
   * @returns {HTMLElement}
   */
  _renderColumn(side, role) {
    const controlsState = { iconEl: null, menuEl: null };

    const column = document.createElement('div');
    column.className = 'comparison-column';
    column.dataset.role = role;
    column.dataset.sideId = side.id;

    if (side.status !== 'neutral') {
      column.classList.add(side.status);
    }

    const header = this._renderHeader(side, controlsState);

    const body = document.createElement('div');
    body.className = 'comparison-body';

    if (side.status !== 'neutral') {
      body.classList.add(side.status);
    }

    if (side.mode === 'code') {
      body.classList.add('has-code');
      body.appendChild(this._renderCodeBody(side));
    } else {
      body.appendChild(this._renderTextContent(side.content));
    }

    if (side.notes.length > 0) {
      const notesList = document.createElement('ul');
      notesList.className = 'comparison-notes';
      side.notes.forEach(note => {
        const item = document.createElement('li');
        item.textContent = note;
        notesList.appendChild(item);
      });
      body.appendChild(notesList);
    }

    column.appendChild(header);
    column.appendChild(body);

    this._sideControls.set(side.id, controlsState);
    return column;
  }

  /**
   * @private
   * @param {NormalizedComparisonSide} side
   * @param {{iconEl: HTMLElement|null, menuEl: HTMLElement|null}} controlsState
   * @returns {HTMLElement}
   */
  _renderHeader(side, controlsState) {
    const header = document.createElement('div');
    header.className = 'comparison-header';
    header.dataset.sideId = side.id;
    header.tabIndex = 0;
    header.setAttribute('role', 'button');
    header.setAttribute('aria-haspopup', 'dialog');
    header.setAttribute('title', 'ПКМ, Enter или клик для настройки иконки');

    const titleContainer = document.createElement('div');
    titleContainer.className = 'comparison-header-main';

    const iconSlot = document.createElement('span');
    iconSlot.className = 'comparison-header-icon';
    titleContainer.appendChild(iconSlot);

    if (side.icon) {
      const iconEl = document.createElement('i');
      iconEl.className = side.icon;
      iconSlot.appendChild(iconEl);
      controlsState.iconEl = iconEl;
    }

    const headerTitle = document.createElement('span');
    headerTitle.className = 'comparison-header-title';
    headerTitle.textContent = side.title;
    titleContainer.appendChild(headerTitle);

    header.appendChild(titleContainer);

    const openMenu = (event) => {
      event.preventDefault();
      event.stopPropagation();
      this._openIconMenu(side, header, iconSlot, controlsState, event);
    };

    header.addEventListener('contextmenu', (event) => {
      openMenu(event);
    });

    header.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        openMenu(event);
      }
    });

    header.addEventListener('click', (event) => {
      if (event.target.closest('.comparison-header-icon') || event.target.closest('.comparison-header-title')) {
        openMenu(event);
      }
    });

    header.addEventListener('dblclick', openMenu);

    return header;
  }

  /**
   * @private
   * @param {NormalizedComparisonSide} side
   * @param {HTMLElement} anchor
   * @param {HTMLElement} iconSlot
   * @param {{iconEl: HTMLElement|null, menuEl: HTMLElement|null}} controlsState
   * @param {MouseEvent|KeyboardEvent} triggerEvent
   */
  _openIconMenu(side, anchor, iconSlot, controlsState, triggerEvent) {
    if (controlsState.menuEl) {
      this._closeIconMenu(controlsState);
    }
    this._closeAllIconMenus(controlsState);

    const form = document.createElement('form');
    form.className = 'diagram-link-editor comparison-icon-editor is-visible';
    form.style.position = 'fixed';
    form.setAttribute('role', 'dialog');
    form.setAttribute('aria-label', `Иконка для "${side.title}"`);

    const title = document.createElement('div');
    title.className = 'diagram-link-editor__title';
    title.textContent = 'Иконка колонки';
    form.appendChild(title);

    const hint = document.createElement('div');
    hint.className = 'comparison-icon-editor__hint';
    hint.textContent = 'Выберите иконку из списка или введите классы Font Awesome.';
    form.appendChild(hint);

    const list = document.createElement('div');
    list.className = 'comparison-icon-editor__list';
    ICON_LIBRARY.forEach((iconDef) => {
      const option = document.createElement('button');
      option.type = 'button';
      option.className = 'comparison-icon-editor__option';
      option.innerHTML = `<i class="${iconDef.value}"></i><span>${iconDef.label}</span>`;
      if (iconDef.value === side.icon) {
        option.classList.add('is-active');
      }
      option.addEventListener('click', (event) => {
        event.preventDefault();
        this._applySideIcon(side, iconDef.value, iconSlot, controlsState);
      });
      list.appendChild(option);
    });
    form.appendChild(list);

    const inputId = `${side.id}-icon-classes`;
    const customLabel = document.createElement('label');
    customLabel.className = 'diagram-link-editor__label';
    customLabel.setAttribute('for', inputId);
    customLabel.textContent = 'Пользовательские классы';
    form.appendChild(customLabel);

    const customInput = document.createElement('input');
    customInput.id = inputId;
    customInput.className = 'diagram-link-editor__input comparison-icon-editor__input';
    customInput.placeholder = 'fa-light fa-...';
    customInput.value = side.icon ?? '';
    form.appendChild(customInput);

    const actions = document.createElement('div');
    actions.className = 'diagram-link-editor__actions comparison-icon-editor__actions';

    const saveBtn = document.createElement('button');
    saveBtn.type = 'submit';
    saveBtn.className = 'diagram-link-editor__btn primary';
    saveBtn.textContent = 'Сохранить';
    actions.appendChild(saveBtn);

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'diagram-link-editor__btn danger';
    removeBtn.textContent = 'Удалить';
    removeBtn.addEventListener('click', (event) => {
      event.preventDefault();
      this._clearSideIcon(side, iconSlot, controlsState);
    });
    actions.appendChild(removeBtn);

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'diagram-link-editor__btn';
    cancelBtn.textContent = 'Отмена';
    cancelBtn.addEventListener('click', (event) => {
      event.preventDefault();
      this._closeIconMenu(controlsState);
    });
    actions.appendChild(cancelBtn);

    form.appendChild(actions);

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const value = customInput.value.trim();
      this._applySideIcon(side, value || null, iconSlot, controlsState);
    });

    document.body.appendChild(form);
    controlsState.menuEl = form;

    // Позиционирование относительно указателя мыши, если доступно
    if (triggerEvent instanceof MouseEvent) {
      const margin = 12;
      const { clientX, clientY } = triggerEvent;
      const rect = form.getBoundingClientRect();
      let left = clientX;
      let top = clientY;

      if (left + rect.width > window.innerWidth - margin) {
        left = window.innerWidth - margin - rect.width;
      }
      if (left < margin) {
        left = margin;
      }
      if (top + rect.height > window.innerHeight - margin) {
        top = window.innerHeight - margin - rect.height;
      }
      if (top < margin) {
        top = margin;
      }

      form.style.left = `${left}px`;
      form.style.top = `${top}px`;
    } else {
      this._positionFloatingPanel(form, anchor);
    }

    requestAnimationFrame(() => form.classList.add('is-visible'));

    this._bindIconMenuDismiss(controlsState);
  }

  /**
   * @private
   * @param {{menuEl: HTMLElement|null}} controlsState
   */
  _closeIconMenu(controlsState) {
    if (!controlsState?.menuEl) {
      return;
    }
    controlsState.menuEl.classList.remove('is-visible');
    controlsState.menuEl.remove();
    controlsState.menuEl = null;
    this._disposeIconMenuListeners();
  }

  /**
   * @private
   * @param {{menuEl: HTMLElement|null}} [excludeState]
   */
  _closeAllIconMenus(excludeState) {
    this._sideControls.forEach((state) => {
      if (!state || state === excludeState) {
        return;
      }
      this._closeIconMenu(state);
    });
  }

  /**
   * @private
   * @param {{menuEl: HTMLElement|null}} controlsState
   */
  _bindIconMenuDismiss(controlsState) {
    this._disposeIconMenuListeners();
    if (!controlsState?.menuEl) {
      return;
    }

    const { menuEl } = controlsState;
    this._iconMenuAbortController = new AbortController();
    const { signal } = this._iconMenuAbortController;

    // Позволяем завершить текущий обработчик перед навешиванием слушателей
    setTimeout(() => {
      document.addEventListener(
        'click',
        (event) => {
          if (!menuEl.contains(event.target)) {
            this._closeIconMenu(controlsState);
          }
        },
        { signal, capture: true }
      );

      document.addEventListener(
        'keydown',
        (event) => {
          if (event.key === 'Escape') {
            this._closeIconMenu(controlsState);
          }
        },
        { signal, capture: true }
      );

      window.addEventListener(
        'resize',
        () => this._closeIconMenu(controlsState),
        { signal }
      );

      window.addEventListener(
        'scroll',
        () => this._closeIconMenu(controlsState),
        { signal, capture: true }
      );
    }, 0);
  }

  /**
   * @private
   */
  _disposeIconMenuListeners() {
    if (this._iconMenuAbortController) {
      this._iconMenuAbortController.abort();
      this._iconMenuAbortController = null;
    }
  }

  /**
   * @private
   * @param {NormalizedComparisonSide} side
   * @param {string|null} icon
   * @param {HTMLElement} iconSlot
   * @param {{iconEl: HTMLElement|null, menuEl: HTMLElement|null}} controlsState
   */
  _applySideIcon(side, icon, iconSlot, controlsState) {
    const normalized = this._normalizeIcon(icon);
    side.icon = normalized;

    iconSlot.innerHTML = '';

    if (normalized) {
      const iconEl = document.createElement('i');
      iconEl.className = normalized;
      iconSlot.appendChild(iconEl);
      controlsState.iconEl = iconEl;
    } else {
      controlsState.iconEl = null;
    }

    this._closeIconMenu(controlsState);
  }

  /**
   * @private
   * @param {NormalizedComparisonSide} side
   * @param {HTMLElement} iconSlot
   * @param {{iconEl: HTMLElement|null, menuEl: HTMLElement|null}} controlsState
   */
  _clearSideIcon(side, iconSlot, controlsState) {
    side.icon = null;
    iconSlot.innerHTML = '';
    controlsState.iconEl = null;
    this._closeIconMenu(controlsState);
  }

  /**
   * @private
   * @param {NormalizedComparisonSide} side
   * @returns {HTMLElement}
   */
  _renderCodeBody(side) {
    const wrapper = document.createElement('div');
    wrapper.className = 'comparison-code-wrapper';

    const codeString = side.content.join('\n');

    const codeBlock = new CodeBlock({
      id: `${side.id}-code`,
      type: 'code',
      position: 0,
      parentId: this.id,
      protected: true,
      data: {
        code: codeString,
        language: side.language || 'plaintext',
        readOnly: true,
        useMonaco: false,
        lineNumbers: false,
        minimap: false
      },
      code: codeString,
      language: side.language || 'plaintext',
      readOnly: true,
      useMonaco: false,
      lineNumbers: false,
      minimap: false
    });

    const rendered = codeBlock.render();
    rendered.classList.add('comparison-inline-code-block');
    wrapper.appendChild(rendered);
    return wrapper;
  }

  /**
   * @private
   * @param {HTMLElement} panel
   * @param {HTMLElement} anchor
   */
  _positionFloatingPanel(panel, anchor) {
    if (!panel || !anchor) {
      return;
    }

    const margin = 12;
    panel.style.visibility = 'hidden';
    panel.style.top = '0px';
    panel.style.left = '0px';

    // Гарантируем, что панель отображается для измерения
    if (!panel.classList.contains('is-open')) {
      panel.classList.add('is-open');
    }

    const panelRect = panel.getBoundingClientRect();
    const anchorRect = anchor.getBoundingClientRect();

    let top = anchorRect.bottom + margin;
    let left = anchorRect.left + (anchorRect.width / 2) - (panelRect.width / 2);

    if (top + panelRect.height > window.innerHeight - margin) {
      top = anchorRect.top - panelRect.height - margin;
    }

    if (top < margin) {
      top = margin;
    } else if (top + panelRect.height > window.innerHeight - margin) {
      top = window.innerHeight - margin - panelRect.height;
    }

    if (left < margin) {
      left = margin;
    } else if (left + panelRect.width > window.innerWidth - margin) {
      left = window.innerWidth - margin - panelRect.width;
    }

    panel.style.top = `${top}px`;
    panel.style.left = `${left}px`;
    panel.style.right = 'auto';
    panel.style.bottom = 'auto';
    panel.style.visibility = 'visible';
  }

  /**
   * @private
   * @param {string[]} content
   * @returns {HTMLElement}
   */
  _renderTextContent(content) {
    const fragment = document.createDocumentFragment();

    if (content.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'comparison-empty';
      empty.textContent = 'Нет данных';
      fragment.appendChild(empty);
      return fragment;
    }

    content.forEach(paragraph => {
      const p = document.createElement('p');
      p.textContent = paragraph;
      fragment.appendChild(p);
    });

    return fragment;
  }

  /**
   * @private
   * @param {NormalizedComparisonSide} side
   * @returns {Object}
   */
  _serializeSide(side) {
    const serialized = {
      title: side.title,
      icon: side.icon,
      status: side.status,
      mode: side.mode,
      language: side.language,
      content: side.mode === 'code'
        ? side.content.join('\n')
        : side.content.join('\n\n'),
      notes: [...side.notes]
    };

    if (side.mode === 'code') {
      serialized.lines = [...side.content];
    } else {
      serialized.paragraphs = [...side.content];
    }

    return serialized;
  }
}


