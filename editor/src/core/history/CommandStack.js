export class CommandStack {
  constructor(limit = 1000) {
    this._undo = [];
    this._redo = [];
    this._limit = limit;
  }

  push(cmd) {
    this._undo.push(cmd);
    if (this._undo.length > this._limit) this._undo.shift();
    this._redo.length = 0;
  }

  canUndo() { return this._undo.length > 0; }
  canRedo() { return this._redo.length > 0; }

  popUndo() { return this._undo.pop(); }
  pushRedo(cmd) { this._redo.push(cmd); }
  popRedo() { return this._redo.pop(); }
}


