import { Block } from '../base/Block.js';

export class ImageBlock extends Block {
  /**
   * @param {Object} data
   * @param {string} [data.src] - URL изображения
   * @param {string} [data.alt] - альтернативный текст
   * @param {string} [data.caption] - подпись
   * @param {string} [data.align] - выравнивание: left, center, right
   * @param {number} [data.width] - ширина (опционально)
   * @param {number} [data.height] - высота (опционально)
   */
  constructor(data) {
    super(data);
    this.src = data.src || '';
    this.alt = data.alt || '';
    this.caption = data.caption || '';
    this.align = data.align || 'center';
    this.width = data.width;
    this.height = data.height;
  }

  render() {
    const el = super.render();
    el.className = `block image-block image-align-${this.align}`;
    const img = document.createElement('img');
    img.src = this.src;
    img.alt = this.alt;
    if (this.width) img.width = this.width;
    if (this.height) img.height = this.height;
    const captionHtml = this.caption ? `<figcaption class="image-caption">${this.caption}</figcaption>` : '';
    el.innerHTML = `<figure>${img.outerHTML}${captionHtml}</figure>`;
    return el;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      src: this.src,
      alt: this.alt,
      caption: this.caption,
      align: this.align,
      width: this.width,
      height: this.height
    };
  }
}

