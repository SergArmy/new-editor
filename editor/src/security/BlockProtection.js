/**
 * BlockProtection - управление защитой блоков от несанкционированного изменения
 * 
 * Проверяет права доступа к блокам на основе их защищенности и прав пользователя
 * 
 * @module security/BlockProtection
 */

import { PermissionError } from './PermissionError.js';

/**
 * Уровни защиты блоков
 * @enum {string}
 */
export const ProtectionLevel = {
  /** Нет защиты - блок может быть изменен любым пользователем с правами редактора */
  NONE: 'none',
  /** Только чтение - блок может быть изменен только владельцем документа */
  READ_ONLY: 'read-only',
  /** Только администратор - блок может быть изменен только администратором */
  ADMIN_ONLY: 'admin-only'
};

/**
 * BlockProtection - класс для проверки защиты блоков
 */
export class BlockProtection {
  /**
   * @param {Object} permissionManager - Экземпляр PermissionManager
   */
  constructor(permissionManager) {
    this.permissionManager = permissionManager;
  }

  /**
   * Проверяет, может ли текущий пользователь редактировать блок
   * 
   * @param {Object} block - Объект блока
   * @param {string} block.id - ID блока
   * @param {boolean} block.protected - Защищен ли блок
   * @param {string} [block.protectionLevel] - Уровень защиты
   * @param {string} [block.ownerId] - ID владельца блока (если отличается от документа)
   * @param {Object} document - Объект документа
   * @param {string} [action='edit'] - Действие для проверки (edit, delete, move)
   * @throws {PermissionError} - Если пользователь не имеет прав
   * @returns {boolean} - true если действие разрешено
   */
  canEditBlock(block, document, action = 'edit') {
    if (!block) {
      throw new PermissionError('Block is required');
    }

    if (!document) {
      throw new PermissionError('Document is required');
    }

    // Если блок не защищен, проверяем базовые права на документ
    if (!block.protected) {
      return this.permissionManager.canEditDocument(document);
    }

    // Получаем уровень защиты
    const protectionLevel = block.protectionLevel || ProtectionLevel.READ_ONLY;

    switch (protectionLevel) {
      case ProtectionLevel.NONE:
        return this.permissionManager.canEditDocument(document);

      case ProtectionLevel.READ_ONLY:
        // Только владелец документа или владелец блока может редактировать
        if (this.permissionManager.isOwner(document)) {
          return true;
        }
        if (block.ownerId && this.permissionManager.isCurrentUser(block.ownerId)) {
          return true;
        }
        throw new PermissionError(
          `Block "${block.id}" is protected and can only be edited by the document owner`,
          'BLOCK_PROTECTED',
          { blockId: block.id, action }
        );

      case ProtectionLevel.ADMIN_ONLY:
        // Только администратор может редактировать
        if (this.permissionManager.isAdmin()) {
          return true;
        }
        throw new PermissionError(
          `Block "${block.id}" requires administrator privileges`,
          'BLOCK_ADMIN_ONLY',
          { blockId: block.id, action }
        );

      default:
        throw new PermissionError(
          `Unknown protection level: ${protectionLevel}`,
          'UNKNOWN_PROTECTION_LEVEL',
          { blockId: block.id, protectionLevel }
        );
    }
  }

  /**
   * Проверяет, может ли текущий пользователь удалить блок
   * 
   * @param {Object} block - Объект блока
   * @param {Object} document - Объект документа
   * @returns {boolean}
   * @throws {PermissionError}
   */
  canDeleteBlock(block, document) {
    return this.canEditBlock(block, document, 'delete');
  }

  /**
   * Проверяет, может ли текущий пользователь переместить блок
   * 
   * @param {Object} block - Объект блока
   * @param {Object} document - Объект документа
   * @returns {boolean}
   * @throws {PermissionError}
   */
  canMoveBlock(block, document) {
    return this.canEditBlock(block, document, 'move');
  }

  /**
   * Проверяет, может ли текущий пользователь дублировать блок
   * 
   * @param {Object} block - Объект блока
   * @param {Object} document - Объект документа
   * @returns {boolean}
   * @throws {PermissionError}
   */
  canDuplicateBlock(block, document) {
    // Дублирование разрешено если есть права на чтение документа
    if (!this.permissionManager.canReadDocument(document)) {
      throw new PermissionError(
        'Cannot duplicate block: no read access to document',
        'NO_READ_ACCESS',
        { blockId: block.id }
      );
    }

    // Для защищенных блоков проверяем права на редактирование
    if (block.protected) {
      return this.canEditBlock(block, document, 'duplicate');
    }

    return true;
  }

  /**
   * Проверяет, защищен ли блок
   * 
   * @param {Object} block - Объект блока
   * @returns {boolean}
   */
  isProtected(block) {
    return block && block.protected === true;
  }

  /**
   * Получает уровень защиты блока
   * 
   * @param {Object} block - Объект блока
   * @returns {string} - Уровень защиты
   */
  getProtectionLevel(block) {
    if (!this.isProtected(block)) {
      return ProtectionLevel.NONE;
    }
    return block.protectionLevel || ProtectionLevel.READ_ONLY;
  }

  /**
   * Устанавливает защиту на блок
   * 
   * @param {Object} block - Объект блока
   * @param {Object} document - Объект документа
   * @param {string} [protectionLevel=ProtectionLevel.READ_ONLY] - Уровень защиты
   * @throws {PermissionError} - Если пользователь не имеет прав на изменение защиты
   */
  setProtection(block, document, protectionLevel = ProtectionLevel.READ_ONLY) {
    // Только владелец документа может устанавливать защиту
    if (!this.permissionManager.isOwner(document)) {
      throw new PermissionError(
        'Only document owner can set block protection',
        'NOT_OWNER',
        { blockId: block.id }
      );
    }

    block.protected = true;
    block.protectionLevel = protectionLevel;
  }

  /**
   * Снимает защиту с блока
   * 
   * @param {Object} block - Объект блока
   * @param {Object} document - Объект документа
   * @throws {PermissionError} - Если пользователь не имеет прав
   */
  removeProtection(block, document) {
    // Только владелец документа может снимать защиту
    if (!this.permissionManager.isOwner(document)) {
      throw new PermissionError(
        'Only document owner can remove block protection',
        'NOT_OWNER',
        { blockId: block.id }
      );
    }

    block.protected = false;
    block.protectionLevel = ProtectionLevel.NONE;
  }

  /**
   * Создает безопасную копию блока для передачи без защищенных данных
   * 
   * @param {Object} block - Объект блока
   * @param {Object} document - Объект документа
   * @returns {Object|null} - Копия блока или null если нет доступа
   */
  createSafeCopy(block, document) {
    // Если пользователь может редактировать, возвращаем полную копию
    try {
      this.canEditBlock(block, document);
      return { ...block };
    } catch (e) {
      // Если нет прав на редактирование, но есть права на чтение
      if (this.permissionManager.canReadDocument(document)) {
        // Возвращаем копию без возможности редактирования
        const copy = { ...block };
        copy.readOnly = true;
        return copy;
      }
      return null;
    }
  }
}

