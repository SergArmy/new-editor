import { BaseBlockExportStrategy } from './BaseBlockExportStrategy.js';

/**
 * Стратегия экспорта структурных блоков (header, footer, toc)
 */
export class StructuralBlockExportStrategy extends BaseBlockExportStrategy {
  canHandle(blockType) {
    return ['header', 'footer', 'toc'].includes(blockType);
  }

  async render(block, allBlocks, context) {
    const blockType = block.type;

    if (blockType === 'header') {
      return this.renderHeader(block, context);
    } else if (blockType === 'footer') {
      return this.renderFooter(block, context);
    } else if (blockType === 'toc') {
      return this.renderToc(block, context);
    }

    return { html: '', cssClasses: new Set(), inlineStyles: '' };
  }

  renderHeader(block, context) {
    const data = block.data || {};
    const blockId = block.id ? ` id="${this.escape(block.id)}"` : '';
    const title = data.title || '';
    const metadata = data.metadata || {};
    
    let html = `      <header class="block document-header"${blockId}>
        <h1>${this.escape(title)}</h1>\n`;
    
    const cssClasses = new Set(['block', 'document-header']);

    if (metadata.author || metadata.date || metadata.version) {
      html += `        <div class="document-meta">\n`;
      cssClasses.add('document-meta');
      
      if (metadata.author) {
        html += `          <span class="author">${this.escape(metadata.author)}</span>\n`;
        cssClasses.add('author');
      }
      if (metadata.date) {
        html += `          <span class="date">${this.escape(metadata.date)}</span>\n`;
        cssClasses.add('date');
      }
      if (metadata.version) {
        html += `          <span class="version">v${this.escape(String(metadata.version))}</span>\n`;
        cssClasses.add('version');
      }
      html += `        </div>\n`;
    }
    html += `      </header>\n`;

    return { html, cssClasses, inlineStyles: '' };
  }

  renderFooter(block, context) {
    const data = block.data || {};
    const blockId = block.id ? ` id="${this.escape(block.id)}"` : '';
    const content = data.content || '';

    const html = `      <div class="block document-footer"${blockId}>
        <div class="footer-content">${this.escapeHtmlContent(content)}</div>
      </div>\n`;

    return {
      html,
      cssClasses: new Set(['block', 'document-footer', 'footer-content']),
      inlineStyles: ''
    };
  }

  renderToc(block, context) {
    const data = block.data || {};
    const blockId = block.id ? ` id="${this.escape(block.id)}"` : '';
    const items = data.items || [];
    
    if (items.length === 0) {
      return { html: '', cssClasses: new Set(), inlineStyles: '' };
    }

    let html = `      <nav class="block toc-block"${blockId}>
        <ul class="toc-list">\n`;
    
    items.forEach(item => {
      const level = item.level || 1;
      const title = item.title || '';
      const itemId = item.id ? ` href="#${this.escape(item.id)}"` : '';
      html += `          <li class="toc-item toc-level-${level}"><a${itemId}>${this.escape(title)}</a></li>\n`;
    });
    html += `        </ul>\n      </nav>\n`;

    return {
      html,
      cssClasses: new Set(['block', 'toc-block', 'toc-list', 'toc-item']),
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
      'document-header',
      'document-meta',
      'author',
      'date',
      'version',
      'document-footer',
      'footer-content',
      'toc-block',
      'toc-list',
      'toc-item',
      'toc-level-1',
      'toc-level-2',
      'toc-level-3',
      'toc-level-4',
      'toc-level-5',
      'toc-level-6'
    ]);
  }
}

