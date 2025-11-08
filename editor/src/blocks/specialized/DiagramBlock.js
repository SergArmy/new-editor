import { Block } from '../base/Block.js';
import { CodeBlock } from '../content/CodeBlock.js';

const ENGINE_OPTIONS = [
  { value: 'plantuml', label: 'PlantUML', monacoLanguage: 'plantuml' },
  { value: 'mermaid', label: 'Mermaid', monacoLanguage: 'markdown' }
];

const FORMAT_OPTIONS = [
  { value: 'svg', label: 'SVG' },
  { value: 'png', label: 'PNG' }
];

const LINK_TEXT_COLOR = '#2563eb';
const LINK_BLOCK_FILL = 'rgba(59, 130, 246, 0.18)';
const LINK_BLOCK_STROKE = 'rgba(37, 99, 235, 0.55)';
const SELECTION_SCALE = 1.06;

/**
 * @typedef {Object} DiagramLink
 * @property {string} id
 * @property {string} selector
 * @property {string} href
 * @property {string} [title]
 * @property {boolean} [openInNewTab]
 */

/**
 * @typedef {Object} DiagramBlockData
 * @property {string} [title]
 * @property {string} [description]
 * @property {string} [engine]
 * @property {string} [theme]
 * @property {string} [renderUrl]
 * @property {string} [alt]
 * @property {string} [source]
 * @property {number} [contentHeight]
 */

/**
 * Блок визуализации диаграммы (PlantUML/Mermaid/etc.).
 */
export class DiagramBlock extends Block {
  /**
   * @param {Object} data
   */
  constructor(data) {
    super(data);

    /** @type {DiagramBlockData} */
    const source = data.data || data;

    this.title = typeof source.title === 'string' ? source.title : '';
    this.description = typeof source.description === 'string' ? source.description : '';
    this.engine = typeof source.engine === 'string' ? source.engine : 'plantuml';
    this.theme = typeof source.theme === 'string' ? source.theme : '';
    this.renderUrl = typeof source.renderUrl === 'string' ? source.renderUrl : '';
    this.alt = typeof source.alt === 'string' ? source.alt : 'Diagram preview';
    this.source = typeof source.source === 'string' ? source.source : '';
    this.format = typeof source.format === 'string' ? source.format : '';
    this.contentHeight = typeof source.contentHeight === 'number' ? source.contentHeight : 420;
    this.links = Array.isArray(source.links)
      ? source.links
        .map((link) => this._normalizeLink(link))
        .filter((link) => link !== null)
      : [];

    // Состояние отображения
    this.isCodeView = false; // false = preview, true = code editor
    this.zoomLevel = 1.0; // Текущий уровень масштаба

    /** @type {HTMLElement|null} */
    this.previewContainer = null;

    /** @type {HTMLElement|null} */
    this.contentContainer = null;

    /** @type {HTMLElement|null} */
    this.codeContainer = null;

    /** @type {HTMLElement|null} */
    this.imageElement = null;

    /** @type {SVGElement|null} */
    this._svgElement = null;

    /** @type {HTMLElement|null} */
    this._imageWrapper = null;

    /** @type {HTMLElement|null} */
    this.metaElement = null;

    /** @type {HTMLElement|null} */
    this.metaTrigger = null;

    /** @type {HTMLElement|null} */
    this.metaPopover = null;

    /** @type {HTMLElement|null} */
    this._linkEditor = null;

    /** @type {HTMLInputElement|null} */
    this._linkHrefInput = null;

    /** @type {HTMLInputElement|null} */
    this._linkNewTabInput = null;

    /** @type {HTMLElement|null} */
    this._currentLinkElement = null;

    /** @type {DiagramLink|null} */
    this._currentLinkDraft = null;

    /** @type {HTMLElement|null} */
    this._contextMenu = null;

    /** @type {Element|null} */
    this._contextMenuTarget = null;

    /** @type {DiagramLink|null} */
    this._contextMenuLink = null;

    /** @type {((event: MouseEvent) => void)|null} */
    this._boundMetaOutsideClick = null;

    /** @type {((event: MouseEvent) => void)|null} */
    this._previewClickHandler = null;

    /** @type {((event: MouseEvent) => void)|null} */
    this._previewContextHandler = null;

    /** @type {((event: MouseEvent) => void)|null} */
    this._contextMenuOutsideHandler = null;

    /** @type {CodeBlock|null} */
    this.codeBlock = null;

    /** @type {HTMLElement|null} */
    this.resizeHandle = null;

    /** @type {Map<Element, DiagramLink>} */
    this._linkMap = new Map();

    this._linkingAvailable = false;
    this._pendingSvgRequestId = null;
    this._lastSvgText = '';

    /** @type {(event: KeyboardEvent) => void} */
    this._handleKeyDownBound = this._handleKeyDown.bind(this);
    /** @type {boolean} */
    this._keyListenerAttached = false;
  }

  /**
   * @returns {HTMLElement}
   */
  render() {
    const el = super.render();
    el.className = 'block diagram-block';
    el.setAttribute('data-diagram-engine', this.engine);
    this.element = el;

    // Заголовок с метаданными
    const headerEl = this._createHeader();
    el.appendChild(headerEl);

    // Описание
    if (this.description) {
      const descriptionEl = document.createElement('div');
      descriptionEl.className = 'diagram-description';
      descriptionEl.textContent = this.description;
      el.appendChild(descriptionEl);
    }

    // Контейнер для превью и редактора кода
    const contentContainer = document.createElement('div');
    contentContainer.className = 'diagram-content-container';
    contentContainer.style.height = `${this.contentHeight}px`;
    this.contentContainer = contentContainer;

    // Превью диаграммы
    this.previewContainer = this._createPreviewContainer();
    contentContainer.appendChild(this.previewContainer);
    if (typeof this._bindPreviewEvents === 'function') {
      this._bindPreviewEvents();
    }

    if (this.renderUrl) {
      this._renderPreviewFromUrl(this.renderUrl);
    } else {
      this._renderPlaceholder('Предпросмотр диаграммы недоступен');
    }

    // Редактор кода (скрыт по умолчанию)
    if (this.source) {
      this.codeContainer = this._createCodeContainer();
      this.codeContainer.classList.add('is-hidden');
      contentContainer.appendChild(this.codeContainer);
    }

    this.resizeHandle = this._createResizeHandle();
    contentContainer.appendChild(this.resizeHandle);

    el.appendChild(contentContainer);

    if (!this._keyListenerAttached) {
      document.addEventListener('keydown', this._handleKeyDownBound, true);
      this._keyListenerAttached = true;
    }

    return el;
  }

  /**
   * Создает заголовок блока
   * @returns {HTMLElement}
   * @private
   */
  _createHeader() {
    const header = document.createElement('div');
    header.className = 'diagram-header';

    const leftSide = document.createElement('div');
    leftSide.className = 'diagram-header-left';

    if (this.title) {
      const titleEl = document.createElement('div');
      titleEl.className = 'diagram-title';
      titleEl.textContent = this.title;
      leftSide.appendChild(titleEl);
    }

    const rightSide = document.createElement('div');
    rightSide.className = 'diagram-header-right';

    const metaGroup = document.createElement('div');
    metaGroup.className = 'diagram-meta-group';

    const metaEl = document.createElement('div');
    metaEl.className = 'diagram-meta';
    metaEl.textContent = this._formatMeta();
    this.metaElement = metaEl;
    metaGroup.appendChild(metaEl);

    const actionsGroup = document.createElement('div');
    actionsGroup.className = 'diagram-header-actions';

    const settingsBtn = this._createButton('Настройки диаграммы', 'fa-gear', () => this._toggleMetaPopover());
    settingsBtn.classList.add('diagram-meta-trigger');
    this.metaTrigger = settingsBtn;
    actionsGroup.appendChild(settingsBtn);

    if (this.source) {
      const editBtn = this._createButton(
        this.isCodeView ? 'Показать превью' : 'Редактировать код',
        this.isCodeView ? 'fa-eye' : 'fa-code',
        () => this._toggleCodeView()
      );
      editBtn.classList.add('diagram-edit-btn');
      actionsGroup.appendChild(editBtn);
    }

    metaGroup.appendChild(actionsGroup);

    this.metaPopover = this._createMetaPopover();
    if (this.metaPopover) {
      metaGroup.appendChild(this.metaPopover);
    }

    rightSide.appendChild(metaGroup);

    header.appendChild(leftSide);
    header.appendChild(rightSide);

    return header;
  }

  /**
   * Создает контейнер для превью
   * @returns {HTMLElement}
   * @private
   */
  _createPreviewContainer() {
    const container = document.createElement('div');
    container.className = 'diagram-preview';

    const imageWrapper = document.createElement('div');
    imageWrapper.className = 'diagram-image-wrapper';
    imageWrapper.style.transform = `scale(${this.zoomLevel})`;
    this._imageWrapper = imageWrapper;

    container.appendChild(imageWrapper);
    container.appendChild(this._createOverlayControls());
    container.appendChild(this._createCopyOverlay());

    return container;
  }

  /**
   * Создает контейнер для редактора кода
   * @returns {HTMLElement}
   * @private
   */
  _createCodeContainer() {
    const container = document.createElement('div');
    container.className = 'diagram-code-editor';

    const codeBlock = new CodeBlock({
      id: `${this.id}-code-editor`,
      type: 'code',
      position: 0,
      code: this.source,
      language: this._mapEngineToLanguage(this.engine),
      lineNumbers: true,
      minimap: false,
      readOnly: false,
      useMonaco: true,
      height: this.contentHeight
    });

    const codeEl = codeBlock.render();
    codeEl.classList.add('diagram-code-block');
    container.appendChild(codeEl);

    codeBlock._notifyChange = () => {
      this.source = codeBlock.code;
      this._notifyChange();
    };

    this.codeBlock = codeBlock;

    return container;
  }

  /**
   * Создает кнопку
   * @param {string} title
   * @param {string} icon
   * @param {Function} onClick
   * @returns {HTMLElement}
   * @private
   */
  _createButton(title, icon, onClick) {
    const btn = document.createElement('button');
    btn.className = 'diagram-control-btn';
    btn.title = title;
    btn.setAttribute('aria-label', title);

    const iconEl = document.createElement('i');
    iconEl.className = `fa-light ${icon}`;
    btn.appendChild(iconEl);

    btn.addEventListener('click', (event) => {
      event.stopPropagation();
      onClick();
    });

    return btn;
  }

  /**
   * Переключает между превью и редактором кода
   * @private
   */
  _toggleCodeView() {
    this.isCodeView = !this.isCodeView;

    if (this.previewContainer && this.codeContainer) {
      this.previewContainer.classList.toggle('is-hidden', this.isCodeView);
      this.codeContainer.classList.toggle('is-hidden', !this.isCodeView);

      const editBtn = this.element?.querySelector('.diagram-edit-btn');
      if (editBtn) {
        editBtn.title = this.isCodeView ? 'Показать превью' : 'Редактировать код';
        const icon = editBtn.querySelector('i');
        if (icon) {
          icon.className = this.isCodeView ? 'fa-light fa-eye' : 'fa-light fa-code';
        }
      }

      if (this.codeBlock && this.codeBlock.monacoEditor) {
        this.codeBlock.monacoEditor.layout();
      }

      if (!this.isCodeView) {
        this._refreshPreviewAfterEdit();
      } else {
        this._hideLinkContextMenu();
        if (this._linkEditor) {
          this._destroyLinkEditor();
        }
        this._clearLinkSelection();
      }
    }
  }
  /**
   * Обновляет превью после редактирования кода
   * @private
   */
  _refreshPreviewAfterEdit() {
    if (this.renderUrl) {
      this._renderPreviewFromUrl(this.renderUrl);
    }
  }

  /**
   * Увеличивает масштаб
   * @private
   */
  _zoomIn() {
    this.zoomLevel = Math.min(this.zoomLevel + 0.25, 3.0);
    this._updateZoom();
  }

  /**
   * Уменьшает масштаб
   * @private
   */
  _zoomOut() {
    this.zoomLevel = Math.max(this.zoomLevel - 0.25, 0.25);
    this._updateZoom();
  }

  /**
   * Сбрасывает масштаб
   * @private
   */
  _zoomReset() {
    this.zoomLevel = 1.0;
    this._updateZoom();
  }

  /**
   * Обновляет масштаб изображения
   * @private
   */
  _updateZoom() {
    const wrapper = this.previewContainer?.querySelector('.diagram-image-wrapper');
    if (wrapper) {
      wrapper.style.transform = `scale(${this.zoomLevel})`;
    }
  }

  /**
   * Привязывает обработчики кликов по превью
   * @private
   */
  _bindPreviewEvents() {
    if (!this.previewContainer) {
      return;
    }

    if (this._previewClickHandler) {
      this.previewContainer.removeEventListener('click', this._previewClickHandler);
    }

    this._previewClickHandler = (event) => {
      if (this._isClickOnOverlay(event.target)) {
        return;
      }
      this._hideLinkContextMenu();
      this._handlePreviewNavigation(event);
    };

    this.previewContainer.addEventListener('click', this._previewClickHandler);

    if (this._previewContextHandler) {
      this.previewContainer.removeEventListener('contextmenu', this._previewContextHandler);
    }

    this._previewContextHandler = (event) => {
      if (this._isClickOnOverlay(event.target) || !this._linkingAvailable) {
        return;
      }
      const targetElement = this._resolveSvgTarget(event.target);
      if (!targetElement) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      const link = this._linkMap.get(targetElement) || null;
      this._showLinkContextMenu(event.clientX, event.clientY, targetElement, link);
    };

    this.previewContainer.addEventListener('contextmenu', this._previewContextHandler);
  }

  /**
   * Проверяет, был ли клик по контролам оверлея
   * @param {EventTarget|null} target
   * @returns {boolean}
   * @private
   */
  _isClickOnOverlay(target) {
    if (!(target instanceof Element)) {
      return false;
    }
    return Boolean(
      target.closest('.diagram-overlay-controls') ||
      target.closest('.diagram-overlay-copies') ||
      target.closest('.diagram-resize-handle') ||
      target.closest('.diagram-link-editor') ||
      target.closest('.diagram-link-context-menu')
    );
  }

  /**
   * Перерисовывает превью диаграммы
   * @param {string} url
   * @private
   */
  _renderPreviewFromUrl(url) {
    if (!this._imageWrapper) {
      return;
    }

    this._clearPreviewContent();

    const isSvg = this._isSvgUrl(url);
    this._linkingAvailable = isSvg;
    if (!isSvg) {
      this._hideLinkContextMenu();
      if (this._linkEditor) {
        this._destroyLinkEditor();
      }
      this._clearLinkSelection();
    }

    if (!url) {
      this._renderPlaceholder('Предпросмотр диаграммы недоступен');
      return;
    }

    if (isSvg) {
      this._loadSvg(url);
      return;
    }

    const img = document.createElement('img');
    img.src = url;
    img.alt = this.alt || 'Diagram preview';
    img.loading = 'lazy';
    img.addEventListener('click', () => this._openFullscreen());
    img.addEventListener('load', () => {
      this.imageElement = img;
      this._svgElement = null;
      this._linkMap.clear();
    });
    this.imageElement = img;
    this._imageWrapper.appendChild(img);
  }

  /**
   * Очищает текущее содержимое превью
   * @private
   */
  _clearPreviewContent() {
    this._lastSvgText = '';
    this._svgElement = null;
    this.imageElement = null;
    this._linkMap.clear();
    this._hideLinkContextMenu();
    this.previewContainer?.classList.remove('has-diagram-links');
    if (this._imageWrapper) {
      this._imageWrapper.innerHTML = '';
    }
  }

  /**
   * Рендерит плейсхолдер
   * @param {string} message
   * @private
   */
  _renderPlaceholder(message) {
    if (!this._imageWrapper) {
      return;
    }
    const placeholder = document.createElement('div');
    placeholder.className = 'diagram-placeholder';
    placeholder.textContent = message;
    this._imageWrapper.replaceChildren(placeholder);
  }

  /**
   * Проверяет, является ли URL svg-файлом
   * @param {string} url
   * @returns {boolean}
   * @private
   */
  _isSvgUrl(url) {
    return typeof url === 'string' && (url.toLowerCase().endsWith('.svg') || this.format === 'svg');
  }

  /**
   * Загружает и встраивает SVG
   * @param {string} url
   * @private
   */
  async _loadSvg(url) {
    const requestId = Symbol('svg-request');
    this._pendingSvgRequestId = requestId;

    try {
      if (typeof fetch !== 'function') {
        console.warn('Fetch API is not available, unable to load SVG preview.');
        this._renderPlaceholder('SVG недоступен в текущей среде');
        return;
      }

      const response = await fetch(url, { cache: 'no-store' });
      const svgText = await response.text();

      if (this._pendingSvgRequestId !== requestId) {
        return;
      }

      this._injectSvg(svgText);
    } catch (error) {
      console.error('Failed to load SVG preview:', error);
      this._renderPlaceholder('Ошибка загрузки SVG диаграммы');
    }
  }

  /**
   * Встраивает SVG текст в превью
   * @param {string} svgText
   * @private
   */
  _injectSvg(svgText) {
    if (!this._imageWrapper) {
      return;
    }

    this._clearPreviewContent();

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgText, 'image/svg+xml');
      const svg = doc.documentElement;

      if (!svg || svg.tagName.toLowerCase() !== 'svg') {
        throw new Error('Invalid SVG content');
      }

      svg.setAttribute('data-diagram-svg', 'true');
      svg.style.maxWidth = '100%';
      svg.style.maxHeight = '100%';

      this._imageWrapper.appendChild(svg);
      this._svgElement = svg;
      this._lastSvgText = svgText;

      this._applyLinks();
    } catch (error) {
      console.error('Failed to parse SVG:', error);
      this._renderPlaceholder('Ошибка обработки SVG');
    }
  }

  /**
   * Возвращает встроенный SVG элемент
   * @returns {SVGElement|null}
   * @private
   */
  _getSvgElement() {
    if (this._svgElement) {
      return this._svgElement;
    }
    if (this._imageWrapper) {
      const svg = this._imageWrapper.querySelector('svg');
      if (svg instanceof SVGElement) {
        this._svgElement = svg;
        return svg;
      }
    }
    return null;
  }

  /**
   * Применяет сохраненные ссылки к элементам SVG
   * @private
   */
  _applyLinks() {
    const svg = this._getSvgElement();
    if (!svg) {
      return;
    }

    svg.querySelectorAll('[data-diagram-link-id]').forEach((node) => {
      this._resetLinkedElementState(node);
    });

    this._linkMap.clear();

    this.links.forEach((link) => {
      if (!link.selector || !link.href) {
        return;
      }
      try {
        const target = svg.querySelector(link.selector);
        if (target instanceof Element) {
          target.setAttribute('data-diagram-link-id', link.id);
          this._decorateLinkedElement(target);
          this._linkMap.set(target, link);
        }
      } catch (error) {
        console.warn(`Failed to apply diagram link for selector "${link.selector}"`, error);
      }
    });

    const hasLinks = this._linkMap.size > 0;
    this.previewContainer?.classList.toggle('has-diagram-links', hasLinks);
    svg.classList.toggle('has-diagram-links', hasLinks);
  }

  /**
   * Настраивает внешний вид элемента с установленной ссылкой
   * @param {Element} element
   * @private
   */
  _decorateLinkedElement(element) {
    if (!(element instanceof Element)) {
      return;
    }

    element.classList.add('diagram-link-target');

    const isText = this._isTextLikeElement(element);
    element.dataset.diagramLinkType = isText ? 'text' : 'block';
    element.classList.toggle('diagram-link-text', isText);
    element.classList.toggle('diagram-link-block', !isText);

    if (element.dataset.diagramLinkOriginalTransform === undefined) {
      element.dataset.diagramLinkOriginalTransform = element.style.transform || '';
    }
    if (element.dataset.diagramLinkOriginalTransformOrigin === undefined) {
      element.dataset.diagramLinkOriginalTransformOrigin = element.style.transformOrigin || '';
    }
    if (element.dataset.diagramLinkOriginalTransformBox === undefined) {
      element.dataset.diagramLinkOriginalTransformBox = element.style.transformBox || '';
    }

    const bbox = typeof element.getBBox === 'function' ? element.getBBox() : null;
    if (bbox && Number.isFinite(bbox.width) && Number.isFinite(bbox.height)) {
      const originX = bbox.x + bbox.width / 2;
      const originY = bbox.y + bbox.height / 2;
      element.dataset.diagramLinkOriginX = String(originX);
      element.dataset.diagramLinkOriginY = String(originY);
      element.style.transformOrigin = `${originX}px ${originY}px`;
      element.style.transformBox = 'fill-box';
    } else {
      element.style.transformOrigin = 'center';
      element.style.transformBox = 'fill-box';
      element.dataset.diagramLinkOriginX = '';
      element.dataset.diagramLinkOriginY = '';
    }

    if (element.dataset.diagramLinkOriginalFillStyle === undefined) {
      element.dataset.diagramLinkOriginalFillStyle = element.style.fill || '';
    }

    if (!isText && this._isShapeElement(element)) {
      if (element.dataset.diagramLinkOriginalStrokeStyle === undefined) {
        element.dataset.diagramLinkOriginalStrokeStyle = element.style.stroke || '';
      }
      if (element.dataset.diagramLinkAddedStroke === undefined) {
        element.dataset.diagramLinkAddedStroke = '';
      }
    }

    if (isText) {
      if (element.dataset.diagramLinkOriginalTextDecoration === undefined) {
        element.dataset.diagramLinkOriginalTextDecoration = element.style.textDecoration || '';
      }
      if (element.dataset.diagramLinkOriginalTextDecorationColor === undefined) {
        element.dataset.diagramLinkOriginalTextDecorationColor = element.style.textDecorationColor || '';
      }

      element.style.fill = 'var(--diagram-link-text-color, ' + LINK_TEXT_COLOR + ')';
      element.style.textDecoration = 'underline';
      element.style.textDecorationColor = 'var(--diagram-link-text-color, ' + LINK_TEXT_COLOR + ')';
    } else if (this._isShapeElement(element)) {
      element.style.fill = 'var(--diagram-link-block-fill, ' + LINK_BLOCK_FILL + ')';
      if (!element.style.stroke && !element.hasAttribute('stroke')) {
        element.dataset.diagramLinkAddedStroke = '1';
        element.style.stroke = 'var(--diagram-link-block-stroke, ' + LINK_BLOCK_STROKE + ')';
      }
    }

    if (element.dataset.diagramLinkHadTabindex === undefined) {
      element.dataset.diagramLinkHadTabindex = element.hasAttribute('tabindex') ? '1' : '0';
      if (element.dataset.diagramLinkHadTabindex === '1') {
        element.dataset.diagramLinkOriginalTabindex = element.getAttribute('tabindex') ?? '';
      }
    }

    if (!element.hasAttribute('tabindex')) {
      element.setAttribute('tabindex', '0');
    }
  }

  /**
   * Сбрасывает визуальные изменения элемента со ссылкой
   * @param {Element} element
   * @private
   */
  _resetLinkedElementState(element) {
    if (!(element instanceof Element)) {
      return;
    }

    this._restoreSelectionTransform(element);

    const originalTransform = element.dataset.diagramLinkOriginalTransform;
    if (originalTransform !== undefined) {
      element.style.transform = originalTransform;
      delete element.dataset.diagramLinkOriginalTransform;
    } else {
      element.style.transform = '';
    }

    const originalTransformOrigin = element.dataset.diagramLinkOriginalTransformOrigin;
    if (originalTransformOrigin !== undefined) {
      element.style.transformOrigin = originalTransformOrigin;
      delete element.dataset.diagramLinkOriginalTransformOrigin;
    } else {
      element.style.transformOrigin = '';
    }

    const originalTransformBox = element.dataset.diagramLinkOriginalTransformBox;
    if (originalTransformBox !== undefined) {
      element.style.transformBox = originalTransformBox;
      delete element.dataset.diagramLinkOriginalTransformBox;
    } else {
      element.style.transformBox = '';
    }

    delete element.dataset.diagramLinkOriginX;
    delete element.dataset.diagramLinkOriginY;

    const storedFill = element.dataset.diagramLinkOriginalFillStyle;
    if (storedFill !== undefined) {
      element.style.fill = storedFill;
      delete element.dataset.diagramLinkOriginalFillStyle;
    } else {
      element.style.fill = '';
    }

    if (this._isShapeElement(element)) {
      const storedStroke = element.dataset.diagramLinkOriginalStrokeStyle;
      if (storedStroke !== undefined) {
        element.style.stroke = storedStroke;
        delete element.dataset.diagramLinkOriginalStrokeStyle;
      } else if (element.dataset.diagramLinkAddedStroke === '1') {
        element.style.stroke = '';
      }
      delete element.dataset.diagramLinkAddedStroke;
    }

    const storedDecoration = element.dataset.diagramLinkOriginalTextDecoration;
    if (storedDecoration !== undefined) {
      element.style.textDecoration = storedDecoration;
      delete element.dataset.diagramLinkOriginalTextDecoration;
    } else if (element.dataset.diagramLinkType === 'text') {
      element.style.textDecoration = '';
    }

    const storedDecorationColor = element.dataset.diagramLinkOriginalTextDecorationColor;
    if (storedDecorationColor !== undefined) {
      element.style.textDecorationColor = storedDecorationColor;
      delete element.dataset.diagramLinkOriginalTextDecorationColor;
    } else if (element.dataset.diagramLinkType === 'text') {
      element.style.textDecorationColor = '';
    }

    if (element.dataset.diagramLinkHadTabindex !== undefined) {
      if (element.dataset.diagramLinkHadTabindex === '1') {
        const originalTabIndex = element.dataset.diagramLinkOriginalTabindex ?? '';
        element.setAttribute('tabindex', originalTabIndex);
      } else {
        element.removeAttribute('tabindex');
      }
      delete element.dataset.diagramLinkHadTabindex;
      delete element.dataset.diagramLinkOriginalTabindex;
    } else {
      element.removeAttribute('tabindex');
    }

    element.classList.remove('diagram-link-target', 'diagram-link-text', 'diagram-link-block', 'diagram-link-selected');
    element.removeAttribute('data-diagram-link-id');
    delete element.dataset.diagramLinkType;
  }

  /**
   * Проверяет, является ли элемент текстовым
   * @param {Element} element
   * @returns {boolean}
   * @private
   */
  _isTextLikeElement(element) {
    const textTags = ['text', 'tspan', 'textpath'];
    return textTags.includes(element.tagName.toLowerCase());
  }

  /**
   * Проверяет, является ли элемент базовой SVG-фигурой
   * @param {Element} element
   * @returns {boolean}
   * @private
   */
  _isShapeElement(element) {
    const shapeTags = ['rect', 'circle', 'ellipse', 'path', 'polygon', 'polyline', 'line'];
    return shapeTags.includes(element.tagName.toLowerCase());
  }

  /**
   * Обрабатывает клик по превью в режиме навигации
   * @param {MouseEvent} event
   * @private
   */
  _handlePreviewNavigation(event) {
    const targetElement = this._findLinkedElement(event.target);
    if (!targetElement) {
      return;
    }
    const link = this._linkMap.get(targetElement);
    if (!link || !link.href) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this._navigateToLink(link, event);
  }

  /**
   * Возвращает элемент SVG с привязанной ссылкой
   * @param {EventTarget|null} target
   * @returns {Element|null}
   * @private
   */
  _findLinkedElement(target) {
    if (!(target instanceof Element)) {
      return null;
    }
    const svg = this._getSvgElement();
    if (!svg || !svg.contains(target)) {
      return null;
    }

    let current = target;
    while (current && current !== svg) {
      if (this._linkMap.has(current)) {
        return current;
      }
      current = current.parentElement;
    }
    return null;
  }

  /**
   * Переходит по ссылке
   * @param {DiagramLink} link
   * @param {MouseEvent} event
   * @private
   */
  _navigateToLink(link, event) {
    const openInNewTab = link.openInNewTab ?? true;
    const shouldOpenInNewTab = openInNewTab || event.ctrlKey || event.metaKey || event.button === 1;

    if (shouldOpenInNewTab) {
      window.open(link.href, '_blank', 'noopener');
      return;
    }

    window.location.assign(link.href);
  }

  /**
   * Показывает контекстное меню для управления ссылками
   * @param {number} clientX
   * @param {number} clientY
   * @param {Element} element
   * @param {DiagramLink|null} link
   * @private
   */
  _showLinkContextMenu(clientX, clientY, element, link) {
    if (!this._linkingAvailable) {
      return;
    }

    this._ensureLinkContextMenu();
    if (!this._contextMenu) {
      return;
    }

    this._hideLinkContextMenu({ preserveSelection: true });

    this._contextMenuTarget = element;
    this._contextMenuLink = link;
    this._highlightLinkElement(element);
    this._populateLinkContextMenu(link);

    const hostRect = (this.contentContainer || this.previewContainer)?.getBoundingClientRect();
    if (hostRect) {
      const menuRect = this._contextMenu.getBoundingClientRect();
      let left = clientX - hostRect.left;
      let top = clientY - hostRect.top;

      if (!Number.isFinite(left) || !Number.isFinite(top)) {
        left = 0;
        top = 0;
      }

      left = Math.max(0, Math.min(left, hostRect.width - menuRect.width));
      top = Math.max(0, Math.min(top, hostRect.height - menuRect.height));

      this._contextMenu.style.left = `${left}px`;
      this._contextMenu.style.top = `${top}px`;
    }

    this._contextMenu.classList.add('is-visible');

    if (!this._contextMenuOutsideHandler) {
      this._contextMenuOutsideHandler = (event) => {
        if (this._isClickOnOverlay(event.target)) {
          return;
        }
        if (this._contextMenu && !this._contextMenu.contains(/** @type {Node} */(event.target))) {
          this._hideLinkContextMenu();
        }
      };
    }

    document.addEventListener('click', this._contextMenuOutsideHandler, true);
  }

  /**
   * Создает DOM-контекстное меню при необходимости
   * @private
   */
  _ensureLinkContextMenu() {
    if (this._contextMenu || !this.contentContainer) {
      return;
    }

    const menu = document.createElement('div');
    menu.className = 'diagram-link-context-menu';
    this.contentContainer.appendChild(menu);
    this._contextMenu = menu;
  }

  /**
   * Заполняет контекстное меню пунктами
   * @param {DiagramLink|null} link
   * @private
   */
  _populateLinkContextMenu(link) {
    if (!this._contextMenu) {
      return;
    }

    this._contextMenu.innerHTML = '';

    const list = document.createElement('div');
    list.className = 'diagram-link-context-menu__list';

    const actions = link
      ? [
        { id: 'edit', label: 'Редактировать ссылку' },
        { id: 'remove', label: 'Удалить ссылку' }
      ]
      : [{ id: 'add', label: 'Добавить ссылку' }];

    actions.forEach((action) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'diagram-link-context-menu__item';
      item.textContent = action.label;
      item.dataset.action = action.id;
      item.addEventListener('click', () => this._handleContextMenuAction(action.id));
      list.appendChild(item);
    });

    this._contextMenu.appendChild(list);
  }

  /**
   * Обрабатывает выбранный пункт контекстного меню
   * @param {'add'|'edit'|'remove'} action
   * @private
   */
  _handleContextMenuAction(action) {
    const element = this._contextMenuTarget;
    const link = this._contextMenuLink;

    if (!element) {
      this._hideLinkContextMenu();
      return;
    }

    if (action === 'add' || action === 'edit') {
      this._hideLinkContextMenu({ preserveSelection: true });
      this._openLinkEditorForElement(element, action === 'edit' ? link : null);
      return;
    }

    if (action === 'remove') {
      this._currentLinkElement = element;
      this._currentLinkDraft = link;
      this._hideLinkContextMenu();
      this._removeCurrentLink();
    }
  }

  /**
   * Скрывает контекстное меню
   * @param {{ preserveSelection?: boolean }} [options]
   * @private
   */
  _hideLinkContextMenu(options = {}) {
    const preserveSelection = options.preserveSelection === true;

    if (this._contextMenu) {
      this._contextMenu.classList.remove('is-visible');
    }

    if (this._contextMenuOutsideHandler) {
      document.removeEventListener('click', this._contextMenuOutsideHandler, true);
      this._contextMenuOutsideHandler = null;
    }

    this._contextMenuTarget = null;
    this._contextMenuLink = null;

    if (!preserveSelection) {
      this._clearLinkSelection();
    }
  }

  /**
   * Находит подходящий узел SVG для привязки ссылки
   * @param {EventTarget|null} target
   * @returns {Element|null}
   * @private
   */
  _resolveSvgTarget(target) {
    if (!(target instanceof Element)) {
      return null;
    }

    const svg = this._getSvgElement();
    if (!svg) {
      return null;
    }

    let current = target;
    while (current && current !== svg) {
      if (current.tagName && current.tagName.toLowerCase() !== 'svg') {
        return current;
      }
      current = current.parentElement;
    }

    return null;
  }

  /**
   * Подсвечивает выбранный элемент
   * @param {Element} element
   * @private
   */
  _highlightLinkElement(element) {
    this._clearLinkSelection();
    this._applySelectionTransform(element);
    element.classList.add('diagram-link-selected');
    this._currentLinkElement = element;
  }

  /**
   * Сбрасывает выделение и текущие данные
   * @private
   */
  _clearLinkSelection() {
    const svg = this._getSvgElement();
    if (svg) {
      svg.querySelectorAll('.diagram-link-selected').forEach((node) => {
        this._restoreSelectionTransform(node);
        node.classList.remove('diagram-link-selected');
      });
    }
    this._currentLinkElement = null;
    this._currentLinkDraft = null;
  }

  /**
   * Применяет масштабирование к текущему выделенному элементу
   * @param {Element} element
   * @private
   */
  _applySelectionTransform(element) {
    if (!(element instanceof Element)) {
      return;
    }

    const baseTransform = element.dataset.diagramLinkOriginalTransform ?? '';
    const originX = element.dataset.diagramLinkOriginX;
    const originY = element.dataset.diagramLinkOriginY;

    let selectionTransform = `scale(${SELECTION_SCALE})`;
    if (originX && originY && originX !== '' && originY !== '') {
      const ox = Number(originX);
      const oy = Number(originY);
      if (Number.isFinite(ox) && Number.isFinite(oy)) {
        selectionTransform = `translate(${ox}px, ${oy}px) scale(${SELECTION_SCALE}) translate(${-ox}px, ${-oy}px)`;
      }
    }

    element.dataset.diagramLinkSelectionTransform = selectionTransform;
    const base = baseTransform.trim();
    element.style.transform = base ? `${base} ${selectionTransform}` : selectionTransform;
  }

  /**
   * Восстанавливает исходный трансформ элемента после снятия выделения
   * @param {Element} element
   * @private
   */
  _restoreSelectionTransform(element) {
    if (!(element instanceof Element)) {
      return;
    }

    const baseTransform = element.dataset.diagramLinkOriginalTransform;
    if (baseTransform !== undefined) {
      element.style.transform = baseTransform;
    } else {
      element.style.transform = '';
    }
    delete element.dataset.diagramLinkSelectionTransform;
  }

  /**
   * Создает и отображает редактор ссылки
   * @param {Element} element
   * @param {DiagramLink|null} link
   * @private
   */
  _openLinkEditorForElement(element, link) {
    this._hideLinkContextMenu({ preserveSelection: true });
    this._highlightLinkElement(element);

    this._ensureLinkEditor();
    if (!this._linkEditor || !this._linkHrefInput || !this._linkNewTabInput) {
      return;
    }

    this._currentLinkDraft = link ? { ...link } : null;

    this._linkHrefInput.value = link?.href ?? '';
    this._linkNewTabInput.checked = link?.openInNewTab !== false;

    this._linkEditor.classList.add('is-visible');
    this._linkEditor.style.visibility = 'hidden';
    this._positionLinkEditor(element);
    this._linkEditor.style.visibility = '';
    this._linkHrefInput.focus();
    this._linkHrefInput.select();
  }

  /**
   * Создает DOM редактора, если он отсутствует
   * @private
   */
  _ensureLinkEditor() {
    if (this._linkEditor) {
      return;
    }

    if (!this.contentContainer) {
      return;
    }

    const editor = document.createElement('form');
    editor.className = 'diagram-link-editor';
    editor.style.position = 'fixed';
    editor.style.top = '0';
    editor.style.left = '0';
    editor.addEventListener('submit', (event) => {
      event.preventDefault();
      this._saveCurrentLink();
    });

    const title = document.createElement('div');
    title.className = 'diagram-link-editor__title';
    title.textContent = 'Ссылка на элемент';

    const hrefLabel = document.createElement('label');
    hrefLabel.className = 'diagram-link-editor__label';
    hrefLabel.textContent = 'URL или идентификатор';

    const hrefInput = document.createElement('input');
    hrefInput.type = 'text';
    hrefInput.placeholder = 'https://example.com или #anchor';
    hrefInput.className = 'diagram-link-editor__input';
    hrefInput.required = false;

    const extraControls = document.createElement('div');
    extraControls.className = 'diagram-link-editor__extras';

    const newTabLabel = document.createElement('label');
    newTabLabel.className = 'diagram-link-editor__checkbox';

    const newTabInput = document.createElement('input');
    newTabInput.type = 'checkbox';
    newTabInput.checked = true;

    const newTabText = document.createElement('span');
    newTabText.textContent = 'Открывать в новой вкладке';

    newTabLabel.appendChild(newTabInput);
    newTabLabel.appendChild(newTabText);
    extraControls.appendChild(newTabLabel);

    const actions = document.createElement('div');
    actions.className = 'diagram-link-editor__actions';

    const saveBtn = document.createElement('button');
    saveBtn.type = 'submit';
    saveBtn.className = 'diagram-link-editor__btn primary';
    saveBtn.textContent = 'Сохранить';

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'diagram-link-editor__btn danger';
    removeBtn.textContent = 'Удалить';
    removeBtn.addEventListener('click', (event) => {
      event.preventDefault();
      this._removeCurrentLink();
    });

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'diagram-link-editor__btn';
    cancelBtn.textContent = 'Отмена';
    cancelBtn.addEventListener('click', () => {
      this._destroyLinkEditor();
      this._clearLinkSelection();
    });

    actions.appendChild(saveBtn);
    actions.appendChild(removeBtn);
    actions.appendChild(cancelBtn);

    editor.appendChild(title);
    editor.appendChild(hrefLabel);
    editor.appendChild(hrefInput);
    editor.appendChild(extraControls);
    editor.appendChild(actions);

    document.body.appendChild(editor);

    this._linkEditor = editor;
    this._linkHrefInput = hrefInput;
    this._linkNewTabInput = newTabInput;
  }

  /**
   * Размещает редактор рядом с выбранным элементом
   * @param {Element} element
   * @private
   */
  _positionLinkEditor(element) {
    if (!this._linkEditor) {
      return;
    }

    const editor = this._linkEditor;
    const elementRect = element.getBoundingClientRect();

    const viewportWidth = Math.max(document.documentElement?.clientWidth ?? 0, window.innerWidth ?? 0);
    const viewportHeight = Math.max(document.documentElement?.clientHeight ?? 0, window.innerHeight ?? 0);

    const editorWidth = editor.offsetWidth;
    const editorHeight = editor.offsetHeight;

    let left = elementRect.right + 16;
    let top = elementRect.top - 12;

    if (Number.isFinite(editorWidth) && editorWidth > 0) {
      if (left + editorWidth > viewportWidth - 16) {
        left = elementRect.left - editorWidth - 16;
      }
      if (left < 16) {
        left = 16;
      }
    }

    if (Number.isFinite(editorHeight) && editorHeight > 0) {
      if (top + editorHeight > viewportHeight - 16) {
        top = viewportHeight - editorHeight - 16;
      }
      if (top < 16) {
        top = 16;
      }
    }

    editor.style.left = `${Math.round(left)}px`;
    editor.style.top = `${Math.round(top)}px`;
    editor.style.right = 'auto';
    editor.style.bottom = 'auto';
  }

  /**
   * Удаляет редактор ссылок
   * @private
   */
  _destroyLinkEditor() {
    if (this._linkEditor && this._linkEditor.parentElement) {
      this._linkEditor.parentElement.removeChild(this._linkEditor);
    }
    this._linkEditor = null;
    this._linkHrefInput = null;
    this._linkNewTabInput = null;
  }

  /**
   * Сохраняет текущую ссылку
   * @private
   */
  _saveCurrentLink() {
    if (!this._currentLinkElement || !this._linkHrefInput) {
      return;
    }

    const href = this._linkHrefInput.value.trim();
    const openInNewTab = this._linkNewTabInput ? this._linkNewTabInput.checked : true;

    const selector = this._currentLinkDraft?.selector ?? this._buildSelectorForElement(this._currentLinkElement);
    if (!selector) {
      console.warn('Unable to build selector for diagram element');
      return;
    }

    if (!href) {
      this.links = this.links.filter((link) => link.selector !== selector);
      this._applyLinks();
      this._notifyChange();
      this._destroyLinkEditor();
      this._clearLinkSelection();
      return;
    }

    const existingIndex = this.links.findIndex((link) => link.selector === selector);
    const nextLink = {
      id: this._currentLinkDraft?.id ?? this._generateLinkId(),
      selector,
      href,
      title: this._currentLinkDraft?.title ?? '',
      openInNewTab
    };

    if (existingIndex >= 0) {
      this.links.splice(existingIndex, 1, nextLink);
    } else {
      this.links.push(nextLink);
    }

    this._applyLinks();
    this._notifyChange();
    this._destroyLinkEditor();
    this._clearLinkSelection();
  }

  /**
   * Удаляет текущую ссылку
   * @private
   */
  _removeCurrentLink() {
    if (!this._currentLinkElement) {
      return;
    }

    const selector = this._currentLinkDraft?.selector ?? this._buildSelectorForElement(this._currentLinkElement);
    if (!selector) {
      this._destroyLinkEditor();
      this._clearLinkSelection();
      return;
    }

    const beforeCount = this.links.length;
    this.links = this.links.filter((link) => link.selector !== selector);
    if (this.links.length !== beforeCount) {
      this._applyLinks();
      this._notifyChange();
    }

    this._destroyLinkEditor();
    this._clearLinkSelection();
  }

  /**
   * Выполняет нормализацию данных ссылки
   * @param {any} raw
   * @returns {DiagramLink|null}
   * @private
   */
  _normalizeLink(raw) {
    if (!raw || typeof raw !== 'object') {
      return null;
    }

    const selector = typeof raw.selector === 'string' ? raw.selector.trim() : '';
    const href = typeof raw.href === 'string' ? raw.href.trim() : '';

    if (!selector) {
      return null;
    }

    return {
      id: typeof raw.id === 'string' && raw.id ? raw.id : this._generateLinkId(),
      selector,
      href,
      title: typeof raw.title === 'string' ? raw.title : '',
      openInNewTab: raw.openInNewTab !== false
    };
  }

  /**
   * Формирует уникальный идентификатор
   * @returns {string}
   * @private
   */
  _generateLinkId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `diagram-link-${Math.random().toString(36).substring(2, 10)}`;
  }

  /**
   * Формирует CSS-селектор для элемента диаграммы
   * @param {Element} element
   * @returns {string}
   * @private
   */
  _buildSelectorForElement(element) {
    const svg = this._getSvgElement();
    if (!svg || !svg.contains(element)) {
      return '';
    }

    if (element.id) {
      return `#${this._escapeCssIdentifier(element.id)}`;
    }

    const path = [];
    let current = element;
    while (current && current !== svg) {
      let selector = current.tagName.toLowerCase();
      const parent = current.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter((child) => child.tagName === current.tagName);
        if (siblings.length > 1) {
          const index = siblings.indexOf(current) + 1;
          selector += `:nth-of-type(${index})`;
        }
      }
      path.unshift(selector);
      current = current.parentElement;
    }

    return path.join(' > ');
  }

  /**
   * Экранирует CSS идентификатор
   * @param {string} value
   * @returns {string}
   * @private
   */
  _escapeCssIdentifier(value) {
    if (typeof CSS !== 'undefined' && CSS.escape) {
      return CSS.escape(value);
    }
    return value.replace(/([ !"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, '\\$1');
  }

  /**
   * Создает оверлей с кнопками управления масштабом
   * @returns {HTMLElement}
   * @private
   */
  _createOverlayControls() {
    const overlay = document.createElement('div');
    overlay.className = 'diagram-overlay-controls';

    const zoomOutBtn = this._createButton('Уменьшить', 'fa-magnifying-glass-minus', () => this._zoomOut());
    const zoomResetBtn = this._createButton('Сбросить масштаб', 'fa-arrows-rotate', () => this._zoomReset());
    const zoomInBtn = this._createButton('Увеличить', 'fa-magnifying-glass-plus', () => this._zoomIn());
    const fullscreenBtn = this._createButton('Открыть в полном размере', 'fa-expand', () => this._openFullscreen());

    overlay.appendChild(zoomOutBtn);
    overlay.appendChild(zoomResetBtn);
    overlay.appendChild(zoomInBtn);
    overlay.appendChild(fullscreenBtn);

    return overlay;
  }

  /**
   * Создает блок копирования
   * @returns {HTMLElement}
   * @private
   */
  _createCopyOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'diagram-overlay-copies';

    const copySvgBtn = this._createButton('Копировать SVG', 'fa-copy', () => this._copySvg());
    copySvgBtn.classList.add('diagram-copy-btn');

    const copyPngBtn = this._createButton('Копировать PNG', 'fa-image', () => this._copyPng());
    copyPngBtn.classList.add('diagram-copy-btn');

    overlay.appendChild(copySvgBtn);
    overlay.appendChild(copyPngBtn);

    return overlay;
  }

  /**
   * Открывает изображение в полноэкранном режиме
   * @private
   */
  _openFullscreen() {
    const modal = document.createElement('div');
    modal.className = 'diagram-fullscreen-modal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.right = '0';
    modal.style.bottom = '0';
    modal.style.zIndex = '2147483647';

    const closeModal = () => this._closeFullscreen(modal, onKeyDown);
    modal.addEventListener('click', closeModal);

    const content = document.createElement('div');
    content.className = 'diagram-fullscreen-content';
    content.addEventListener('click', (e) => e.stopPropagation());

    const svgElement = this._getSvgElement();
    if (svgElement) {
      const svgClone = /** @type {SVGElement} */ (svgElement.cloneNode(true));
      svgClone.classList.add('diagram-fullscreen-svg');
      svgClone.removeAttribute('data-diagram-svg');
      svgClone.querySelectorAll('[data-diagram-link-id]').forEach((node) => {
        node.removeAttribute('data-diagram-link-id');
        node.classList.remove('diagram-link-target', 'diagram-link-selected');
      });
      content.appendChild(svgClone);
    } else if (this.renderUrl) {
      const img = document.createElement('img');
      img.src = this.renderUrl;
      img.alt = this.alt || 'Diagram preview';
      img.className = 'diagram-fullscreen-image';
      img.onerror = () => {
        content.replaceChildren(this._createFullscreenPlaceholder());
      };
      content.appendChild(img);
    } else if (this.imageElement && this.imageElement.tagName === 'IMG') {
      const imgClone = /** @type {HTMLImageElement} */ (this.imageElement.cloneNode(true));
      imgClone.classList.add('diagram-fullscreen-image');
      imgClone.removeAttribute('loading');
      content.appendChild(imgClone);
    } else {
      content.appendChild(this._createFullscreenPlaceholder());
    }

    const closeBtn = document.createElement('button');
    closeBtn.className = 'diagram-fullscreen-close';
    closeBtn.innerHTML = '<i class="fa-light fa-xmark"></i>';
    closeBtn.title = 'Закрыть';
    closeBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      closeModal();
    });
    content.appendChild(closeBtn);

    modal.appendChild(content);
    document.body.appendChild(modal);
    document.body.classList.add('diagram-modal-open');

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };
    modal.__keyDownHandler = onKeyDown;
    document.addEventListener('keydown', onKeyDown);
  }

  /**
   * @param {KeyboardEvent} event
   * @private
   */
  _handleKeyDown(event) {
    if (event.key === 'Escape') {
      if (this._contextMenu && this._contextMenu.classList.contains('is-visible')) {
        this._hideLinkContextMenu();
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      if (this._linkEditor) {
        this._destroyLinkEditor();
        this._clearLinkSelection();
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      if (this.metaPopover?.classList.contains('is-open')) {
        this._toggleMetaPopover(true);
        event.preventDefault();
        event.stopPropagation();
      }
    }
  }

  /**
   * Создает плейсхолдер для полноэкранного просмотра
   * @returns {HTMLElement}
   * @private
   */
  _createFullscreenPlaceholder() {
    const placeholder = document.createElement('div');
    placeholder.className = 'diagram-fullscreen-placeholder';
    placeholder.textContent = 'Предпросмотр диаграммы недоступен';
    return placeholder;
  }

  /**
   * Закрывает полноэкранную диаграмму
   * @param {HTMLElement} modal
   * @param {(event: KeyboardEvent) => void} [keyHandler]
   * @private
   */
  _closeFullscreen(modal, keyHandler) {
    if (modal && modal.parentElement) {
      modal.parentElement.removeChild(modal);
    }
    document.body.classList.remove('diagram-modal-open');
    const handler = keyHandler || modal?.__keyDownHandler;
    if (handler) {
      document.removeEventListener('keydown', handler);
    }
    if (modal && modal.__keyDownHandler) {
      delete modal.__keyDownHandler;
    }
  }

  /**
   * Копирует SVG в буфер обмена
   * @private
   */
  async _copySvg() {
    try {
      if (this._lastSvgText) {
        await navigator.clipboard.writeText(this._lastSvgText);
        this._showCopyFeedback('SVG скопирован');
        return;
      }

      if (!this.renderUrl) {
        console.warn('No render URL available for SVG copy');
        return;
      }

      if (this._isSvgUrl(this.renderUrl)) {
        const response = await fetch(this.renderUrl, { cache: 'no-store' });
        const svgText = await response.text();
        this._lastSvgText = svgText;
        await navigator.clipboard.writeText(svgText);
        this._showCopyFeedback('SVG скопирован');
        return;
      }

      await navigator.clipboard.writeText(this.renderUrl);
      this._showCopyFeedback('URL диаграммы скопирован');
    } catch (error) {
      console.error('Failed to copy SVG:', error);
      this._showCopyFeedback('Ошибка копирования', true);
    }
  }

  /**
   * Копирует PNG в буфер обмена
   * @private
   */
  async _copyPng() {
    try {
      if (this.imageElement) {
        const canvas = document.createElement('canvas');
        canvas.width = this.imageElement.naturalWidth;
        canvas.height = this.imageElement.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(this.imageElement, 0, 0);
        canvas.toBlob(async (blob) => {
          if (blob) {
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
            this._showCopyFeedback('PNG скопирован');
          }
        }, 'image/png');
        return;
      }

      if (this._lastSvgText) {
        const blob = new Blob([this._lastSvgText], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);

        await new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            try {
              const canvas = document.createElement('canvas');
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0);
              canvas.toBlob(async (pngBlob) => {
                if (pngBlob) {
                  await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })]);
                  this._showCopyFeedback('PNG скопирован');
                }
                resolve();
              }, 'image/png');
            } catch (error) {
              reject(error);
            } finally {
              URL.revokeObjectURL(url);
            }
          };
          img.onerror = reject;
          img.src = url;
        });
        return;
      }

      console.warn('No diagram content available for PNG copy');
    } catch (error) {
      console.error('Failed to copy PNG:', error);
      // Fallback: копируем URL
      try {
        if (this.renderUrl) {
          await navigator.clipboard.writeText(this.renderUrl);
          this._showCopyFeedback('URL диаграммы скопирован');
        } else {
          this._showCopyFeedback('Нет данных для копирования', true);
        }
      } catch (e) {
        this._showCopyFeedback('Ошибка копирования', true);
      }
    }
  }

  /**
   * Показывает уведомление о копировании
   * @param {string} message
   * @param {boolean} isError
   * @private
   */
  _showCopyFeedback(message, isError = false) {
    const toast = document.createElement('div');
    toast.className = `diagram-copy-toast ${isError ? 'error' : 'success'}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('show');
    }, 10);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }

  /**
   * Уведомляет об изменении данных
   * @private
   */
  _notifyChange() {
    // Можно добавить событие для синхронизации с Document
    // this.emit('change', { source: this.source });
  }

  /**
   * @returns {Object}
   */
  toJSON() {
    return {
      ...super.toJSON(),
      title: this.title,
      description: this.description,
      engine: this.engine,
      theme: this.theme,
      renderUrl: this.renderUrl,
      alt: this.alt,
      source: this.source,
      format: this.format,
      contentHeight: this.contentHeight,
      links: this.links.map((link) => ({
        ...link
      }))
    };
  }

  /**
   * @private
   * @returns {string}
   */
  _formatMeta() {
    const meta = [];
    if (this.engine) {
      meta.push(this.engine.toUpperCase());
    }
    if (this.format) {
      meta.push(this.format.toUpperCase());
    }
    return meta.join(' · ');
  }

  /**
   * Создает поповер настройки метаданных
   * @returns {HTMLElement|null}
   * @private
   */
  _createMetaPopover() {
    const popover = document.createElement('div');
    popover.className = 'diagram-meta-popover';
    popover.setAttribute('aria-hidden', 'true');
    popover.addEventListener('click', (event) => event.stopPropagation());

    if (ENGINE_OPTIONS.length) {
      const engineSection = document.createElement('div');
      engineSection.className = 'diagram-meta-section';

      const title = document.createElement('div');
      title.className = 'diagram-meta-section-title';
      title.textContent = 'Тип диаграммы';
      engineSection.appendChild(title);

      const optionsContainer = document.createElement('div');
      optionsContainer.className = 'diagram-meta-options';

      ENGINE_OPTIONS.forEach((option) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'diagram-meta-option';
        btn.dataset.engineOption = option.value;
        btn.textContent = option.label;
        if (option.value === this.engine) {
          btn.classList.add('is-active');
        }
        btn.addEventListener('click', (event) => {
          event.stopPropagation();
          this._handleEngineChange(option.value);
          this._toggleMetaPopover(true);
        });
        optionsContainer.appendChild(btn);
      });

      engineSection.appendChild(optionsContainer);
      popover.appendChild(engineSection);
    }

    if (FORMAT_OPTIONS.length) {
      const formatSection = document.createElement('div');
      formatSection.className = 'diagram-meta-section';

      const title = document.createElement('div');
      title.className = 'diagram-meta-section-title';
      title.textContent = 'Формат';
      formatSection.appendChild(title);

      const optionsContainer = document.createElement('div');
      optionsContainer.className = 'diagram-meta-options';

      FORMAT_OPTIONS.forEach((option) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'diagram-meta-option';
        btn.dataset.formatOption = option.value;
        btn.textContent = option.label;
        if (option.value === this.format) {
          btn.classList.add('is-active');
        }
        btn.addEventListener('click', (event) => {
          event.stopPropagation();
          this._handleFormatChange(option.value);
          this._toggleMetaPopover(true);
        });
        optionsContainer.appendChild(btn);
      });

      formatSection.appendChild(optionsContainer);
      popover.appendChild(formatSection);
    }

    return popover;
  }

  /**
   * Обновляет состояние кнопок в поповере
   * @private
   */
  _refreshMetaOptions() {
    if (!this.metaPopover) {
      return;
    }
    this.metaPopover.querySelectorAll('[data-engine-option]').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.engineOption === this.engine);
    });
    this.metaPopover.querySelectorAll('[data-format-option]').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.formatOption === this.format);
    });
  }

  /**
   * Переключает состояние поповера метаданных
   * @param {boolean} forceClose
   * @private
   */
  _toggleMetaPopover(forceClose = false) {
    if (!this.metaPopover) {
      return;
    }
    const isOpen = this.metaPopover.classList.contains('is-open');
    const shouldOpen = forceClose ? false : !isOpen;

    if (shouldOpen) {
      this._refreshMetaOptions();
      this.metaPopover.classList.add('is-open');
      this.metaPopover.setAttribute('aria-hidden', 'false');
      this.metaTrigger?.classList.add('is-active');
      requestAnimationFrame(() => this._positionMetaPopover());
      if (!this._boundMetaOutsideClick) {
        this._boundMetaOutsideClick = (event) => {
          if (!this.metaPopover) {
            return;
          }
          if (
            this.metaPopover.contains(event.target) ||
            this.metaElement === event.target ||
            (this.metaTrigger && (this.metaTrigger === event.target || this.metaTrigger.contains(event.target)))
          ) {
            return;
          }
          this._toggleMetaPopover(true);
        };
      }
      document.addEventListener('click', this._boundMetaOutsideClick);
    } else {
      this.metaPopover.classList.remove('is-open');
      this.metaPopover.setAttribute('aria-hidden', 'true');
      this.metaTrigger?.classList.remove('is-active');
      if (this._boundMetaOutsideClick) {
        document.removeEventListener('click', this._boundMetaOutsideClick);
      }
    }
  }

  /**
   * Вычисляет позицию поповера метаданных
   * @private
   */
  _positionMetaPopover() {
    if (!this.metaPopover) {
      return;
    }

    const anchor = this.metaTrigger || this.metaElement;
    if (!anchor) {
      return;
    }

    const panel = this.metaPopover;
    const margin = 12;

    panel.style.visibility = 'hidden';
    panel.style.top = '0px';
    panel.style.left = '0px';

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
   * Обрабатывает смену движка диаграммы
   * @param {string} newEngine
   * @private
   */
  _handleEngineChange(newEngine) {
    if (this.engine === newEngine) {
      this._toggleMetaPopover(true);
      return;
    }

    this.engine = newEngine;
    if (this.metaElement) {
      this.metaElement.textContent = this._formatMeta();
    }
    if (this.element) {
      this.element.setAttribute('data-diagram-engine', newEngine);
    }
    if (this.codeBlock) {
      const language = this._mapEngineToLanguage(newEngine);
      this.codeBlock.setLanguage(language);
    }
    this._refreshMetaOptions();
    this._notifyChange();
  }

  /**
   * Обрабатывает смену формата диаграммы
   * @param {string} newFormat
   * @private
   */
  _handleFormatChange(newFormat) {
    if (this.format === newFormat) {
      this._toggleMetaPopover(true);
      return;
    }

    this.format = newFormat;
    if (this.metaElement) {
      this.metaElement.textContent = this._formatMeta();
    }
    this._refreshMetaOptions();
    this._notifyChange();
  }

  /**
   * Возвращает язык Monaco для выбранного движка диаграммы
   * @param {string} engine
   * @returns {string}
   * @private
   */
  _mapEngineToLanguage(engine) {
    const option = ENGINE_OPTIONS.find((item) => item.value === engine);
    return option ? option.monacoLanguage : 'plaintext';
  }

  /**
   * Создает resize-хэндл
   * @returns {HTMLElement}
   * @private
   */
  _createResizeHandle() {
    const handle = document.createElement('div');
    handle.className = 'diagram-resize-handle';
    handle.setAttribute('title', 'Изменить высоту блока');
    handle.setAttribute('aria-label', 'Изменить высоту блока');

    const icon = document.createElement('i');
    icon.className = 'fa-light fa-grip-lines';
    handle.appendChild(icon);

    handle.addEventListener('mousedown', (event) => {
      event.preventDefault();
      event.stopPropagation();
      this._startResize(event);
    });

    handle.addEventListener('selectstart', (event) => {
      event.preventDefault();
    });

    return handle;
  }

  /**
   * Обрабатывает изменение высоты блока
   * @param {MouseEvent} event
   * @private
   */
  _startResize(event) {
    const startY = event.clientY;
    const startHeight = this.contentHeight;
    const minHeight = 280;
    const maxHeight = window.innerHeight - 120;

    const onMouseMove = (moveEvent) => {
      const delta = moveEvent.clientY - startY;
      let newHeight = startHeight + delta;
      if (newHeight < minHeight) newHeight = minHeight;
      if (newHeight > maxHeight) newHeight = maxHeight;

      this.contentHeight = newHeight;
      if (this.contentContainer) {
        this.contentContainer.style.height = `${newHeight}px`;
      }
      if (this.codeBlock) {
        this.codeBlock.height = newHeight;
        if (this.codeBlock.editorContainer) {
          this.codeBlock.editorContainer.style.height = `${newHeight}px`;
        }
        if (this.codeBlock.monacoEditor) {
          this.codeBlock.monacoEditor.layout();
        }
      }
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      this._notifyChange();
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  dispose() {
    if (this._keyListenerAttached) {
      document.removeEventListener('keydown', this._handleKeyDownBound, true);
      this._keyListenerAttached = false;
    }
    super.dispose?.();
  }
}


