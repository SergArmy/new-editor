import { Block } from '../base/Block.js';

export class HeaderBlock extends Block {
  /**
   * @param {Object} data
   * @param {string} [data.title] - заголовок документа
   * @param {Object} [data.metadata] - метаданные (автор, дата, версия)
   */
  constructor(data) {
    super(data);
    this.title = data.title || '';
    this.metadata = data.metadata || {};
  }

  render() {
    const el = super.render();
    el.className = 'block document-header';
    el.innerHTML = `
      <h1 class="document-title">${this.title || 'Document'}</h1>
      <div class="document-meta">
        ${this.metadata.author ? `<span class="author">${this.metadata.author}</span>` : ''}
        ${this.metadata.date ? `<span class="date">${this.metadata.date}</span>` : ''}
        ${this.metadata.version ? `<span class="version">v${this.metadata.version}</span>` : ''}
      </div>
    `;
    return el;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      title: this.title,
      metadata: this.metadata
    };
  }
}

