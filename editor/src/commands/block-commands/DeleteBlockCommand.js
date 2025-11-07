import { Command } from '../../core/history/Command.js';

export class DeleteBlockCommand extends Command {
  /**
   * @param {string} blockId
   * @param {Function} onDelete
   * @param {Function} onRestore
   */
  constructor(blockId, onDelete, onRestore) {
    super();
    this.blockId = blockId;
    this.onDelete = onDelete;
    this.onRestore = onRestore;
    this.deletedBlock = null;
  }

  /**
   * @param {Object} stateManager
   */
  execute(stateManager) {
    if (this.onDelete) {
      this.deletedBlock = this.onDelete(this.blockId);
    }
  }

  /**
   * @param {Object} stateManager
   */
  undo(stateManager) {
    if (this.deletedBlock && this.onRestore) {
      this.onRestore(this.deletedBlock);
    }
  }
}

