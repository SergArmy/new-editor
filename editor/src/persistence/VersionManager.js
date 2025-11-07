export class VersionManager {
  /**
   * @param {Function} apiClient
   */
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.versions = [];
  }

  /**
   * @param {string} documentId
   * @param {Object} snapshot
   * @param {string} [comment]
   * @returns {Promise<Object>}
   */
  async createVersion(documentId, snapshot, comment = '') {
    const version = {
      id: `v${Date.now()}`,
      documentId,
      timestamp: new Date().toISOString(),
      snapshot,
      comment,
      hash: this.hashSnapshot(snapshot)
    };
    // Если apiClient имеет метод createVersion, используем его
    if (typeof this.apiClient.createVersion === 'function') {
      const saved = await this.apiClient.createVersion(documentId, version);
      this.versions.push(saved);
      return saved;
    } else {
      // Иначе используем request/post напрямую
      const saved = await this.apiClient.post(`/documents/${documentId}/versions`, version);
      this.versions.push(saved);
      return saved;
    }
  }

  /**
   * @param {string} documentId
   * @returns {Promise<Array>}
   */
  async getVersions(documentId) {
    let versions;
    if (typeof this.apiClient.getVersions === 'function') {
      versions = await this.apiClient.getVersions(documentId);
    } else {
      versions = await this.apiClient.get(`/documents/${documentId}/versions`);
    }
    this.versions = versions;
    return versions;
  }

  /**
   * @param {string} documentId
   * @param {string} versionId
   * @returns {Promise<Object>}
   */
  async getVersion(documentId, versionId) {
    if (typeof this.apiClient.getVersion === 'function') {
      return this.apiClient.getVersion(documentId, versionId);
    } else {
      return this.apiClient.get(`/documents/${documentId}/versions/${versionId}`);
    }
  }

  /**
   * @param {Object} snapshot
   * @returns {string}
   */
  hashSnapshot(snapshot) {
    // Упрощенный хеш - в реальности можно использовать crypto.subtle
    return JSON.stringify(snapshot).split('').reduce((hash, char) => {
      const charCode = char.charCodeAt(0);
      hash = ((hash << 5) - hash) + charCode;
      return hash & hash;
    }, 0).toString(16);
  }
}

