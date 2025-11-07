export class Command {
  // Interface: subclasses implement execute(stateManager) -> void and undo(stateManager) -> void
  execute(stateManager) { throw new Error('Not implemented'); }
  undo(stateManager) { throw new Error('Not implemented'); }
}

export class UpdateStateCommand extends Command {
  constructor(updater, description = 'update') {
    super();
    this.updater = updater;
    this.description = description;
    this._before = null;
    this._after = null;
  }
  execute(stateManager) {
    this._before = stateManager.state;
    stateManager.setState(this.updater);
    this._after = stateManager.state;
  }
  undo(stateManager) {
    if (this._before) stateManager.replaceState(this._before);
  }
}


