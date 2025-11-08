export class ApiMock {
  constructor(baseUrl = '/api/v1') {
    this.baseUrl = baseUrl;
    this.storage = new Map();
    this.delay = 100; // Симуляция задержки сети
    this.shouldError = false;
    this.customIcons = [];
    this.additionalIconGroups = [
      {
        id: 'suggested-actions',
        label: 'Дополнительные действия',
        icons: [
          { id: 'icon-clipboard', label: 'Буфер обмена', value: 'fa-light fa-paste' },
          { id: 'icon-edit', label: 'Редактирование', value: 'fa-light fa-pen-to-square' }
        ]
      },
      {
        id: 'suggested-flags',
        label: 'Маркерные значки',
        icons: [
          { id: 'icon-flag', label: 'Флажок', value: 'fa-light fa-flag' },
          { id: 'icon-bookmark', label: 'Закладка', value: 'fa-light fa-bookmark' }
        ]
      }
    ];
  }

  /**
   * @param {number} delay
   */
  setDelay(delay) {
    this.delay = delay;
  }

  /**
   * @param {boolean} shouldError
   */
  setShouldError(shouldError) {
    this.shouldError = shouldError;
  }

  async simulateDelay() {
    return new Promise(resolve => setTimeout(resolve, this.delay));
  }

  async request(endpoint, options = {}) {
    await this.simulateDelay();
    if (this.shouldError) {
      throw new Error('Mock API error');
    }

    const method = options.method || 'GET';
    const key = `${method} ${endpoint}`;

    if (method === 'GET') {
      if (endpoint === '/icons/custom') {
        return { icons: this.customIcons.slice() };
      }
      if (endpoint === '/icons/additional') {
        return { groups: this.additionalIconGroups.slice() };
      }
      if (endpoint.startsWith('/documents/') && endpoint.includes('/versions/')) {
        const [docId, versionId] = this.parseVersionEndpoint(endpoint);
        return this.getVersion(docId, versionId);
      }
      if (endpoint.startsWith('/documents/') && endpoint.endsWith('/versions')) {
        const docId = endpoint.split('/')[2];
        return this.getVersions(docId);
      }
      if (endpoint.startsWith('/documents/')) {
        const id = endpoint.split('/')[2];
        return this.getDocument(id);
      }
      if (endpoint === '/documents') {
        return this.listDocuments();
      }
    }

    if (method === 'POST') {
      if (endpoint === '/icons/custom') {
        return this.addCustomIcon(options.body);
      }
      if (endpoint.includes('/versions')) {
        const docId = endpoint.split('/')[2];
        return this.createVersion(docId, options.body);
      }
      if (endpoint === '/documents') {
        return this.createDocument(options.body);
      }
    }

    if (method === 'PUT') {
      const id = endpoint.split('/')[2];
      return this.updateDocument(id, options.body);
    }

    if (method === 'DELETE') {
      const id = endpoint.split('/')[2];
      return this.deleteDocument(id);
    }

    return null;
  }

  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body });
  }

  put(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PUT', body });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  parseVersionEndpoint(endpoint) {
    const parts = endpoint.split('/');
    return [parts[2], parts[4]];
  }

  listDocuments() {
    return Array.from(this.storage.values());
  }

  getDocument(id) {
    return this.storage.get(id) || null;
  }

  createDocument(doc) {
    const newDoc = {
      ...doc,
      id: doc.id || `doc-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.storage.set(newDoc.id, newDoc);
    return newDoc;
  }

  updateDocument(id, doc) {
    const existing = this.storage.get(id);
    if (!existing) throw new Error('Document not found');
    const updated = { ...existing, ...doc, updatedAt: new Date().toISOString() };
    this.storage.set(id, updated);
    return updated;
  }

  deleteDocument(id) {
    this.storage.delete(id);
    return { success: true };
  }

  getVersions(docId) {
    const doc = this.storage.get(docId);
    return doc?.versions || [];
  }

  getVersion(docId, versionId) {
    const versions = this.getVersions(docId);
    return versions.find(v => v.id === versionId) || null;
  }

  createVersion(docId, version) {
    const doc = this.storage.get(docId);
    if (!doc) throw new Error('Document not found');
    if (!doc.versions) doc.versions = [];
    doc.versions.push(version);
    this.storage.set(docId, doc);
    return version;
  }

  addCustomIcon(icon) {
    const normalized = {
      id: icon?.id || `icon-${Date.now()}`,
      label: icon?.label?.trim() || 'Иконка без названия',
      value: icon?.value?.trim() || ''
    };

    if (!normalized.value) {
      throw new Error('Icon value is required');
    }

    this.customIcons.push(normalized);
    return normalized;
  }
}

