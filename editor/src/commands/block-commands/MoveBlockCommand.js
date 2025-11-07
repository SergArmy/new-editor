import { Command } from '../../core/history/Command.js';

export class MoveBlockCommand extends Command {
  /**
   * @param {string} blockId
   * @param {{position: number, parentId: string|null}} fromState
   * @param {{position: number, parentId: string|null}} toState
   * @param {(blockId: string, targetState: {position: number, parentId: string|null}, previousState: {position: number, parentId: string|null}) => void} onMove
   */
  constructor(blockId, fromState, toState, onMove) {
    super();
    this.blockId = blockId;
    this.fromState = fromState;
    this.toState = toState;
    this.onMove = onMove;
  }

  /**
   * @param {Object} stateManager
   */
  execute(stateManager) {
    if (this.onMove) {
      this.onMove(this.blockId, this.toState, this.fromState);
    }
  }

  /**
   * @param {Object} stateManager
   */
  undo(stateManager) {
    if (this.onMove) {
      this.onMove(this.blockId, this.fromState, this.toState);
    }
  }
}

