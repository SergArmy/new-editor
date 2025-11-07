import { BlockFactory } from './BlockFactory.js';

export class BlockRenderer {
  /**
   * @param {BlockFactory} factory
   * @param {Object} [editorDeps] - зависимости редактора (slashCommands, markdownShortcuts, eventBus)
   */
  constructor(factory, editorDeps = null) {
    this.factory = factory;
    this.editorDeps = editorDeps;
  }

  /**
   * Устанавливает зависимости редактора
   * @param {Object} editorDeps
   */
  setEditorDeps(editorDeps) {
    this.editorDeps = editorDeps;
  }

  /**
   * @param {Object} blockData
   * @returns {HTMLElement}
   */
  render(blockData) {
    // Добавляем editorDeps в данные блока, если они есть
    const dataWithDeps = this.editorDeps 
      ? { ...blockData, editorDeps: this.editorDeps }
      : blockData;
    
    const block = this.factory.create(dataWithDeps);
    return block.render();
  }

  /**
   * @param {Object[]} blocks
   * @param {HTMLElement} container
   */
  renderAll(blocks, container) {
    container.innerHTML = '';
    blocks.forEach(b => {
      const el = this.render(b);
      container.appendChild(el);
    });
  }
}

