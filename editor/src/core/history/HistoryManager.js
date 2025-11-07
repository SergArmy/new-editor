import { CommandStack } from './CommandStack.js';

export class HistoryManager {
  constructor(stateManager, options = {}) {
    this.stateManager = stateManager;
    this.stack = new CommandStack(options.limit || 1000);
  }

  execute(command) {
    command.execute(this.stateManager);
    this.stack.push(command);
  }

  undo() {
    if (!this.stack.canUndo()) return false;
    const cmd = this.stack.popUndo();
    cmd.undo(this.stateManager);
    this.stack.pushRedo(cmd);
    return true;
  }

  redo() {
    if (!this.stack.canRedo()) return false;
    const cmd = this.stack.popRedo();
    cmd.execute(this.stateManager);
    this.stack.push(cmd);
    return true;
  }
}


