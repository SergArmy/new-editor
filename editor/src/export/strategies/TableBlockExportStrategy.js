import { BaseBlockExportStrategy } from './BaseBlockExportStrategy.js';

/**
 * Стратегия экспорта блока таблицы
 */
export class TableBlockExportStrategy extends BaseBlockExportStrategy {
  canHandle(blockType) {
    return blockType === 'table';
  }

  async render(block, allBlocks, context) {
    const data = block.data || {};
    const blockId = block.id ? ` id="${this.escape(block.id)}"` : '';
    const rows = data.rows || [];
    const hasHeader = data.header !== false && rows.length > 0;

    if (rows.length === 0) {
      return {
        html: `      <div class="block table-block"${blockId}>
        <table><tbody><tr><td></td></tr></tbody></table>
      </div>\n`,
        cssClasses: new Set(['block', 'table-block']),
        inlineStyles: ''
      };
    }

    let html = `      <div class="block table-block"${blockId}>
        <table>\n`;

    if (hasHeader && rows.length > 0) {
      html += `          <thead>\n            <tr>\n`;
      rows[0].forEach(cell => {
        html += `              <th>${this.escapeHtmlContent(String(cell || ''))}</th>\n`;
      });
      html += `            </tr>\n          </thead>\n`;
    }

    html += `          <tbody>\n`;
    const bodyRows = hasHeader ? rows.slice(1) : rows;
    bodyRows.forEach(row => {
      html += `            <tr>\n`;
      row.forEach(cell => {
        html += `              <td>${this.escapeHtmlContent(String(cell || ''))}</td>\n`;
      });
      html += `            </tr>\n`;
    });
    html += `          </tbody>\n`;
    html += `        </table>\n      </div>\n`;

    return {
      html,
      cssClasses: new Set(['block', 'table-block']),
      inlineStyles: ''
    };
  }

  escapeHtmlContent(str) {
    if (!str) return '';
    const div = typeof document !== 'undefined' ? document.createElement('div') : null;
    if (div) {
      div.innerHTML = str;
      if (div.textContent !== str) {
        return str;
      }
    }
    return this.escape(str);
  }

  getRequiredCssClasses() {
    return new Set(['block', 'table-block']);
  }
}

