import { Block } from '../base/Block.js';

export class TableBlock extends Block {
  /**
   * @param {Object} data
   * @param {Array<Array<string>>} [data.rows] - массив строк таблицы
   * @param {boolean} [data.header] - первая строка как заголовок
   */
  constructor(data) {
    super(data);
    this.rows = data.rows || [];
    this.header = data.header !== false;
  }

  render() {
    const el = super.render();
    el.className = 'block table-block';
    if (this.rows.length === 0) {
      el.innerHTML = '<table><tbody><tr><td>Empty table</td></tr></tbody></table>';
      return el;
    }
    const headerRows = this.header && this.rows.length > 0 ? [this.rows[0]] : [];
    const bodyRows = this.header ? this.rows.slice(1) : this.rows;
    const headerHtml = headerRows.length > 0 
      ? `<thead>${headerRows.map(r => `<tr>${r.map(c => `<th>${c}</th>`).join('')}</tr>`).join('')}</thead>`
      : '';
    const bodyHtml = `<tbody>${bodyRows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>`;
    el.innerHTML = `<table>${headerHtml}${bodyHtml}</table>`;
    return el;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      rows: this.rows,
      header: this.header
    };
  }
}

