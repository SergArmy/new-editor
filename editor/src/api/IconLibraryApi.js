/**
 * API для работы с библиотекой иконок редактора.
 */
export class IconLibraryApi {
  /**
   * @param {import('./ApiClient.js').ApiClient|import('./ApiMock.js').ApiMock} client
   */
  constructor(client) {
    this.client = client;
  }

  /**
   * Загружает пользовательские иконки из бэкенда.
   * @returns {Promise<Array<{id: string, label: string, value: string}>>}
   */
  async getCustomIcons() {
    const response = await this.client.get('/icons/custom');
    return Array.isArray(response?.icons) ? response.icons : [];
  }

  /**
   * Добавляет пользовательскую иконку.
   * @param {{label: string, value: string}} icon
   * @returns {Promise<{id: string, label: string, value: string}>}
   */
  async addCustomIcon(icon) {
    return this.client.post('/icons/custom', icon);
  }

  /**
   * Загружает дополнительные иконки из бэкенда.
   * @returns {Promise<Array<{id: string, label: string, icons: Array<{label: string, value: string}>}>>}
   */
  async getAdditionalIconGroups() {
    const response = await this.client.get('/icons/additional');
    return Array.isArray(response?.groups) ? response.groups : [];
  }
}


