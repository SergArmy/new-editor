import { BaseBlockExportStrategy } from './BaseBlockExportStrategy.js';

/**
 * Стратегия экспорта блока изображения
 */
export class ImageBlockExportStrategy extends BaseBlockExportStrategy {
  canHandle(blockType) {
    return blockType === 'image';
  }

  async render(block, allBlocks, context) {
    const data = block.data || {};
    const blockId = block.id ? ` id="${this.escape(block.id)}"` : '';
    const src = data.src || '';
    const alt = data.alt || '';
    const caption = data.caption || '';
    const align = data.align || 'center';
    const width = data.width ? ` width="${data.width}"` : '';
    const height = data.height ? ` height="${data.height}"` : '';

    let html = `      <figure class="block image-block image-align-${align}"${blockId}>
        <img src="${this.escape(src)}" alt="${this.escape(alt)}"${width}${height}>
`;
    if (caption) {
      html += `        <figcaption class="image-caption">${this.escape(caption)}</figcaption>\n`;
    }
    html += `      </figure>\n`;

    const cssClasses = new Set(['block', 'image-block', `image-align-${align}`]);
    if (caption) {
      cssClasses.add('image-caption');
    }

    return {
      html,
      cssClasses,
      inlineStyles: ''
    };
  }

  getRequiredCssClasses() {
    return new Set([
      'block',
      'image-block',
      'image-align-center',
      'image-align-left',
      'image-align-right',
      'image-caption'
    ]);
  }
}

