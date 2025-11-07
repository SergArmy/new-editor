import { EditorError } from './EditorError.js';

export class StateError extends EditorError {
  /**
   * @param {string} message
   * @param {Object} [state]
   * @param {Object} [details]
   */
  constructor(message, state = null, details = {}) {
    super(message, 'STATE_ERROR', details);
    this.name = 'StateError';
    this.state = state;
  }
}

