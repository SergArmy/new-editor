import { DocumentMetadata } from './DocumentMetadata.js';

/**
 * @typedef {Object} BlockData
 * @property {string} id
 * @property {string} type
 * @property {number} position
 * @property {string|null} parentId
 * @property {boolean} protected
 * @property {Object} data
 */

export class Document {
  /**
   * @param {Object} data
   * @param {string} data.id
   * @param {string} data.title
   * @param {number} [data.version]
   * @param {string} [data.createdAt]
   * @param {string} [data.updatedAt]
   * @param {Object} [data.author]
   * @param {Object} [data.permissions]
   * @param {Object} [data.metadata]
   * @param {BlockData[]} [data.blocks]
   */
  constructor(data) {
    this.id = data.id;
    this.metadata = new DocumentMetadata(data);
    this.title = data.title || '';
    this.version = data.version || 1;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.author = data.author || { id: '', name: '' };
    this.permissions = data.permissions || { owner: '', editors: [], commenters: [], readers: [] };
    this.blocks = data.blocks || [];
  }

  /**
   * @param {BlockData} block
   */
  addBlock(block) {
    this.blocks.push(block);
    this.blocks.sort((a, b) => a.position - b.position);
  }

  /**
   * @param {string} id
   * @returns {BlockData|undefined}
   */
  getBlock(id) {
    return this.blocks.find(b => b.id === id);
  }

  /**
   * @param {string} id
   */
  removeBlock(id) {
    const idx = this.blocks.findIndex(b => b.id === id);
    if (idx >= 0) this.blocks.splice(idx, 1);
  }

  /**
   * Обновляет данные блока
   * @param {string} id
   * @param {Object} data - новые данные блока
   */
  updateBlock(id, data) {
    const block = this.getBlock(id);
    if (!block) return false;
    
    // Обновляем данные блока
    if (data.data !== undefined) {
      block.data = { ...block.data, ...data.data };
    }
    if (data.position !== undefined) {
      block.position = data.position;
      this.blocks.sort((a, b) => a.position - b.position);
    }
    if (data.parentId !== undefined) {
      block.parentId = data.parentId;
    }
    if (data.protected !== undefined) {
      block.protected = data.protected;
    }
    
    // Обновляем время изменения документа
    this.updatedAt = new Date().toISOString();
    
    return true;
  }
}

