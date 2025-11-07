export class ApiClient {
  /**
   * @param {string} baseUrl
   * @param {Object} options
   */
  constructor(baseUrl = '/api/v1', options = {}) {
    this.baseUrl = baseUrl;
    this.options = {
      timeout: options.timeout || 30000,
      headers: options.headers || {}
    };
  }

  /**
   * @param {string} endpoint
   * @param {Object} options
   * @returns {Promise<any>}
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.options.headers,
        ...options.headers
      },
      ...options
    };

    if (options.body) {
      config.body = JSON.stringify(options.body);
    }

    const response = await fetch(url, config);
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    return response.json();
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
}

