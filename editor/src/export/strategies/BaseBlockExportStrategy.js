/**
 * Базовая стратегия экспорта блока
 * Определяет интерфейс для всех стратегий экспорта
 */
export class BaseBlockExportStrategy {
    /**
     * @param {Object} options - опции экспорта
     */
    constructor(options = {}) {
        this.options = options;
    }

    /**
     * Проверяет, может ли стратегия обработать данный тип блока
     * @param {string} blockType
     * @returns {boolean}
     */
    canHandle(blockType) {
        throw new Error('canHandle must be implemented by subclass');
    }

    /**
     * Рендерит блок в HTML
     * @param {Object} block - блок для рендеринга
     * @param {Array<Object>} allBlocks - все блоки документа (для связей)
     * @param {Object} context - контекст рендеринга (helpers, counters, etc)
     * @returns {Promise<{html: string, cssClasses: Set<string>, inlineStyles: string}>}
     */
    async render(block, allBlocks, context) {
        throw new Error('render must be implemented by subclass');
    }

    /**
     * Возвращает список CSS классов, используемых этим типом блока
     * @returns {Set<string>}
     */
    getRequiredCssClasses() {
        return new Set();
    }

    /**
     * Возвращает критичные inline-стили для блока (опционально)
     * @returns {string}
     */
    getCriticalStyles() {
        return '';
    }

    /**
     * Экранирует HTML
     * @param {string} str
     * @returns {string}
     */
    escape(str) {
        if (typeof str !== 'string') {
            str = String(str || '');
        }
        const div = typeof document !== 'undefined' ? document.createElement('div') : null;
        if (div) {
            div.textContent = str;
            return div.innerHTML;
        }
        // Fallback для Node.js окружения
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
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
}

