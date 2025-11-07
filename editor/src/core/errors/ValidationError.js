import { EditorError } from './EditorError.js';

export class ValidationError extends EditorError {
  /**
   * @param {string} message
   * @param {string[]} [errors]
   * @param {Object} [details]
   */
  constructor(message, errors = [], details = {}) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

