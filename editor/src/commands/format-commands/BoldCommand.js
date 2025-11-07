import { Command } from '../../core/history/Command.js';

export class BoldCommand extends Command {
  /**
   * @param {string} blockId
   * @param {number} start
   * @param {number} end
   * @param {Function} onFormat
   */
  constructor(blockId, start, end, onFormat) {
    super();
    this.blockId = blockId;
    this.start = start;
    this.end = end;
    this.onFormat = onFormat;
    this.originalFormat = null;
  }

  /**
   * @param {Object} stateManager
   */
  execute(stateManager) {
    if (this.onFormat) {
      this.originalFormat = this.onFormat(this.blockId, this.start, this.end, { bold: true });
    }
  }

  /**
   * @param {Object} stateManager
   */
  undo(stateManager) {
    if (this.originalFormat && this.onFormat) {
      this.onFormat(this.blockId, this.start, this.end, this.originalFormat);
    }
  }
}

