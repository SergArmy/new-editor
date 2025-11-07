/**
 * @typedef {Object} Author
 * @property {string} id
 * @property {string} name
 */

/**
 * @typedef {Object} Permissions
 * @property {string} owner
 * @property {string[]} editors
 * @property {string[]} commenters
 * @property {string[]} readers
 */

/**
 * @typedef {Object} DocumentMetadataData
 * @property {string[]} tags
 * @property {string} category
 */

export class DocumentMetadata {
  /**
   * @param {Object} data
   * @param {string} data.id
   * @param {string} data.title
   * @param {number} data.version
   * @param {string} data.createdAt
   * @param {string} data.updatedAt
   * @param {Author} data.author
   * @param {Permissions} data.permissions
   * @param {DocumentMetadataData} data.metadata
   */
  constructor(data) {
    this.id = data.id;
    this.title = data.title || '';
    this.version = data.version || 1;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.author = data.author || { id: '', name: '' };
    this.permissions = data.permissions || { owner: '', editors: [], commenters: [], readers: [] };
    this.metadata = data.metadata || { tags: [], category: '' };
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      version: this.version,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      author: this.author,
      permissions: this.permissions,
      metadata: this.metadata
    };
  }
}

