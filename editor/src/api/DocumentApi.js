import { ApiClient } from './ApiClient.js';

export class DocumentApi {
  /**
   * @param {ApiClient} apiClient
   */
  constructor(apiClient) {
    this.client = apiClient;
  }

  /**
   * @returns {Promise<Array>}
   */
  async list() {
    return this.client.get('/documents');
  }

  /**
   * @param {string} id
   * @returns {Promise<Object>}
   */
  async get(id) {
    return this.client.get(`/documents/${id}`);
  }

  /**
   * @param {Object} document
   * @returns {Promise<Object>}
   */
  async create(document) {
    return this.client.post('/documents', document);
  }

  /**
   * @param {string} id
   * @param {Object} document
   * @returns {Promise<Object>}
   */
  async update(id, document) {
    return this.client.put(`/documents/${id}`, document);
  }

  /**
   * @param {string} id
   * @returns {Promise<void>}
   */
  async delete(id) {
    return this.client.delete(`/documents/${id}`);
  }

  /**
   * @param {string} id
   * @returns {Promise<Array>}
   */
  async getVersions(id) {
    return this.client.get(`/documents/${id}/versions`);
  }

  /**
   * @param {string} id
   * @param {string} versionId
   * @returns {Promise<Object>}
   */
  async getVersion(id, versionId) {
    return this.client.get(`/documents/${id}/versions/${versionId}`);
  }

  /**
   * @param {string} id
   * @param {Object} version
   * @returns {Promise<Object>}
   */
  async createVersion(id, version) {
    return this.client.post(`/documents/${id}/versions`, version);
  }

  /**
   * @param {string} id
   * @param {string} v1
   * @param {string} v2
   * @returns {Promise<Object>}
   */
  async getDiff(id, v1, v2) {
    return this.client.get(`/documents/${id}/diff/${v1}/${v2}`);
  }
}

