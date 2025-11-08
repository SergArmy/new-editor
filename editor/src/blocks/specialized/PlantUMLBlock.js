import { DiagramBlock } from './DiagramBlock.js';
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
 * Блок PlantUML диаграммы (наследует DiagramBlock).
 */
export class PlantUMLBlock extends DiagramBlock {
  /**
   * @param {Object} data
   */
  constructor(data) {
    // Подготавливаем данные для родителя
    const source = data.data || data;
    const parentData = {
      ...data,
      data: {
        ...source,
        engine: 'plantuml',
        title: source.title || '',
        description: source.description || '',
        renderUrl: source.renderUrl || '',
        source: source.source || '',
        format: source.format || 'svg'
      }
    };

    super(parentData);

    this.serverUrl = typeof source.serverUrl === 'string' ? source.serverUrl : 'https://www.plantuml.com/plantuml';
    this.format = typeof source.format === 'string' ? source.format : 'svg';

    this._renderUrlPromise = null;
    this._boundRenderPromise = null;
    this._isGenerating = false;

    if (!this.renderUrl && this.source) {
      this._scheduleRenderGeneration();
    }
  }

  /**
   * @returns {HTMLElement}
   */
  render() {
    // Используем родительский render() из DiagramBlock
    const el = super.render();

    // Добавляем специфичный класс для PlantUML
    el.classList.add('plantuml-block');

    if (this.previewContainer) {
      if (this._isGenerating) {
        this._showLoadingState();
      } else if (!this.renderUrl) {
        this._showErrorState();
      }
    }

    this._bindRenderPromise();

    return el;
  }

  /**
   * Планирует генерацию PlantUML изображения
   * @private
   */
  _scheduleRenderGeneration() {
    this.renderUrl = '';
    this.imageElement = null;

    if (!this.source) {
      this._renderUrlPromise = null;
      this._isGenerating = false;
      return;
    }

    this._isGenerating = true;
    this._renderUrlPromise = generatePlantUMLUrl(this.source, {
      serverUrl: this.serverUrl,
      format: this.format || 'svg'
    });
    this._boundRenderPromise = null;

    this._clearPreviewContent();

    if (this.previewContainer) {
      this._showLoadingState();
      this._bindRenderPromise();
    }
  }

  /**
   * Подписывается на завершение текущей генерации
   * @private
   */
  _bindRenderPromise() {
    if (!this._renderUrlPromise || this._boundRenderPromise === this._renderUrlPromise) {
      return;
    }

    this._boundRenderPromise = this._renderUrlPromise;
    this._renderUrlPromise
      .then((url) => {
        this._isGenerating = false;
        if (url) {
          this.renderUrl = url;
          this._updatePreviewImage(url);
        } else {
          this._showErrorState();
        }
        return url;
      })
      .catch((error) => {
        console.error('Failed to generate PlantUML URL:', error);
        this._isGenerating = false;
        this._showErrorState();
      });
  }

  /**
   * Показывает состояние загрузки диаграммы
   * @private
   */
  _showLoadingState() {
    const wrapper = this.previewContainer?.querySelector('.diagram-image-wrapper');
    if (!wrapper) {
      return;
    }
    this.imageElement = null;
    wrapper.innerHTML = `
      <div class="diagram-loading">
        <svg class="plantuml-spinner" width="40" height="40" viewBox="0 0 50 50">
          <circle cx="25" cy="25" r="20" fill="none" stroke="#6366f1" stroke-width="5"></circle>
        </svg>
        <span>Генерация диаграммы...</span>
      </div>
    `;
  }

  /**
   * Обновляет превью изображением
   * @param {string} url
   * @private
   */
  _updatePreviewImage(url) {
    if (!url) {
      this._showErrorState();
      return;
    }
    this._renderPreviewFromUrl(url);
  }

  /**
   * Показывает состояние ошибки
   * @private
   */
  _showErrorState() {
    const wrapper = this.previewContainer?.querySelector('.diagram-image-wrapper');
    if (!wrapper) {
      return;
    }
    this._clearPreviewContent();
    this._renderPlaceholder('Ошибка генерации диаграммы');
  }

  /**
   * @param {string} newFormat
   * @private
   */
  _handleFormatChange(newFormat) {
    const previousFormat = this.format;
    super._handleFormatChange(newFormat);

    if (previousFormat === newFormat) {
      return;
    }

    this._scheduleRenderGeneration();
  }

  /**
   * Переопределяем форматирование метаданных для PlantUML
   * @returns {string}
   * @private
   */
  _formatMeta() {
    const meta = [this.engine ? this.engine.toUpperCase() : 'PLANTUML'];

    if (this.format) {
      meta.push(FORMAT_LABELS[this.format] || this.format.toUpperCase());
    }

    if (this.serverUrl) {
      // intentionally omitted host name from meta display
    }

    return meta.join(' · ');
  }

  /**
   * @returns {Object}
   */
  toJSON() {
    return {
      ...super.toJSON(),
      serverUrl: this.serverUrl,
      format: this.format
    };
  }

  /**
   * После редактирования кода перерисовываем превью (генерируем ссылку заново)
   * @protected
   */
  _refreshPreviewAfterEdit() {
    this._scheduleRenderGeneration();
  }
}


