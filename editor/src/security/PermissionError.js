/**
 * PermissionError - ошибка прав доступа
 * 
 * Выбрасывается когда пользователь пытается выполнить действие,
 * для которого у него нет прав
 * 
 * @module security/PermissionError
 */

import { EditorError } from '../core/errors/EditorError.js';

/**
 * PermissionError - класс ошибки прав доступа
 */
export class PermissionError extends EditorError {
  /**
   * @param {string} message - Сообщение об ошибке
   * @param {string} [code='PERMISSION_DENIED'] - Код ошибки
   * @param {Object} [details={}] - Дополнительные детали
   */
  constructor(message, code = 'PERMISSION_DENIED', details = {}) {
    super(message, code, details);
    this.name = 'PermissionError';
  }
}

