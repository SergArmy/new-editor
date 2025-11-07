import { CssLoader } from '../CssLoader.js';
import { CssExtractor } from '../CssExtractor.js';
import {
  TextBlockExportStrategy,
  CodeBlockExportStrategy,
  ImageBlockExportStrategy,
  TableBlockExportStrategy,
  QuoteBlockExportStrategy,
  SectionBlockExportStrategy,
  StructuralBlockExportStrategy
} from '../strategies/index.js';

export class HtmlExporter {
  constructor() {
    this.codeBlockCounter = 0;
    this._codeElementIds = new Set();
    this.cssExtractor = new CssExtractor();

    // Регистрируем стратегии экспорта
    this.strategies = [
      new TextBlockExportStrategy(),
      new CodeBlockExportStrategy(),
      new ImageBlockExportStrategy(),
      new TableBlockExportStrategy(),
      new QuoteBlockExportStrategy(),
      new SectionBlockExportStrategy(),
      new StructuralBlockExportStrategy()
    ];
  }

  /**
   * Получает стратегию для типа блока
   * @param {string} blockType
   * @returns {BaseBlockExportStrategy|null}
   */
  getStrategyForBlock(blockType) {
    return this.strategies.find(strategy => strategy.canHandle(blockType)) || null;
  }
  /**
   * @param {Object} document
   * @param {Object} [options]
   * @returns {Promise<string>}
   */
  async export(document, options = {}) {
    const includeTOC = options.includeTOC !== false;
    const includeNumbers = options.includeNumbers !== false;
    const theme = options.theme || 'light';

    this.codeBlockCounter = 0;
    if (this._codeElementIds) {
      this._codeElementIds.clear();
    } else {
      this._codeElementIds = new Set();
    }

    const html = await this.buildHTML(document, { includeTOC, includeNumbers, theme });
    return html;
  }

  /**
   * @param {Object} document
   * @param {Object} options
   * @returns {Promise<string>}
   */
  async buildHTML(document, options) {
    // Поддерживаем оба формата: document.blocks и document.content.blocks
    const blocks = document.blocks || document.content?.blocks || [];

    // Собираем используемые CSS классы и теги
    const usedCssClasses = new Set(['document', 'document-body']);
    const usedTags = new Set(['html', 'body', 'article', 'main']);

    // Контекст для рендеринга
    const context = {
      generateCodeElementId: (block) => this.generateCodeElementId(block),
      convertMonacoTokensToInlineStyles: (html) => this.convertMonacoTokensToInlineStyles(html),
      getStrategyForBlock: (blockType) => this.getStrategyForBlock(blockType)
    };

    let bodyHtml = '';

    // Заголовок документа (если нет header блока)
    const hasHeaderBlock = blocks.some(b => b.type === 'header');
    if (!hasHeaderBlock) {
      bodyHtml += `    <header class="document-header">\n`;
      bodyHtml += `      <h1>${this.escape(document.title || 'Document')}</h1>\n`;
      usedCssClasses.add('document-header');
      usedTags.add('header');
      usedTags.add('h1');

      if (document.author && document.author.name) {
        bodyHtml += `      <div class="document-meta">\n`;
        bodyHtml += `        <span class="author">${this.escape(document.author.name)}</span>\n`;
        usedCssClasses.add('document-meta');
        usedCssClasses.add('author');
        usedTags.add('span');

        if (document.createdAt) {
          const date = new Date(document.createdAt);
          bodyHtml += `        <span class="date">${this.escape(date.toLocaleDateString('ru-RU'))}</span>\n`;
          usedCssClasses.add('date');
        }
        bodyHtml += `      </div>\n`;
      }
      bodyHtml += `    </header>\n`;
    }

    // Оглавление
    if (options.includeTOC) {
      const tocHtml = this.buildTOC(document, blocks);
      bodyHtml += tocHtml;
      usedCssClasses.add('toc');
      usedTags.add('nav');
      usedTags.add('ul');
      usedTags.add('li');
      usedTags.add('a');
    }

    bodyHtml += `    <main class="document-body">\n`;

    // Рендерим только блоки верхнего уровня (parentId === null)
    const topLevelBlocks = blocks.filter(b => !b.parentId);
    for (const block of topLevelBlocks) {
      const result = await this.renderBlockWithStrategy(block, blocks, context);
      bodyHtml += result.html;
      result.cssClasses.forEach(cls => usedCssClasses.add(cls));
    }

    bodyHtml += `    </main>\n`;

    // Футер (если есть footer блок)
    const footerBlocks = blocks.filter(b => b.type === 'footer');
    if (footerBlocks.length > 0) {
      bodyHtml += `    <footer class="document-footer">\n`;
      usedTags.add('footer');
      for (const block of footerBlocks) {
        const result = await this.renderBlockWithStrategy(block, blocks, context);
        bodyHtml += result.html;
        result.cssClasses.forEach(cls => usedCssClasses.add(cls));
      }
      bodyHtml += `    </footer>\n`;
    }

    bodyHtml += `  </article>\n`;
    bodyHtml += this.getInlineScripts();

    // Извлекаем дополнительные классы из HTML
    const extractedClasses = CssExtractor.extractClassesFromHtml(bodyHtml);
    extractedClasses.forEach(cls => usedCssClasses.add(cls));

    // Извлекаем теги из HTML
    const extractedTags = CssExtractor.extractTagsFromHtml(bodyHtml);
    extractedTags.forEach(tag => usedTags.add(tag));

    // Загружаем CSS стили и извлекаем только используемые
    const cssStyles = await this.getOptimizedStyles(options.theme, usedCssClasses, usedTags);

    // Формируем итоговый HTML
    let html = '<!DOCTYPE html>\n<html lang="ru">\n<head>\n';
    html += '  <meta charset="UTF-8">\n';
    html += '  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n';
    html += `  <title>${this.escape(document.title || 'Document')}</title>\n`;
    html += '  <link rel="stylesheet" href="https://site-assets.fontawesome.com/releases/v6.5.1/css/all.css">\n';
    html += '  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">\n';
    html += '  <style>\n';
    html += cssStyles;
    html += '  </style>\n';
    html += '</head>\n<body>\n';
    html += bodyHtml;
    html += '</body>\n</html>';

    return html;
  }

  /**
   * Рендерит блок используя стратегию
   * @param {Object} block
   * @param {Array<Object>} allBlocks
   * @param {Object} context
   * @returns {Promise<{html: string, cssClasses: Set<string>}>}
   */
  async renderBlockWithStrategy(block, allBlocks, context) {
    const strategy = this.getStrategyForBlock(block.type);

    if (strategy) {
      return await strategy.render(block, allBlocks, context);
    }

    // Fallback для неизвестных типов блоков
    console.warn(`No strategy found for block type: ${block.type}`);
    const blockId = block.id ? ` id="${this.escape(block.id)}"` : '';
    return {
      html: `      <div class="block block-${block.type}"${blockId}>
        <pre>${this.escape(JSON.stringify(block.data || {}, null, 2))}</pre>
      </div>\n`,
      cssClasses: new Set(['block', `block-${block.type}`])
    };
  }

  /**
   * @param {Object} document
   * @param {Array} blocks
   * @returns {string}
   */
  buildTOC(document, blocks) {
    const sections = blocks.filter(b => b.type === 'section' && !b.parentId);
    if (sections.length === 0) return '';

    let html = '    <nav class="toc">\n      <h2>Содержание</h2>\n      <ul>\n';
    sections.forEach(section => {
      const title = section.data?.title || '';
      html += `        <li><a href="#${section.id}">${this.escape(title)}</a></li>\n`;
    });
    html += '      </ul>\n    </nav>\n';
    return html;
  }

  /**
   * @param {Object} block
   * @param {Array<Object>} allBlocks
   * @param {Object} options
   * @returns {Promise<string>}
   */
  async renderBlock(block, allBlocks, options) {
    const data = block.data || {};
    const blockId = block.id ? ` id="${this.escape(block.id)}"` : '';

    switch (block.type) {
      case 'header': {
        const title = data.title || '';
        const metadata = data.metadata || {};
        let html = `      <header class="block document-header"${blockId}>\n`;
        html += `        <h1>${this.escape(title)}</h1>\n`;
        if (metadata.author || metadata.date || metadata.version) {
          html += `        <div class="document-meta">\n`;
          if (metadata.author) {
            html += `          <span class="author">${this.escape(metadata.author)}</span>\n`;
          }
          if (metadata.date) {
            html += `          <span class="date">${this.escape(metadata.date)}</span>\n`;
          }
          if (metadata.version) {
            html += `          <span class="version">v${this.escape(String(metadata.version))}</span>\n`;
          }
          html += `        </div>\n`;
        }
        html += `      </header>\n`;
        return html;
      }

      case 'footer': {
        const content = data.content || '';
        return `      <div class="block document-footer"${blockId}>\n        <div class="footer-content">${this.escapeHtmlContent(content)}</div>\n      </div>\n`;
      }

      case 'section': {
        const level = Math.min(Math.max(data.level || 1, 1), 6);
        const title = data.title || '';
        const childBlocks = allBlocks.filter(b => b.parentId === block.id);

        let html = `      <section class="block section-block section-level-${level}"${blockId}>\n`;
        html += `        <h${level} class="section-title">${this.escape(title)}</h${level}>\n`;

        // Рендерим дочерние блоки
        if (childBlocks.length > 0) {
          html += `        <div class="section-content">\n`;
          for (const child of childBlocks) {
            html += await this.renderBlock(child, allBlocks, options);
          }
          html += `        </div>\n`;
        }

        html += `      </section>\n`;
        return html;
      }

      case 'text': {
        // Поддерживаем HTML форматирование, если есть
        let content = '';
        if (data.html) {
          // Используем HTML напрямую (уже экранирован и отформатирован)
          content = data.html;
        } else if (data.text) {
          // Если есть только текст, экранируем его
          content = this.escape(data.text);
        }
        return `      <div class="block text-block"${blockId}>\n        <p class="text-content">${content}</p>\n      </div>\n`;
      }

      case 'code': {
        const code = data.code || '';
        const language = this.normalizeCodeLanguage(data.language || '');
        const languageLabel = this.getLanguageLabel(language);
        const codeElementId = this.generateCodeElementId(block);
        const lineNumbersEnabled = data.lineNumbers !== false;
        const minimapEnabled = data.minimap === true;
        const colorized = await this.getMonacoColorizedHtml(code, language);
        const codeHtml = (colorized || this.escape(code).replace(/\n/g, '<br>'));
        const contentHtml = this.buildCodeDisplayHtml(codeHtml, code, { lineNumbersEnabled });
        const minimapHtml = minimapEnabled ? this.buildMinimapHtml(block.id) : '';
        const hiddenRawCode = `<code id="${this.escape(codeElementId)}" class="code-raw" data-raw-code="${this.escapeAttribute(code)}" aria-hidden="true" hidden></code>`;

        return `      <div class="block code-block" data-language="${this.escape(language)}"${blockId}>
        <div class="code-block-header">
          <div class="code-header-actions">
            <button class="code-copy-btn" type="button" data-target="${this.escape(codeElementId)}" aria-label="Копировать код" title="Копировать код">
              <i class="fa-solid fa-copy"></i>
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
      }

      case 'image': {
        const src = data.src || '';
        const alt = data.alt || '';
        const caption = data.caption || '';
        const align = data.align || 'center';
        const width = data.width ? ` width="${data.width}"` : '';
        const height = data.height ? ` height="${data.height}"` : '';

        let html = `      <figure class="block image-block image-align-${align}"${blockId}>\n`;
        html += `        <img src="${this.escape(src)}" alt="${this.escape(alt)}"${width}${height}>\n`;
        if (caption) {
          html += `        <figcaption class="image-caption">${this.escape(caption)}</figcaption>\n`;
        }
        html += `      </figure>\n`;
        return html;
      }

      case 'table': {
        const rows = data.rows || [];
        const hasHeader = data.header !== false && rows.length > 0;

        if (rows.length === 0) {
          return `      <div class="block table-block"${blockId}>\n        <table><tbody><tr><td></td></tr></tbody></table>\n      </div>\n`;
        }

        let html = `      <div class="block table-block"${blockId}>\n        <table>\n`;

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
        return html;
      }

      case 'quote': {
        const text = data.text || '';
        const quoteType = data.quoteType || data.type || 'default';
        const author = data.author || '';

        let html = `      <blockquote class="block quote-block quote-type-${quoteType}"${blockId}>\n`;
        html += `        <p class="quote-content">${this.escapeHtmlContent(text)}</p>\n`;
        if (author) {
          html += `        <cite class="quote-author">${this.escape(author)}</cite>\n`;
        }
        html += `      </blockquote>\n`;
        return html;
      }

      case 'toc': {
        const items = data.items || [];
        if (items.length === 0) return '';

        let html = `      <nav class="block toc-block"${blockId}>\n        <ul class="toc-list">\n`;
        items.forEach(item => {
          const level = item.level || 1;
          const title = item.title || '';
          const itemId = item.id ? ` href="#${this.escape(item.id)}"` : '';
          html += `          <li class="toc-item toc-level-${level}"><a${itemId}>${this.escape(title)}</a></li>\n`;
        });
        html += `        </ul>\n      </nav>\n`;
        return html;
      }

      default:
        return `      <div class="block block-${block.type}"${blockId}>\n        <pre>${this.escape(JSON.stringify(data, null, 2))}</pre>\n      </div>\n`;
    }
  }

  /**
   * Экранирует HTML, но сохраняет уже существующие теги форматирования
   * @param {string} str
   * @returns {string}
   */
  escapeHtmlContent(str) {
    if (!str) return '';
    // Если строка уже содержит HTML теги, просто экранируем спецсимволы
    // В противном случае экранируем всё
    const div = document.createElement('div');
    div.innerHTML = str;
    // Проверяем, есть ли HTML теги
    if (div.textContent !== str) {
      // Есть HTML теги - возвращаем как есть
      return str;
    } else {
      // Нет HTML тегов - экранируем
      return this.escape(str);
    }
  }

  /**
   * Загружает и оптимизирует CSS стили - возвращает только используемые правила
   * @param {string} theme
   * @param {Set<string>} usedClasses
   * @param {Set<string>} usedTags
   * @returns {Promise<string>}
   */
  async getOptimizedStyles(theme, usedClasses, usedTags) {
    const cssPaths = [
      'styles/reset.css',
      'styles/variables.css',
      'styles/main.css'
    ];

    try {
      // Загружаем CSS файлы
      const fullCss = await CssLoader.loadExportStyles(cssPaths);

      if (!fullCss || fullCss.trim().length === 0) {
        console.warn('Failed to load CSS files, using fallback styles');
        return this.getFallbackStyles(theme);
      }

      // Парсим и извлекаем только используемые правила
      this.cssExtractor.parseCss(fullCss);
      let optimizedCss = this.cssExtractor.extractUsedCss(usedClasses, new Set(), usedTags);

      // Добавляем экспортные стили
      optimizedCss += '\n\n' + this.getExportSpecificStyles(theme);

      // Добавляем темные темы если нужно
      if (theme === 'dark') {
        optimizedCss += '\n\n' + this.getDarkThemeOverrides();
      }

      return optimizedCss;
    } catch (error) {
      console.warn('Error optimizing CSS styles:', error);
      return this.getFallbackStyles(theme);
    }
  }

  /**
   * Загружает CSS стили из файлов проекта (старый метод, оставлен для обратной совместимости)
   * @param {string} theme
   * @returns {Promise<string>}
   */
  async getStyles(theme) {
    // Пути к CSS файлам (CssLoader сам попробует разные варианты путей)
    const cssPaths = [
      'styles/reset.css',
      'styles/variables.css',
      'styles/main.css'
    ];

    try {
      // Загружаем CSS файлы (CssLoader сам попробует разные пути)
      let css = await CssLoader.loadExportStyles(cssPaths);

      // Если стили не загрузились, используем fallback
      if (!css || css.trim().length === 0) {
        console.warn('Failed to load CSS files, using fallback styles');
        css = this.getFallbackStyles(theme);
      } else {
        // Добавляем дополнительные стили для экспорта
        css += this.getExportSpecificStyles(theme);

        // Если выбрана темная тема, добавляем переопределения для темной темы
        if (theme === 'dark') {
          css += this.getDarkThemeOverrides();
        }
      }

      return css;
    } catch (error) {
      console.warn('Error loading CSS styles:', error);
      // Fallback на базовые стили
      return this.getFallbackStyles(theme);
    }
  }

  /**
   * Добавляет переопределения стилей для темной темы
   * @returns {string}
   */
  getDarkThemeOverrides() {
    return `
      /* Переопределения для темной темы */
      :root {
        --primary-color: #2d3748;
        --secondary-color: #4a5568;
        --accent-color: #63b3ed;
        --text-color: #e2e8f0;
        --border-color: #4a5568;
        --document-bg: #1a202c;
        --header-bg: #2d3748;
        --header-color: #e2e8f0;
        --color-bg: #1a202c;
      }
      
      body {
        background: #1a202c;
        color: #e2e8f0;
      }
      
      .document {
        background: #1a202c;
      }
      
      .document-header {
        background-color: #2d3748;
        color: #e2e8f0;
      }
      
      .toc {
        background: #2d3748;
      }
      
      .table-block th {
        background: #2d3748;
      }
      
      .code-block {
        background: #2d3748;
      }
    `;
  }


  /**
   * Возвращает базовые стили для экспорта (fallback)
   * @param {string} theme
   * @returns {string}
   */
  getFallbackStyles(theme) {
    // Минимальные стили, если CSS файлы недоступны
    return `
      * { box-sizing: border-box; }
      body { 
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        line-height: 1.6;
        max-width: 900px;
        margin: 0 auto;
        padding: 20px;
      }
      .document { margin: 0; }
      .block { margin: 15px 0; padding: 15px; }
      .text-content { line-height: 1.7; }
      .code-block {
        background: #2d3748;
        color: #e2e8f0;
        border-radius: 6px;
        overflow: hidden;
        padding: 0 12px 12px 12px;
      }
      .code-block-header {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        margin: 0 -6px;
        padding: 6px;
        gap: 6px;
        background: #2d3748;
      }
      .code-header-actions {
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      .code-language-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background-color: rgba(255, 255, 255, 0.12);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 6px;
        padding: 4px 10px;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
      }
      .code-copy-btn {
        background-color: rgba(255, 255, 255, 0.08);
        color: #e2e8f0;
        border: 1px solid rgba(255, 255, 255, 0.2);
        padding: 4px 8px;
        border-radius: 6px;
        cursor: pointer;
      }
      .code-block pre { 
        background: transparent;
        color: inherit;
        padding: 0;
        margin: 0;
      }
      .code-pre__inner {
        display: block;
        white-space: pre;
        font-family: 'Consolas', 'Courier New', monospace;
        font-size: 14px;
        line-height: 1.5;
        color: inherit;
      }
      .code-minimap {
        flex: 0 0 auto;
        border-left: 1px solid rgba(255, 255, 255, 0.2);
        padding-left: 12px;
      }
      .code-minimap img {
        display: block;
        max-width: 120px;
        height: auto;
      }
      .table-block table { 
        width: 100%;
        border-collapse: collapse;
      }
      .table-block th { 
        background: #1a365d;
        color: white;
        padding: 15px;
      }
      .table-block td { 
        padding: 15px;
        border-bottom: 1px solid #cbd5e0;
      }
    `;
  }

  /**
   * Добавляет специфичные стили для экспорта, которых может не быть в основных CSS
   * @param {string} theme
   * @returns {string}
   */
  getExportSpecificStyles(theme) {
    // Стили для скрытия элементов редактора и улучшения экспорта
    return `
       /* ==========================================================================
          Стили для экспорта документа
          ========================================================================== */
       
       /* Скрываем элементы редактора в экспорте */
       .drop-zone-indicator,
       .code-resize-handle,
       .code-settings-btn,
       .code-settings-container,
       .code-settings-dropdown,
       .code-language-dropdown,
       .autosave-indicator,
       .slash-menu,
       .context-menu,
       .modal-overlay {
         display: none !important;
       }
       
       /* Убираем интерактивные эффекты для экспорта */
      .document-block:hover,
      .block:hover,
      .code-block:hover {
        background-color: inherit !important;
        box-shadow: inherit !important;
      }
       
       /* Убираем курсоры и атрибуты для экспорта */
       .document-block[draggable="true"],
       .block[draggable="true"] {
         cursor: default !important;
         -webkit-user-drag: none !important;
         user-select: text !important;
       }
       
       /* Убираем фокус и выделение для экспорта */
       .text-content[contenteditable="true"] {
         outline: none !important;
       }
       
       /* Улучшаем отображение для экспорта */
       body {
         max-width: 900px;
         margin: 0 auto;
         padding: 20px;
       }
       
       .document {
         background: var(--document-bg, white);
         border-radius: var(--border-radius, 6px);
         box-shadow: var(--shadow, 0 4px 6px rgba(0, 0, 0, 0.1));
         overflow: hidden;
       }

      .code-block {
        padding: 0 12px 12px 12px;
        transition: none !important;
      }

      .code-block-header {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        margin: 0 -6px;
        padding: 6px;
        gap: 6px;
      }

      .code-header-actions {
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }

      .code-language-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background-color: rgba(255, 255, 255, 0.12);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: var(--border-radius, 6px);
        padding: 4px 10px;
        font-size: var(--font-size-xs, 12px);
        font-weight: 600;
        text-transform: uppercase;
        color: inherit;
        cursor: default;
      }

      .code-copy-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        background-color: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: inherit;
        padding: 4px 8px;
        border-radius: var(--border-radius, 6px);
        cursor: pointer;
        transition: none;
      }

      .code-copy-btn.copied {
        color: var(--success-color, #38a169);
      }

      .code-block-body {
        display: flex;
        align-items: stretch;
        gap: 12px;
        margin-top: 6px;
      }

      .code-block-content {
        flex: 1;
        overflow: auto;
      }
      .code-block-content--numbered {
        overflow: auto;
      }

      .code-lines {
        font-family: 'Consolas', 'Courier New', monospace;
        font-size: 14px;
        line-height: 1.5;
      }

      .code-line {
        display: grid;
        grid-template-columns: minmax(32px, auto) 1fr;
        gap: 16px;
      }

      .code-line-number {
        text-align: right;
        user-select: none;
        color: rgba(255, 255, 255, 0.6);
        padding-right: 8px;
      }

      .code-line-text {
        white-space: pre;
        font-family: inherit;
        color: inherit;
      }

      .code-pre {
        margin: 0;
        background: transparent;
        border: none;
        padding: 0;
      }

      .code-pre:hover {
        background: transparent !important;
      }

      .code-pre__inner {
        display: block;
        white-space: pre;
        font-family: 'Consolas', 'Courier New', monospace;
        font-size: 14px;
        line-height: 1.5;
        color: inherit;
      }

      .code-minimap {
        flex: 0 0 auto;
        display: flex;
        align-items: stretch;
        border-left: 1px solid rgba(255, 255, 255, 0.2);
        padding-left: 12px;
      }

      .code-minimap img {
        display: block;
        max-width: 120px;
        height: auto;
      }
 
       /* Печать */
       @media print {
         body { 
           max-width: 100% !important; 
           padding: 0 !important;
           background: white !important;
         }
         .document {
           box-shadow: none !important;
         }
         .block { 
           page-break-inside: avoid !important; 
         }
         .document-header {
           page-break-after: avoid !important;
         }
         .code-block {
           page-break-inside: avoid !important;
         }
         .table-block {
           page-break-inside: auto !important;
         }
       }
    `;
  }

  /**
   * Возвращает inline-скрипты для экспорта (копирование кода)
   * @returns {string}
   */
  getInlineScripts() {
    return `  <script>
    (function() {
      const buttons = document.querySelectorAll('.code-copy-btn');
      if (!buttons.length) {
        return;
      }

      const markCopied = (button, icon) => {
        button.classList.add('copied');
        if (icon) {
          icon.classList.add('fa-bounce');
        }
        setTimeout(() => {
          button.classList.remove('copied');
          if (icon) {
            icon.classList.remove('fa-bounce');
          }
        }, 1200);
      };

      buttons.forEach((button) => {
         const icon = button.querySelector('i');
         button.addEventListener('click', async () => {
           const targetId = button.getAttribute('data-target');
          let codeElement = null;
          if (targetId) {
            codeElement = document.getElementById(targetId);
          }
          if (!codeElement) {
            const container = typeof button.closest === 'function' ? button.closest('.code-block') : null;
            if (container) {
              codeElement = container.querySelector('code');
            }
          }
          if (!codeElement) {
            return;
          }

          const rawCodeAttr = codeElement.getAttribute('data-raw-code');
          const codeText = rawCodeAttr !== null ? rawCodeAttr : (codeElement.textContent || '');

          try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
              await navigator.clipboard.writeText(codeText);
              markCopied(button, icon);
              return;
            }
          } catch (error) {
            console.warn('Clipboard API failed, fallback to textarea copy', error);
          }

          const textarea = document.createElement('textarea');
          textarea.value = codeText;
          textarea.setAttribute('readonly', '');
          textarea.style.position = 'absolute';
          textarea.style.left = '-9999px';
          document.body.appendChild(textarea);
          textarea.select();
          try {
            document.execCommand('copy');
            markCopied(button, icon);
          } catch (fallbackError) {
            console.warn('Fallback copy failed', fallbackError);
          }
          document.body.removeChild(textarea);
        });
      });
    })();
  </script>\n`;
  }

  /**
   * Нормализует значение языка для экспорта
   * @param {string} language
   * @returns {string}
   */
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

  /**
   * Возвращает читаемое название языка
   * @param {string} language
   * @returns {string}
   */
  getLanguageLabel(language) {
    const normalized = this.normalizeCodeLanguage(language);
    return CODE_LANGUAGE_LABELS[normalized] || CODE_LANGUAGE_LABELS[language] || normalized.toUpperCase();
  }

  /**
   * Находит актуальный идентификатор языка Monaco
   * @param {string} language
   * @returns {string}
   */
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

  /**
   * Возвращает HTML кода с inline-стилями Monaco (если доступен)
   * @param {string} code
   * @param {string} language
   * @returns {Promise<string|null>}
   */
  async getMonacoColorizedHtml(code, language) {
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
      return this.convertMonacoTokensToInlineStyles(colorized);
    } catch (error) {
      console.warn('Monaco colorize failed, falling back to plain export:', error);
      return null;
    }
  }

  /**
   * Преобразует HTML с классами Monaco в inline-стили
   * @param {string} html
   * @returns {string}
   */
  convertMonacoTokensToInlineStyles(html) {
    if (typeof document === 'undefined' || !document.body) {
      return html;
    }

    const hiddenHost = document.createElement('div');
    hiddenHost.style.position = 'absolute';
    hiddenHost.style.left = '-9999px';
    hiddenHost.style.top = '-9999px';
    hiddenHost.style.visibility = 'hidden';
    hiddenHost.style.pointerEvents = 'none';
    hiddenHost.innerHTML = `<div class="monaco-export-wrapper">${html}</div>`;

    document.body.appendChild(hiddenHost);
    const wrapper = hiddenHost.firstElementChild;

    if (!wrapper) {
      document.body.removeChild(hiddenHost);
      return html;
    }

    const spans = wrapper.querySelectorAll('span');
    spans.forEach(span => {
      const computed = window.getComputedStyle(span);
      const styleParts = [];

      if (computed.color) {
        styleParts.push(`color:${computed.color}`);
      }

      if (computed.backgroundColor && computed.backgroundColor !== 'rgba(0, 0, 0, 0)' && computed.backgroundColor !== 'transparent') {
        styleParts.push(`background-color:${computed.backgroundColor}`);
      }

      if (computed.fontWeight && computed.fontWeight !== '400' && computed.fontWeight !== 'normal') {
        styleParts.push(`font-weight:${computed.fontWeight}`);
      }

      if (computed.fontStyle && computed.fontStyle !== 'normal') {
        styleParts.push(`font-style:${computed.fontStyle}`);
      }

      const decoration = computed.textDecorationLine;
      if (decoration && decoration !== 'none') {
        styleParts.push(`text-decoration:${decoration}`);
      }

      if (styleParts.length > 0) {
        span.setAttribute('style', styleParts.join(';'));
      } else {
        span.removeAttribute('style');
      }

      span.removeAttribute('class');
    });

    const result = wrapper.innerHTML;
    document.body.removeChild(hiddenHost);
    return result;
  }

  /**
   * Формирует HTML содержимого блока кода (с учетом нумерации строк)
   * @param {string} codeHtml
   * @param {string} rawCode
   * @param {{ lineNumbersEnabled: boolean }} options
   * @returns {string}
   */
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

  /**
   * Разбивает HTML кода на строки, сохраняя форматирование
   * @param {string} codeHtml
   * @param {string} rawCode
   * @returns {string[]}
   */
  splitCodeIntoLines(codeHtml, rawCode) {
    const rawLines = String(rawCode || '').split(/\r?\n/);
    if (!codeHtml) {
      return rawLines.map(line => this.escape(line).replace(/ /g, '&nbsp;'));
    }

    const parts = codeHtml.split(/<br\s*\/?\s*>/gi);
    let lines = parts.length > 1 ? parts : [codeHtml];

    // Удаляем возможную пустую последнюю строку, если код не заканчивается переносом
    if (lines.length > rawLines.length && lines[lines.length - 1].trim() === '') {
      lines = lines.slice(0, rawLines.length);
    }

    while (lines.length < rawLines.length) {
      lines.push('');
    }

    // Заменяем обычные пробелы на неразрывные, чтобы сохранить форматирование
    return lines.map((line, index) => {
      if (!line) {
        return this.escape(rawLines[index] || '').replace(/ /g, '&nbsp;');
      }

      // Если строка содержит теги, доверяем Monaco (он уже расставил &nbsp; где нужно)
      if (/<[^>]+>/.test(line)) {
        return line;
      }

      return line.replace(/ /g, '&nbsp;');
    });
  }

  /**
   * Строит HTML для миникарты, если она доступна
   * @param {string} blockId
   * @returns {string}
   */
  buildMinimapHtml(blockId) {
    const dataUrl = this.getMonacoMinimapDataUrl(blockId);
    if (!dataUrl) {
      return '';
    }

    return `<div class="code-minimap"><img src="${dataUrl}" alt="Code minimap"></div>`;
  }

  /**
   * Получает snapshot миним карты Monaco
   * @param {string} blockId
   * @returns {string|null}
   */
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

  /**
   * Экранирует значение для использования в HTML-атрибуте
   * @param {string} value
   * @returns {string}
   */
  escapeAttribute(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\r/g, '&#13;')
      .replace(/\n/g, '&#10;');
  }

  /**
   * Генерирует уникальный идентификатор для элемента кода
   * @param {Object} block
   * @returns {string}
   */
  generateCodeElementId(block) {
    let base = '';

    if (block && block.id) {
      base = String(block.id);
    } else {
      base = `export-code-${++this.codeBlockCounter}`;
    }

    const sanitizedBase = base
      .replace(/[^a-zA-Z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || `code-block-${++this.codeBlockCounter}`;

    let candidate = `code-${sanitizedBase}`;
    let suffix = 1;

    while (this._codeElementIds.has(candidate)) {
      candidate = `code-${sanitizedBase}-${suffix++}`;
    }

    this._codeElementIds.add(candidate);
    return candidate;
  }

  /**
   * @param {string} str
   * @returns {string}
   */
  escape(str) {
    if (typeof str !== 'string') {
      str = String(str || '');
    }
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * @param {Object} document
   * @returns {boolean}
   */
  validate(document) {
    return document && document.id;
  }
}

