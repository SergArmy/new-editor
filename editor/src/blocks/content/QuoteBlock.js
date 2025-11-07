import { Block } from '../base/Block.js';

export class QuoteBlock extends Block {
  /**
   * @param {Object} data
   * @param {string} [data.text] - текст цитаты
   * @param {string} [data.quoteType] - тип: default, info, warning, important, success, tip, note
   * @param {string} [data.author] - автор цитаты (опционально)
   */
  constructor(data) {
    super(data);
    this.text = data.text || '';
    this.quoteType = data.quoteType || data.data?.type || 'default';
    this.author = data.author || '';
  }

  render() {
    const el = super.render();
    el.className = `block quote-block quote-type-${this.quoteType}`;
    const authorHtml = this.author ? `<cite class="quote-author">${this.author}</cite>` : '';
    el.innerHTML = `
      <blockquote class="quote-content">
        <p>${this.text}</p>
        ${authorHtml}
      </blockquote>
    `;
    return el;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      text: this.text,
      quoteType: this.quoteType,
      author: this.author
    };
  }
}

