import { Command } from '../../core/history/Command.js';
import { CreateBlockCommand } from './CreateBlockCommand.js';

export class DuplicateBlockCommand extends Command {
  /**
   * @param {string} blockId
   * @param {Function} getBlock
   * @param {Function} onCreate
   */
  constructor(blockId, getBlock, onCreate) {
    super();
    this.blockId = blockId;
    this.getBlock = getBlock;
    this.onCreate = onCreate;
    this.createCommand = null;
  }

  /**
   * @param {Object} stateManager
   */
  execute(stateManager) {
    if (this.getBlock && this.onCreate) {
      const originalBlock = this.getBlock(this.blockId);
      if (originalBlock) {
        const duplicateData = {
          ...originalBlock,
          id: `${originalBlock.id}-copy-${Date.now()}`,
          position: originalBlock.position + 1
        };
        this.createCommand = new CreateBlockCommand(duplicateData, this.onCreate, null);
        this.createCommand.execute(stateManager);
      }
    }
  }

  /**
   * @param {Object} stateManager
   */
  undo(stateManager) {
    if (this.createCommand) {
      this.createCommand.undo(stateManager);
    }
  }
}

