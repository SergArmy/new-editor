import { SelectionManager } from './SelectionManager.js';
import { FocusManager } from './FocusManager.js';

export class EditorController {
  /**
   * @param {Object} dependencies
   * @param {Object} dependencies.stateManager
   * @param {Object} dependencies.historyManager
   * @param {Object} dependencies.eventBus
   */
  constructor(dependencies) {
    this.stateManager = dependencies.stateManager;
    this.historyManager = dependencies.historyManager;
    this.eventBus = dependencies.eventBus;
    this.selection = new SelectionManager();
    this.focus = new FocusManager();
  }

  /**
   * @param {string} blockId
   */
  selectBlock(blockId) {
    this.selection.select(blockId);
    this.eventBus.emit('block:selected', { blockId });
  }

  /**
   * @param {string} blockId
   */
  focusBlock(blockId) {
    this.focus.focus(blockId);
    this.eventBus.emit('block:focused', { blockId });
  }
}

