/**
 * CssExtractor - извлекает только используемые CSS правила
 */
export class CssExtractor {
  constructor() {
    this.parsedRules = null;
    this.baseStyles = null;
  }

  /**
   * Парсит CSS и сохраняет правила
   * @param {string} css
   */
  parseCss(css) {
    if (!css) {
      this.parsedRules = [];
      return;
    }

    const rules = [];
    let currentPos = 0;
    let depth = 0;
    let inString = false;
    let stringChar = '';
    let currentRule = { selector: '', content: '', start: 0, isMediaQuery: false, mediaRules: [] };
    
    for (let i = 0; i < css.length; i++) {
      const char = css[i];
      const prevChar = i > 0 ? css[i - 1] : '';
      
      // Обработка строк
      if ((char === '"' || char === "'") && prevChar !== '\\') {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
          stringChar = '';
        }
        continue;
      }
      
      if (inString) {
        continue;
      }
      
      // Обработка блоков
      if (char === '{') {
        if (depth === 0) {
          const selector = css.substring(currentPos, i).trim();
          currentRule.selector = selector;
          currentRule.start = i + 1;
          currentRule.isMediaQuery = selector.startsWith('@media');
        }
        depth++;
      } else if (char === '}') {
        depth--;
        if (depth === 0) {
          currentRule.content = css.substring(currentRule.start, i).trim();
          
          if (currentRule.isMediaQuery) {
            // Рекурсивно парсим правила внутри media query
            const innerExtractor = new CssExtractor();
            innerExtractor.parseCss(currentRule.content);
            currentRule.mediaRules = innerExtractor.parsedRules || [];
          }
          
          rules.push({
            selector: currentRule.selector,
            content: currentRule.content,
            isMediaQuery: currentRule.isMediaQuery,
            mediaRules: currentRule.mediaRules
          });
          
          currentRule = { selector: '', content: '', start: 0, isMediaQuery: false, mediaRules: [] };
          currentPos = i + 1;
        }
      }
    }
    
    this.parsedRules = rules;
  }

  /**
   * Извлекает только используемые CSS правила
   * @param {Set<string>} usedClasses - множество используемых классов
   * @param {Set<string>} usedIds - множество используемых ID
   * @param {Set<string>} usedTags - множество используемых тегов
   * @returns {string}
   */
  extractUsedCss(usedClasses, usedIds = new Set(), usedTags = new Set()) {
    if (!this.parsedRules) {
      return '';
    }

    const usedRules = [];

    // Всегда включаем :root и базовые правила
    const alwaysInclude = [':root', '*', 'html', 'body'];

    for (const rule of this.parsedRules) {
      if (rule.isMediaQuery) {
        // Обрабатываем media query
        const innerExtractor = new CssExtractor();
        innerExtractor.parsedRules = rule.mediaRules;
        const innerCss = innerExtractor.extractUsedCss(usedClasses, usedIds, usedTags);
        
        if (innerCss.trim()) {
          usedRules.push(`${rule.selector} {\n${innerCss}\n}`);
        }
        continue;
      }

      // Проверяем, нужно ли включать это правило
      if (this.shouldIncludeRule(rule.selector, usedClasses, usedIds, usedTags, alwaysInclude)) {
        usedRules.push(`${rule.selector} {\n  ${rule.content}\n}`);
      }
    }

    return usedRules.join('\n\n');
  }

  /**
   * Проверяет, нужно ли включать CSS правило
   * @param {string} selector
   * @param {Set<string>} usedClasses
   * @param {Set<string>} usedIds
   * @param {Set<string>} usedTags
   * @param {Array<string>} alwaysInclude
   * @returns {boolean}
   */
  shouldIncludeRule(selector, usedClasses, usedIds, usedTags, alwaysInclude) {
    // Всегда включаем базовые правила
    const trimmedSelector = selector.trim();
    for (const base of alwaysInclude) {
      if (trimmedSelector === base || trimmedSelector.startsWith(base + ' ') || trimmedSelector.startsWith(base + ',')) {
        return true;
      }
    }

    // Разбиваем селектор на части (обрабатываем ,)
    const parts = selector.split(',').map(s => s.trim());

    for (const part of parts) {
      // Извлекаем классы из селектора
      const classMatches = part.match(/\.([a-zA-Z0-9_-]+)/g);
      if (classMatches) {
        for (const match of classMatches) {
          const className = match.substring(1); // убираем точку
          if (usedClasses.has(className)) {
            return true;
          }
        }
      }

      // Извлекаем ID из селектора
      const idMatches = part.match(/#([a-zA-Z0-9_-]+)/g);
      if (idMatches) {
        for (const match of idMatches) {
          const idName = match.substring(1); // убираем #
          if (usedIds.has(idName)) {
            return true;
          }
        }
      }

      // Извлекаем теги из селектора
      const tagMatches = part.match(/^([a-z][a-z0-9]*)/i);
      if (tagMatches && usedTags.has(tagMatches[1])) {
        return true;
      }

      // Проверяем псевдоклассы и псевдоэлементы
      if (part.includes(':hover') || part.includes(':focus') || part.includes(':active') || 
          part.includes('::before') || part.includes('::after')) {
        // Проверяем базовый селектор без псевдокласса
        const baseSelector = part.replace(/:[a-z-]+(\([^)]*\))?/gi, '').trim();
        const baseClassMatches = baseSelector.match(/\.([a-zA-Z0-9_-]+)/g);
        if (baseClassMatches) {
          for (const match of baseClassMatches) {
            const className = match.substring(1);
            if (usedClasses.has(className)) {
              return true;
            }
          }
        }
      }
    }

    return false;
  }

  /**
   * Собирает все CSS классы из HTML строки
   * @param {string} html
   * @returns {Set<string>}
   */
  static extractClassesFromHtml(html) {
    const classes = new Set();
    
    // Находим все class="..." и class='...'
    const classMatches = html.matchAll(/class=["']([^"']+)["']/g);
    
    for (const match of classMatches) {
      const classList = match[1].split(/\s+/);
      classList.forEach(cls => {
        if (cls) {
          classes.add(cls);
        }
      });
    }
    
    return classes;
  }

  /**
   * Собирает все используемые теги из HTML
   * @param {string} html
   * @returns {Set<string>}
   */
  static extractTagsFromHtml(html) {
    const tags = new Set();
    const tagMatches = html.matchAll(/<([a-z][a-z0-9]*)/gi);
    
    for (const match of tagMatches) {
      tags.add(match[1].toLowerCase());
    }
    
    return tags;
  }

  /**
   * Минифицирует CSS (удаляет лишние пробелы и переносы)
   * @param {string} css
   * @returns {string}
   */
  static minify(css) {
    return css
      .replace(/\/\*[\s\S]*?\*\//g, '') // удаляем комментарии
      .replace(/\s+/g, ' ') // схлопываем пробелы
      .replace(/\s*{\s*/g, '{')
      .replace(/\s*}\s*/g, '}')
      .replace(/\s*;\s*/g, ';')
      .replace(/\s*:\s*/g, ':')
      .replace(/\s*,\s*/g, ',')
      .trim();
  }
}

