import { Block } from '../base/Block.js';

/**
 * @typedef {Object} DiagramBlockData
 * @property {string} [title]
 * @property {string} [description]
 * @property {string} [engine]
 * @property {string} [theme]
 * @property {string} [renderUrl]
 * @property {string} [alt]
 * @property {string} [source]
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
  }

  /**
   * @returns {HTMLElement}
   */
  render() {
    const el = super.render();
    el.className = 'block diagram-block';

    const headerEl = document.createElement('div');
    headerEl.className = 'diagram-header';

    const metaEl = document.createElement('div');
    metaEl.className = 'diagram-meta';
    metaEl.textContent = this._formatMeta();
    headerEl.appendChild(metaEl);

    if (this.title) {
      const titleEl = document.createElement('div');
      titleEl.className = 'diagram-title';
      titleEl.textContent = this.title;
      headerEl.appendChild(titleEl);
    }

    el.appendChild(headerEl);

    if (this.description) {
      const descriptionEl = document.createElement('div');
      descriptionEl.className = 'diagram-description';
      descriptionEl.textContent = this.description;
      el.appendChild(descriptionEl);
    }

    const previewEl = document.createElement('div');
    previewEl.className = 'diagram-preview';

    if (this.renderUrl) {
      const img = document.createElement('img');
      img.src = this.renderUrl;
      img.alt = this.alt || 'Diagram preview';
      img.loading = 'lazy';
      previewEl.appendChild(img);
    } else {
      const placeholder = document.createElement('div');
      placeholder.className = 'diagram-placeholder';
      placeholder.textContent = 'Предпросмотр диаграммы недоступен';
      previewEl.appendChild(placeholder);
    }

    el.appendChild(previewEl);

    if (this.source) {
      const sourceWrapper = document.createElement('div');
      sourceWrapper.className = 'diagram-source';

      const sourceLabel = document.createElement('div');
      sourceLabel.className = 'diagram-source-label';
      sourceLabel.textContent = 'Исходный код диаграммы';

      const pre = document.createElement('pre');
      const code = document.createElement('code');
      code.textContent = this.source;
      pre.appendChild(code);

      sourceWrapper.appendChild(sourceLabel);
      sourceWrapper.appendChild(pre);
      el.appendChild(sourceWrapper);
    }

    return el;
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
      source: this.source
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
    if (this.theme) {
      meta.push(`Тема: ${this.theme}`);
    }
    return meta.join(' · ');
  }
}


