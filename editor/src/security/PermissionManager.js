/**
 * PermissionManager - управление правами доступа к документам и блокам
 * 
 * Реализует систему прав доступа с уровнями:
 * - Owner: полный контроль
 * - Editor: чтение и редактирование
 * - Commenter: чтение и комментирование
 * - Reader: только чтение
 * 
 * @module security/PermissionManager
 */

import { PermissionError } from './PermissionError.js';

/**
 * Уровни доступа
 * @enum {string}
 */
export const AccessLevel = {
  /** Владелец - полный контроль, включая удаление */
  OWNER: 'owner',
  /** Редактор - чтение и редактирование */
  EDITOR: 'editor',
  /** Комментатор - чтение и комментирование */
  COMMENTER: 'commenter',
  /** Читатель - только чтение */
  READER: 'reader',
  /** Нет доступа */
  NONE: 'none'
};

/**
 * PermissionManager - класс для управления правами доступа
 */
export class PermissionManager {
  /**
   * @param {Object} [options={}] - Опции
   * @param {Function} [options.getCurrentUser] - Функция получения текущего пользователя
   * @param {Function} [options.isAdmin] - Функция проверки администратора
   */
  constructor(options = {}) {
    this.getCurrentUser = options.getCurrentUser || (() => ({ id: '', name: '' }));
    this.isAdminFn = options.isAdmin || (() => false);
  }

  /**
   * Получает текущего пользователя
   * 
   * @returns {Object} - Объект пользователя {id, name}
   */
  getCurrentUserId() {
    const user = this.getCurrentUser();
    return user?.id || '';
  }

  /**
   * Проверяет, является ли пользователь администратором
   * 
   * @returns {boolean}
   */
  isAdmin() {
    return this.isAdminFn();
  }

  /**
   * Проверяет, является ли текущий пользователь указанным пользователем
   * 
   * @param {string} userId - ID пользователя
   * @returns {boolean}
   */
  isCurrentUser(userId) {
    return this.getCurrentUserId() === userId;
  }

  /**
   * Получает уровень доступа пользователя к документу
   * 
   * @param {Object} document - Объект документа
   * @param {Object} document.permissions - Права доступа
   * @param {string} [document.ownerId] - ID владельца документа
   * @param {string} [userId] - ID пользователя (если не указан, используется текущий)
   * @returns {string} - Уровень доступа (AccessLevel)
   */
  getAccessLevel(document, userId = null) {
    if (!document || !document.permissions) {
      return AccessLevel.NONE;
    }

    const targetUserId = userId || this.getCurrentUserId();
    const { permissions } = document;
    const ownerId = document.ownerId || document.author?.id || permissions.owner;

    // Владелец документа
    if (ownerId && targetUserId === ownerId) {
      return AccessLevel.OWNER;
    }

    // Администратор имеет права редактора
    if (this.isAdmin() && targetUserId === this.getCurrentUserId()) {
      return AccessLevel.EDITOR;
    }

    // Проверяем списки прав
    if (permissions.editors && permissions.editors.includes(targetUserId)) {
      return AccessLevel.EDITOR;
    }

    if (permissions.commenters && permissions.commenters.includes(targetUserId)) {
      return AccessLevel.COMMENTER;
    }

    if (permissions.readers && permissions.readers.includes(targetUserId)) {
      return AccessLevel.READER;
    }

    // По умолчанию - нет доступа
    return AccessLevel.NONE;
  }

  /**
   * Проверяет, является ли текущий пользователь владельцем документа
   * 
   * @param {Object} document - Объект документа
   * @param {string} [documentId] - ID документа (альтернативный способ)
   * @returns {boolean}
   */
  isOwner(document, documentId = null) {
    if (!document && !documentId) {
      return false;
    }

    // Если передан только ID, нужно получить документ (в реальной реализации)
    // Для упрощения используем переданный документ
    if (!document) {
      return false;
    }

    const accessLevel = this.getAccessLevel(document);
    return accessLevel === AccessLevel.OWNER;
  }

  /**
   * Проверяет, может ли пользователь читать документ
   * 
   * @param {Object} document - Объект документа
   * @param {string} [documentId] - ID документа
   * @returns {boolean}
   * @throws {PermissionError} - Если нет прав на чтение
   */
  canReadDocument(document, documentId = null) {
    const accessLevel = this.getAccessLevel(document);
    
    if (accessLevel === AccessLevel.NONE) {
      throw new PermissionError(
        'No read access to document',
        'NO_READ_ACCESS',
        { documentId: document?.id || documentId }
      );
    }

    return true;
  }

  /**
   * Проверяет, может ли пользователь редактировать документ
   * 
   * @param {Object} document - Объект документа
   * @param {string} [documentId] - ID документа
   * @returns {boolean}
   * @throws {PermissionError} - Если нет прав на редактирование
   */
  canEditDocument(document, documentId = null) {
    const accessLevel = this.getAccessLevel(document);
    
    if (accessLevel !== AccessLevel.OWNER && accessLevel !== AccessLevel.EDITOR) {
      throw new PermissionError(
        'No edit access to document',
        'NO_EDIT_ACCESS',
        { documentId: document?.id || documentId, accessLevel }
      );
    }

    return true;
  }

  /**
   * Проверяет, может ли пользователь удалять документ
   * 
   * @param {Object} document - Объект документа
   * @param {string} [documentId] - ID документа
   * @returns {boolean}
   * @throws {PermissionError} - Если нет прав на удаление
   */
  canDeleteDocument(document, documentId = null) {
    const accessLevel = this.getAccessLevel(document);
    
    if (accessLevel !== AccessLevel.OWNER) {
      throw new PermissionError(
        'Only document owner can delete document',
        'NO_DELETE_ACCESS',
        { documentId: document?.id || documentId }
      );
    }

    return true;
  }

  /**
   * Проверяет, может ли пользователь комментировать документ
   * 
   * @param {Object} document - Объект документа
   * @param {string} [documentId] - ID документа
   * @returns {boolean}
   * @throws {PermissionError} - Если нет прав на комментирование
   */
  canCommentDocument(document, documentId = null) {
    const accessLevel = this.getAccessLevel(document);
    
    // Комментировать могут: владелец, редактор, комментатор
    if (accessLevel === AccessLevel.NONE || accessLevel === AccessLevel.READER) {
      throw new PermissionError(
        'No comment access to document',
        'NO_COMMENT_ACCESS',
        { documentId: document?.id || documentId }
      );
    }

    return true;
  }

  /**
   * Проверяет, может ли пользователь управлять правами доступа
   * 
   * @param {Object} document - Объект документа
   * @param {string} [documentId] - ID документа
   * @returns {boolean}
   * @throws {PermissionError} - Если нет прав на управление правами
   */
  canManagePermissions(document, documentId = null) {
    const accessLevel = this.getAccessLevel(document);
    
    if (accessLevel !== AccessLevel.OWNER) {
      throw new PermissionError(
        'Only document owner can manage permissions',
        'NO_PERMISSION_MANAGE_ACCESS',
        { documentId: document?.id || documentId }
      );
    }

    return true;
  }

  /**
   * Устанавливает права доступа для пользователя
   * 
   * @param {Object} document - Объект документа
   * @param {string} userId - ID пользователя
   * @param {string} accessLevel - Уровень доступа
   * @throws {PermissionError} - Если нет прав на управление правами
   */
  setUserAccess(document, userId, accessLevel) {
    this.canManagePermissions(document);

    if (!document.permissions) {
      document.permissions = {
        owner: '',
        editors: [],
        commenters: [],
        readers: []
      };
    }

    const { permissions } = document;

    // Удаляем пользователя из всех списков
    permissions.editors = permissions.editors.filter(id => id !== userId);
    permissions.commenters = permissions.commenters.filter(id => id !== userId);
    permissions.readers = permissions.readers.filter(id => id !== userId);

    // Добавляем в соответствующий список
    switch (accessLevel) {
      case AccessLevel.EDITOR:
        if (!permissions.editors.includes(userId)) {
          permissions.editors.push(userId);
        }
        break;
      case AccessLevel.COMMENTER:
        if (!permissions.commenters.includes(userId)) {
          permissions.commenters.push(userId);
        }
        break;
      case AccessLevel.READER:
        if (!permissions.readers.includes(userId)) {
          permissions.readers.push(userId);
        }
        break;
      case AccessLevel.NONE:
        // Уже удален из всех списков
        break;
      default:
        throw new PermissionError(
          `Unknown access level: ${accessLevel}`,
          'UNKNOWN_ACCESS_LEVEL',
          { userId, accessLevel }
        );
    }
  }

  /**
   * Удаляет права доступа пользователя
   * 
   * @param {Object} document - Объект документа
   * @param {string} userId - ID пользователя
   * @throws {PermissionError} - Если нет прав на управление правами
   */
  removeUserAccess(document, userId) {
    this.setUserAccess(document, userId, AccessLevel.NONE);
  }
}

