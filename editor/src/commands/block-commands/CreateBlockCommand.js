import { Command } from '../../core/history/Command.js';

export class CreateBlockCommand extends Command {
  /**
   * @param {Object} blockData
   * @param {Function} onCreate
   * @param {Function} onDelete
   */
  constructor(blockData, onCreate, onDelete) {
    super();
    this.blockData = blockData;
    this.onCreate = onCreate;
    this.onDelete = onDelete;
    this.createdBlockId = null;
  }

  /**
   * @param {Object} stateManager
   */
  execute(stateManager) {
    if (this.onCreate) {
      this.createdBlockId = this.onCreate(this.blockData);
    }
  }

  /**
   * @param {Object} stateManager
   */
  undo(stateManager) {
    if (this.createdBlockId && this.onDelete) {
      this.onDelete(this.createdBlockId);
    }
  }
}

