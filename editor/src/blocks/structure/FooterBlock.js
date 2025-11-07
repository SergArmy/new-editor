import { Block } from '../base/Block.js';

export class FooterBlock extends Block {
  /**
   * @param {Object} data
   * @param {string} [data.content] - содержимое футера
   */
  constructor(data) {
    super(data);
    this.content = data.content || '';
  }

  render() {
    const el = super.render();
    el.className = 'block document-footer';
    el.innerHTML = `<div class="footer-content">${this.content}</div>`;
    return el;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      content: this.content
    };
  }
}

