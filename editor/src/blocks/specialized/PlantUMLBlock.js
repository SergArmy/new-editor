import { Block } from '../base/Block.js';
import { generatePlantUMLUrl } from '../../utils/plantuml-encoder.js';

/**
 * @typedef {Object} PlantUMLBlockData
 * @property {string} [title]
 * @property {string} [description]
 * @property {string} [serverUrl]
 * @property {string} [format]
 * @property {string} [renderUrl]
 * @property {string} [source]
 */

const FORMAT_LABELS = {
  svg: 'SVG',
  png: 'PNG'
};

/**
 * Блок PlantUML диаграммы.
 */
export class PlantUMLBlock extends Block {
  /**
   * @param {Object} data
   */
  constructor(data) {
    super(data);

    /** @type {PlantUMLBlockData} */
    const source = data.data || data;

    this.title = typeof source.title === 'string' ? source.title : '';
    this.description = typeof source.description === 'string' ? source.description : '';
    this.serverUrl = typeof source.serverUrl === 'string' ? source.serverUrl : 'https://www.plantuml.com/plantuml';
    this.format = typeof source.format === 'string' ? source.format : 'svg';
    this.source = typeof source.source === 'string' ? source.source : '';
    
    // Сохраняем явно заданный renderUrl или оставляем пустым для async генерации
    this.renderUrl = typeof source.renderUrl === 'string' ? source.renderUrl : '';
    this._renderUrlPromise = null;
    this._isGenerating = false;
    
    // Запускаем async генерацию URL сразу, если есть исходник и нет явного URL
    if (!this.renderUrl && this.source) {
      this._isGenerating = true;
      this._renderUrlPromise = generatePlantUMLUrl(this.source, {
        serverUrl: this.serverUrl,
        format: this.format
      }).then(url => {
        this.renderUrl = url;
        this._isGenerating = false;
        return url;
      }).catch(err => {
        console.error('Failed to generate PlantUML URL:', err);
        this._isGenerating = false;
        return '';
      });
    }
  }

  /**
   * @returns {HTMLElement}
   */
  render() {
    const el = super.render();
    el.className = 'block plantuml-block';

    if (this.title || this.description || this.serverUrl) {
      const headerEl = document.createElement('div');
      headerEl.className = 'plantuml-header';

      if (this.title) {
        const titleEl = document.createElement('div');
        titleEl.className = 'plantuml-title';
        titleEl.textContent = this.title;
        headerEl.appendChild(titleEl);
      }

      const metaBits = [];
      if (this.serverUrl) {
        try {
          metaBits.push(new URL(this.serverUrl).hostname);
        } catch (e) {
          metaBits.push('PlantUML Server');
        }
      }
      if (this.format) {
        metaBits.push(`Формат: ${FORMAT_LABELS[this.format] || this.format.toUpperCase()}`);
      }

      if (metaBits.length > 0) {
        const metaEl = document.createElement('div');
        metaEl.className = 'plantuml-meta';
        metaEl.textContent = metaBits.join(' · ');
        headerEl.appendChild(metaEl);
      }

      if (this.description) {
        const descriptionEl = document.createElement('div');
        descriptionEl.className = 'plantuml-description';
        descriptionEl.textContent = this.description;
        headerEl.appendChild(descriptionEl);
      }

      el.appendChild(headerEl);
    }

    const previewEl = document.createElement('div');
    previewEl.className = 'plantuml-preview';

    if (this.renderUrl) {
      const img = document.createElement('img');
      img.src = this.renderUrl;
      img.alt = this.title || 'PlantUML diagram';
      img.loading = 'lazy';
      previewEl.appendChild(img);
    } else if (this._renderUrlPromise) {
      // Показываем загрузку, пока URL генерируется
      const placeholder = document.createElement('div');
      placeholder.className = 'plantuml-placeholder';
      placeholder.innerHTML = `
        <svg class="plantuml-spinner" width="40" height="40" viewBox="0 0 50 50">
          <circle cx="25" cy="25" r="20" fill="none" stroke="#6366f1" stroke-width="5"></circle>
        </svg>
        <span>Генерация диаграммы...</span>
      `;
      previewEl.appendChild(placeholder);
      
      // Обновляем изображение после генерации URL
      this._renderUrlPromise.then(url => {
        if (url && placeholder.parentElement) {
          placeholder.remove();
          const img = document.createElement('img');
          img.src = url;
          img.alt = this.title || 'PlantUML diagram';
          img.loading = 'lazy';
          img.onerror = () => {
            img.remove();
            const error = document.createElement('div');
            error.className = 'plantuml-placeholder';
            error.textContent = 'Ошибка загрузки диаграммы';
            previewEl.appendChild(error);
          };
          previewEl.appendChild(img);
        } else if (placeholder.parentElement) {
          placeholder.innerHTML = '<span>Ошибка генерации диаграммы</span>';
        }
      }).catch(() => {
        if (placeholder.parentElement) {
          placeholder.innerHTML = '<span>Ошибка генерации диаграммы</span>';
        }
      });
    } else {
      const placeholder = document.createElement('div');
      placeholder.className = 'plantuml-placeholder';
      placeholder.textContent = 'Изображение диаграммы недоступно';
      previewEl.appendChild(placeholder);
    }

    el.appendChild(previewEl);

    if (this.source) {
      const sourceBlock = document.createElement('div');
      sourceBlock.className = 'plantuml-source';

      const label = document.createElement('div');
      label.className = 'plantuml-source-label';
      label.textContent = 'Исходный код PlantUML';

      const pre = document.createElement('pre');
      const code = document.createElement('code');
      code.textContent = this.source;
      pre.appendChild(code);

      sourceBlock.appendChild(label);
      sourceBlock.appendChild(pre);
      el.appendChild(sourceBlock);
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
      serverUrl: this.serverUrl,
      format: this.format,
      renderUrl: this.renderUrl,
      source: this.source
    };
  }
}


