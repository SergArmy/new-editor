export class MarkdownShortcuts {
  constructor() {
    this.shortcuts = new Map();
    this.registerDefaults();
  }

  registerDefaults() {
    this.register('##', { type: 'section', level: 2, trigger: 'Space' });
    this.register('###', { type: 'section', level: 3, trigger: 'Space' });
    this.register('####', { type: 'section', level: 4, trigger: 'Space' });
    // Порядок важен: сначала проверяем более длинные паттерны
    this.register('**', { type: 'format', format: 'bold', wrap: true, trigger: 'Space' });
    this.register('*', { type: 'format', format: 'italic', wrap: true, trigger: 'Space' });
    this.register('---', { type: 'block', blockType: 'divider', trigger: 'Enter' });
  }

  /**
   * @param {string} pattern
   * @param {Object} action
   */
  register(pattern, action) {
    this.shortcuts.set(pattern, action);
  }

  /**
   * @param {string} text
   * @param {number} cursorPosition
   * @param {string} trigger
   * @returns {Object|null}
   */
  match(text, cursorPosition, trigger) {
    for (const [pattern, action] of this.shortcuts.entries()) {
      if (action.trigger && action.trigger !== trigger) continue;
      
      const beforeCursor = text.substring(0, cursorPosition);
      const trimmed = beforeCursor.trimEnd();
      
      // Для wrap-форматирования нужно проверить наличие обоих маркеров
      if (action.wrap && action.type === 'format') {
        // Проверяем, что в конце есть закрывающий маркер
        if (trimmed.endsWith(pattern)) {
          // Ищем открывающий маркер перед закрывающим
          const beforeLastPattern = trimmed.substring(0, trimmed.length - pattern.length);
          const openIndex = beforeLastPattern.lastIndexOf(pattern);
          
          // Если нашли открывающий маркер и между ними есть текст
          if (openIndex !== -1 && openIndex + pattern.length < beforeLastPattern.length) {
            // Дополнительная проверка: убедимся, что между маркерами нет других таких же маркеров
            // чтобы избежать срабатывания при **Текст* (где только один закрывающий *)
            const textBetween = beforeLastPattern.substring(openIndex + pattern.length);
            const hasAnotherPattern = textBetween.includes(pattern);
            
            // Разрешаем только если нет промежуточных маркеров (для простых случаев)
            // или если это единственная пара
            if (!hasAnotherPattern) {
              return {
                pattern,
                action,
                start: openIndex,
                end: trimmed.length
              };
            }
          }
        }
      } else {
        // Для других типов (section, block) проверяем только наличие паттерна в конце
        if (trimmed.endsWith(pattern)) {
          const start = trimmed.length - pattern.length;
          return {
            pattern,
            action,
            start,
            end: trimmed.length
          };
        }
      }
    }
    return null;
  }

  /**
   * @param {string} pattern
   * @returns {Object|undefined}
   */
  get(pattern) {
    return this.shortcuts.get(pattern);
  }
}

