import { BaseBlockExportStrategy } from './BaseBlockExportStrategy.js';

const CODE_LANGUAGE_LABELS = {
  bsl: '1С (BSL)',
  '1c': '1С (BSL)',
  javascript: 'JavaScript',
  js: 'JavaScript',
  typescript: 'TypeScript',
  ts: 'TypeScript',
  json: 'JSON',
  xml: 'XML',
  html: 'HTML',
  css: 'CSS',
  sql: 'SQL',
  plaintext: 'Plain Text',
  text: 'Plain Text'
};

/**
 * Стратегия экспорта блока кода
 */
export class CodeBlockExportStrategy extends BaseBlockExportStrategy {
  canHandle(blockType) {
    return blockType === 'code';
  }

  async render(block, allBlocks, context) {
    const data = block.data || {};
    const blockId = block.id ? ` id="${this.escape(block.id)}"` : '';
    const code = data.code || '';
    const language = this.normalizeCodeLanguage(data.language || '');
    const languageLabel = this.getLanguageLabel(language);
    const codeElementId = context.generateCodeElementId(block);
    const lineNumbersEnabled = data.lineNumbers !== false;
    const minimapEnabled = data.minimap === true;
    
    // Получаем раскрашенный код от Monaco
    const colorized = await this.getMonacoColorizedHtml(code, language, context);
    const codeHtml = colorized || this.escape(code).replace(/\n/g, '<br>');
    
    const contentHtml = this.buildCodeDisplayHtml(codeHtml, code, { lineNumbersEnabled });
    const minimapHtml = minimapEnabled ? this.buildMinimapHtml(block.id, context) : '';
    const hiddenRawCode = `<code id="${this.escape(codeElementId)}" class="code-raw" data-raw-code="${this.escapeAttribute(code)}" aria-hidden="true" hidden></code>`;

    const html = `      <div class="block code-block" data-language="${this.escape(language)}"${blockId}>
        <div class="code-block-header">
          <div class="code-header-actions">
            <button class="code-copy-btn" type="button" data-target="${this.escape(codeElementId)}" aria-label="Копировать код" title="Копировать код">
              <i class="fa-light fa-copy"></i>
            </button>
            <span class="code-language-badge">${this.escape(languageLabel)}</span>
          </div>
        </div>
        <div class="code-block-body">
          ${contentHtml}
          ${minimapHtml}
        </div>
        ${hiddenRawCode}
      </div>\n`;

    const cssClasses = new Set([
      'block',
      'code-block',
      'code-block-header',
      'code-header-actions',
      'code-copy-btn',
      'code-language-badge',
      'code-block-body',
      'code-raw'
    ]);

    if (lineNumbersEnabled) {
      cssClasses.add('code-block-content');
      cssClasses.add('code-block-content--numbered');
      cssClasses.add('code-lines');
      cssClasses.add('code-line');
      cssClasses.add('code-line-number');
      cssClasses.add('code-line-text');
    } else {
      cssClasses.add('code-block-content');
      cssClasses.add('code-pre');
      cssClasses.add('code-pre__inner');
    }

    if (minimapEnabled) {
      cssClasses.add('code-minimap');
    }

    return {
      html,
      cssClasses,
      inlineStyles: ''
    };
  }

  normalizeCodeLanguage(language) {
    if (!language) {
      return 'plaintext';
    }

    const normalized = String(language).trim().toLowerCase();

    if (normalized === '1c' || normalized === '1с') {
      return 'bsl';
    }

    return normalized;
  }

  getLanguageLabel(language) {
    const normalized = this.normalizeCodeLanguage(language);
    return CODE_LANGUAGE_LABELS[normalized] || CODE_LANGUAGE_LABELS[language] || normalized.toUpperCase();
  }

  async getMonacoColorizedHtml(code, language, context) {
    if (typeof window === 'undefined' || !window.monaco?.editor?.colorize) {
      return null;
    }

    try {
      const languageId = this.resolveMonacoLanguageId(language || 'plaintext');
      const themeName = window.monaco.editor?.getTheme?.();
      const colorized = await window.monaco.editor.colorize(code, languageId, { theme: themeName });
      if (!colorized) {
        return null;
      }
      return context.convertMonacoTokensToInlineStyles(colorized);
    } catch (error) {
      console.warn('Monaco colorize failed, falling back to plain export:', error);
      return null;
    }
  }

  resolveMonacoLanguageId(language) {
    const normalized = this.normalizeCodeLanguage(language) || 'plaintext';

    if (typeof window === 'undefined' || !window.monaco?.languages?.getLanguages) {
      return normalized;
    }

    const lower = normalized.toLowerCase();
    const languages = window.monaco.languages.getLanguages();
    for (const info of languages) {
      if (info.id === lower) {
        return info.id;
      }
      if (info.aliases && info.aliases.some(alias => alias.toLowerCase() === lower)) {
        return info.id;
      }
    }

    return lower || 'plaintext';
  }

  buildCodeDisplayHtml(codeHtml, rawCode, { lineNumbersEnabled }) {
    if (lineNumbersEnabled) {
      const lines = this.splitCodeIntoLines(codeHtml, rawCode);
      const renderedLines = lines.map((line, index) => {
        const safeLine = line === '' ? '&nbsp;' : line;
        return `<div class="code-line"><span class="code-line-number">${index + 1}</span><span class="code-line-text">${safeLine}</span></div>`;
      }).join('');

      return `<div class="code-block-content code-block-content--numbered"><div class="code-lines">${renderedLines}</div></div>`;
    }

    return `<div class="code-block-content"><pre class="code-pre"><code class="code-pre__inner">${codeHtml}</code></pre></div>`;
  }

  splitCodeIntoLines(codeHtml, rawCode) {
    const rawLines = String(rawCode || '').split(/\r?\n/);
    if (!codeHtml) {
      return rawLines.map(line => this.escape(line).replace(/ /g, '&nbsp;'));
    }

    const parts = codeHtml.split(/<br\s*\/?\s*>/gi);
    let lines = parts.length > 1 ? parts : [codeHtml];

    if (lines.length > rawLines.length && lines[lines.length - 1].trim() === '') {
      lines = lines.slice(0, rawLines.length);
    }

    while (lines.length < rawLines.length) {
      lines.push('');
    }

    return lines.map((line, index) => {
      if (!line) {
        return this.escape(rawLines[index] || '').replace(/ /g, '&nbsp;');
      }

      if (/<[^>]+>/.test(line)) {
        return line;
      }

      return line.replace(/ /g, '&nbsp;');
    });
  }

  buildMinimapHtml(blockId, context) {
    const dataUrl = this.getMonacoMinimapDataUrl(blockId);
    if (!dataUrl) {
      return '';
    }

    return `<div class="code-minimap"><img src="${dataUrl}" alt="Code minimap"></div>`;
  }

  getMonacoMinimapDataUrl(blockId) {
    if (typeof document === 'undefined' || !blockId) {
      return null;
    }

    try {
      const escapedId = typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(blockId) : blockId.replace(/"/g, '\\"');
      const blockElement = document.querySelector(`[data-block-id="${escapedId}"]`);
      if (!blockElement) {
        return null;
      }

      const canvas = blockElement.querySelector('.minimap canvas, canvas.minimap, canvas.minimapCanvas');
      if (!canvas || typeof canvas.toDataURL !== 'function') {
        return null;
      }

      return canvas.toDataURL();
    } catch (error) {
      console.warn('Failed to capture Monaco minimap snapshot:', error);
      return null;
    }
  }

  getRequiredCssClasses() {
    return new Set([
      'block',
      'code-block',
      'code-block-header',
      'code-header-actions',
      'code-copy-btn',
      'code-language-badge',
      'code-block-body',
      'code-block-content',
      'code-block-content--numbered',
      'code-lines',
      'code-line',
      'code-line-number',
      'code-line-text',
      'code-pre',
      'code-pre__inner',
      'code-minimap',
      'code-raw'
    ]);
  }
}

