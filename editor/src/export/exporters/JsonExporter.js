import { DocumentSerializer } from '../../document/DocumentSerializer.js';

export class JsonExporter {
  /**
   * @param {Object} document - может быть Document объект или сериализованный документ
   * @param {Object} [options]
   * @returns {Promise<string>}
   */
  async export(document, options = {}) {
    // Если документ уже сериализован (есть content.blocks), используем его напрямую
    // Если это Document объект (есть document.blocks), сериализуем его
    let serialized;
    if (document.content && document.content.blocks) {
      // Уже сериализованный документ
      serialized = document;
    } else if (document.blocks) {
      // Это Document объект - нужно сериализовать
      serialized = DocumentSerializer.serialize(document);
    } else {
      throw new Error('Invalid document format for JSON export');
    }
    
    const indent = options.pretty !== false ? 2 : 0;
    return JSON.stringify(serialized, null, indent);
  }

  /**
   * @param {Object} document - может быть Document объект или сериализованный документ
   * @returns {boolean}
   */
  validate(document) {
    if (!document || !document.id) {
      return false;
    }
    
    // Поддерживаем оба формата: document.blocks (Document) и document.content.blocks (сериализованный)
    const hasBlocks = document.blocks && Array.isArray(document.blocks);
    const hasContentBlocks = document.content && document.content.blocks && Array.isArray(document.content.blocks);
    
    return hasBlocks || hasContentBlocks;
  }
}

