import { BaseBlockExportStrategy } from './BaseBlockExportStrategy.js';

/**
 * Стратегия экспорта блока секции
 */
export class SectionBlockExportStrategy extends BaseBlockExportStrategy {
  canHandle(blockType) {
    return blockType === 'section';
  }

  async render(block, allBlocks, context) {
    const data = block.data || {};
    const blockId = block.id ? ` id="${this.escape(block.id)}"` : '';
    const level = Math.min(Math.max(data.level || 1, 1), 6);
    const title = data.title || '';
    const childBlocks = allBlocks.filter(b => b.parentId === block.id);

    let html = `      <section class="block section-block section-level-${level}"${blockId}>
        <h${level} class="section-title">${this.escape(title)}</h${level}>\n`;

    const cssClasses = new Set(['block', 'section-block', `section-level-${level}`, 'section-title']);

    // Рендерим дочерние блоки
    if (childBlocks.length > 0) {
      html += `        <div class="section-content">\n`;
      cssClasses.add('section-content');
      
      for (const child of childBlocks) {
        const strategy = context.getStrategyForBlock(child.type);
        if (strategy) {
          const result = await strategy.render(child, allBlocks, context);
          html += result.html;
          result.cssClasses.forEach(cls => cssClasses.add(cls));
        }
      }
      html += `        </div>\n`;
    }

    html += `      </section>\n`;

    return {
      html,
      cssClasses,
      inlineStyles: ''
    };
  }

  getRequiredCssClasses() {
    return new Set([
      'block',
      'section-block',
      'section-level-1',
      'section-level-2',
      'section-level-3',
      'section-level-4',
      'section-level-5',
      'section-level-6',
      'section-title',
      'section-content'
    ]);
  }
}

