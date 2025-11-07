import { BaseBlockExportStrategy } from './BaseBlockExportStrategy.js';

/**
 * Стратегия экспорта блока цитаты
 */
export class QuoteBlockExportStrategy extends BaseBlockExportStrategy {
  canHandle(blockType) {
    return blockType === 'quote';
  }

  async render(block, allBlocks, context) {
    const data = block.data || {};
    const blockId = block.id ? ` id="${this.escape(block.id)}"` : '';
    const text = data.text || '';
    const quoteType = data.quoteType || data.type || 'default';
    const author = data.author || '';

    let html = `      <blockquote class="block quote-block quote-type-${quoteType}"${blockId}>
        <p class="quote-content">${this.escapeHtmlContent(text)}</p>\n`;
    if (author) {
      html += `        <cite class="quote-author">${this.escape(author)}</cite>\n`;
    }
    html += `      </blockquote>\n`;

    const cssClasses = new Set(['block', 'quote-block', `quote-type-${quoteType}`, 'quote-content']);
    if (author) {
      cssClasses.add('quote-author');
    }

    return {
      html,
      cssClasses,
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
    return new Set([
      'block',
      'quote-block',
      'quote-type-default',
      'quote-type-info',
      'quote-type-warning',
      'quote-type-important',
      'quote-type-success',
      'quote-content',
      'quote-author'
    ]);
  }
}

