/**
 * @class Template
 * @description Шаблон документа
 */
export class Template {
  /**
   * @param {Object} data
   * @param {string} data.id - уникальный идентификатор шаблона
   * @param {string} data.name - название шаблона
   * @param {string} [data.description] - описание шаблона
   * @param {string} [data.category] - категория (ТЗ, инструкции, стандарты и т.д.)
   * @param {Array<Object>} data.blocks - массив блоков
   * @param {Object} [data.variables] - переменные шаблона
   * @param {Object} [data.metadata] - дополнительные метаданные
   */
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description || '';
    this.category = data.category || 'general';
    this.blocks = data.blocks || [];
    this.variables = data.variables || {};
    this.metadata = data.metadata || {};
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  /**
   * Получает список переменных в шаблоне
   * @returns {string[]}
   */
  getVariables() {
    return Object.keys(this.variables);
  }

  /**
   * Проверяет, содержит ли шаблон переменные
   * @returns {boolean}
   */
  hasVariables() {
    return this.getVariables().length > 0;
  }

  /**
   * Применяет значения переменных к шаблону
   * @param {Object} values - значения переменных
   * @returns {Template} новый экземпляр с подставленными значениями
   */
  apply(values) {
    const processedBlocks = this._processBlocks(this.blocks, values);
    
    return new Template({
      ...this.toJSON(),
      blocks: processedBlocks
    });
  }

  /**
   * Обрабатывает блоки, заменяя переменные
   * @private
   * @param {Array<Object>} blocks
   * @param {Object} values
   * @returns {Array<Object>}
   */
  _processBlocks(blocks, values) {
    return blocks.map(block => {
      const processedBlock = { ...block };
      
      // Обрабатываем все строковые поля рекурсивно
      Object.keys(processedBlock).forEach(key => {
        if (typeof processedBlock[key] === 'string') {
          processedBlock[key] = this._replaceVariables(processedBlock[key], values);
        } else if (typeof processedBlock[key] === 'object' && processedBlock[key] !== null) {
          processedBlock[key] = this._processObject(processedBlock[key], values);
        }
      });
      
      return processedBlock;
    });
  }

  /**
   * Обрабатывает объект, заменяя переменные
   * @private
   * @param {Object} obj
   * @param {Object} values
   * @returns {Object}
   */
  _processObject(obj, values) {
    if (Array.isArray(obj)) {
      return obj.map(item => 
        typeof item === 'object' ? this._processObject(item, values) : 
        typeof item === 'string' ? this._replaceVariables(item, values) : item
      );
    }

    const processed = {};
    Object.keys(obj).forEach(key => {
      if (typeof obj[key] === 'string') {
        processed[key] = this._replaceVariables(obj[key], values);
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        processed[key] = this._processObject(obj[key], values);
      } else {
        processed[key] = obj[key];
      }
    });
    
    return processed;
  }

  /**
   * Заменяет переменные в строке
   * @private
   * @param {string} text
   * @param {Object} values
   * @returns {string}
   */
  _replaceVariables(text, values) {
    return text.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      return values[varName] !== undefined ? values[varName] : match;
    });
  }

  /**
   * Валидирует переданные значения переменных
   * @param {Object} values
   * @returns {{valid: boolean, errors: string[]}}
   */
  validate(values) {
    const errors = [];
    
    Object.keys(this.variables).forEach(varName => {
      const varConfig = this.variables[varName];
      
      // Проверка обязательных переменных
      if (varConfig.required && !values[varName]) {
        errors.push(`Переменная "${varName}" обязательна для заполнения`);
      }
      
      // Проверка типа
      if (values[varName] && varConfig.type) {
        const actualType = typeof values[varName];
        if (actualType !== varConfig.type) {
          errors.push(`Переменная "${varName}" должна быть типа ${varConfig.type}, получен ${actualType}`);
        }
      }
    });
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Клонирует шаблон
   * @returns {Template}
   */
  clone() {
    return new Template(JSON.parse(JSON.stringify(this.toJSON())));
  }

  /**
   * Сериализация в JSON
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      category: this.category,
      blocks: this.blocks,
      variables: this.variables,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Создает шаблон из JSON
   * @param {Object} json
   * @returns {Template}
   */
  static fromJSON(json) {
    return new Template(json);
  }
}

