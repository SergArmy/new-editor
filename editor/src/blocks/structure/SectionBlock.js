import { Block } from '../base/Block.js';

export class SectionBlock extends Block {
  /**
   * @param {Object} data
   * @param {number} [data.level] - уровень вложенности 1-5
   * @param {string} [data.title] - заголовок секции
   * @param {boolean} [data.collapsed] - свернута ли секция
   * @param {boolean} [data.numbered] - включена ли нумерация
   */
  constructor(data) {
    super(data);
    this.level = data.level || 1;
    this.title = data.title || '';
    this.collapsed = data.collapsed || false;
    this.numbered = data.numbered !== false;
  }

  render() {
    const el = super.render();
    el.className = `block section-block section-level-${this.level}`;
    el.innerHTML = `
      <div class="section-header">
        <h${this.level} class="section-title">${this.title || 'Section'}</h${this.level}>
      </div>
      <div class="section-content" style="display: ${this.collapsed ? 'none' : 'block'}"></div>
    `;
    return el;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      level: this.level,
      title: this.title,
      collapsed: this.collapsed,
      numbered: this.numbered
    };
  }
}

