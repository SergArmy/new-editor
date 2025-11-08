import { Block } from '../base/Block.js';
import { CodeBlock } from '../content/CodeBlock.js';
import { openIconPicker } from '../../ui/components/IconPickerMenu.js';

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

    /** @type {NormalizedComparisonSection[]} */
    this.sections = this._normalizeSections(source);

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
    const column = document.createElement('div');
    column.className = 'comparison-column';
    column.dataset.role = role;
    column.dataset.sideId = side.id;

    if (side.status !== 'neutral') {
      column.classList.add(side.status);
    }

    const header = this._renderHeader(side);

    const body = document.createElement('div');
    body.className = 'comparison-body';

    if (side.status !== 'neutral') {
      body.classList.add(side.status);
    }

    if (side.mode === 'code') {
      body.classList.add('has-code');
      body.appendChild(this._renderCodeBody(side, role));
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

    return column;
  }

  /**
   * @private
   * @param {NormalizedComparisonSide} side
   * @returns {HTMLElement}
   */
  _renderHeader(side) {
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
    }

    const headerTitle = document.createElement('span');
    headerTitle.className = 'comparison-header-title';
    headerTitle.textContent = side.title;
    titleContainer.appendChild(headerTitle);

    header.appendChild(titleContainer);

    const openMenu = (event) => {
      event.preventDefault();
      event.stopPropagation();
      this._openIconPicker(side, header, iconSlot, event);
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
   * @param {MouseEvent|KeyboardEvent} triggerEvent
   */
  _openIconPicker(side, anchor, iconSlot, triggerEvent) {
    openIconPicker({
      anchor,
      triggerEvent,
      currentIcon: side.icon,
      onSelect: (icon) => {
        this._applySideIcon(side, icon.value, iconSlot);
      },
      onRemove: () => {
        this._clearSideIcon(side, iconSlot);
      },
      title: `Иконка для "${side.title}"`
    });
  }

  /**
   * @private
   * @param {NormalizedComparisonSide} side
   * @param {string|null} icon
   * @param {HTMLElement} iconSlot
   */
  _applySideIcon(side, icon, iconSlot) {
    const normalized = this._normalizeIcon(icon);
    side.icon = normalized;

    iconSlot.innerHTML = '';

    if (normalized) {
      const iconEl = document.createElement('i');
      iconEl.className = normalized;
      iconSlot.appendChild(iconEl);
    }
  }

  /**
   * @private
   * @param {NormalizedComparisonSide} side
   * @param {HTMLElement} iconSlot
   */
  _clearSideIcon(side, iconSlot) {
    side.icon = null;
    iconSlot.innerHTML = '';
  }

  /**
   * @private
   * @param {NormalizedComparisonSide} side
   * @returns {HTMLElement}
   */
  _renderCodeBody(side, role) {
    const wrapper = document.createElement('div');
    wrapper.className = 'comparison-code-wrapper';
    wrapper.classList.add(role === 'after' ? 'comparison-code-wrapper-after' : 'comparison-code-wrapper-before');

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
    rendered.dataset.role = role;
    if (role === 'after') {
      rendered.classList.add('comparison-inline-code-block', 'comparison-inline-code-block-after');
    } else {
      rendered.classList.add('comparison-inline-code-block-before');
    }
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


