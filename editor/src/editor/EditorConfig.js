export class EditorConfig {
  constructor(options = {}) {
    this.autoSave = options.autoSave !== false;
    this.autoSaveInterval = options.autoSaveInterval || 3000;
    this.enableHistory = options.enableHistory !== false;
    this.historyLimit = options.historyLimit || 1000;
    this.enableVirtualScroll = options.enableVirtualScroll !== false;
    this.virtualScrollThreshold = options.virtualScrollThreshold || 200;
  }
}

