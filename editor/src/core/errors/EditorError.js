export class EditorError extends Error {
  /**
   * @param {string} message
   * @param {string} [code]
   * @param {Object} [details]
   */
  constructor(message, code = 'EDITOR_ERROR', details = {}) {
    super(message);
    this.name = 'EditorError';
    this.code = code;
    this.details = details;
  }
}

