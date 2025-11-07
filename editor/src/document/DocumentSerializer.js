import { Document } from './Document.js';

export class DocumentSerializer {
  /**
   * @param {Document} document
   * @returns {Object}
   */
  static serialize(document) {
    return {
      id: document.id,
      title: document.title,
      version: document.version,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      author: document.author,
      permissions: document.permissions,
      metadata: document.metadata,
      content: {
        blocks: document.blocks.map(b => ({
          id: b.id,
          type: b.type,
          position: b.position,
          parentId: b.parentId,
          protected: b.protected || false,
          data: b.data
        }))
      }
    };
  }

  /**
   * @param {Object} json
   * @returns {Document}
   */
  static deserialize(json) {
    return new Document({
      id: json.id,
      title: json.title,
      version: json.version,
      createdAt: json.createdAt,
      updatedAt: json.updatedAt,
      author: json.author,
      permissions: json.permissions,
      metadata: json.metadata,
      blocks: json.content?.blocks || []
    });
  }
}

