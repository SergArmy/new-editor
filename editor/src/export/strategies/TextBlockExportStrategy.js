import { BaseBlockExportStrategy } from './BaseBlockExportStrategy.js';

/**
 * Стратегия экспорта текстового блока
 */
export class TextBlockExportStrategy extends BaseBlockExportStrategy {
  canHandle(blockType) {
    return blockType === 'text';
  }

  async render(block, allBlocks, context) {
    const data = block.data || {};
    const blockId = block.id ? ` id="${this.escape(block.id)}"` : '';
    
    // Поддерживаем HTML форматирование, если есть
    let content = '';
    if (data.html) {
      content = data.html;
    } else if (data.text) {
      content = this.escape(data.text);
    }

    const html = `      <div class="block text-block"${blockId}>
        <p class="text-content">${content}</p>
      </div>\n`;

    const cssClasses = new Set(['block', 'text-block', 'text-content']);

    return {
      html,
      cssClasses,
      inlineStyles: ''
    };
  }

  getRequiredCssClasses() {
    return new Set(['block', 'text-block', 'text-content']);
  }
}

