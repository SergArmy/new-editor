import { Block } from '../base/Block.js';

export class TocBlock extends Block {
  /**
   * @param {Object} data
   * @param {Array} [data.items] - элементы оглавления [{id, title, level}]
   */
  constructor(data) {
    super(data);
    this.items = data.items || [];
  }

  render() {
    const el = super.render();
    el.className = 'block toc-block';
    const itemsHtml = this.items.map(item => 
      `<li class="toc-item toc-level-${item.level || 1}">
        <a href="#${item.id}">${item.title || ''}</a>
       </li>`
    ).join('');
    el.innerHTML = `<nav class="toc-nav"><ul class="toc-list">${itemsHtml}</ul></nav>`;
    return el;
  }

  /**
   * @param {Array} items
   */
  updateItems(items) {
    this.items = items;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      items: this.items
    };
  }
}

