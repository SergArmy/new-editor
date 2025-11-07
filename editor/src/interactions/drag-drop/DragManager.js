import { DragPreview } from './DragPreview.js';
import { DropZone } from './DropZone.js';

export class DragManager {
  constructor() {
    this.dragPreview = new DragPreview();
    this.dropZones = new Map();
    this.draggedElement = null;
    this.dragData = null;
  }

  /**
   * @param {HTMLElement} element
   * @param {Object} data
   * @param {Function} onDragStart
   */
  registerDraggable(element, data, onDragStart) {
    element.setAttribute('draggable', 'true');
    element.addEventListener('dragstart', (e) => {
      this.draggedElement = element;
      this.dragData = data;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('application/json', JSON.stringify(data));
      const preview = this.dragPreview.create(element, e.clientX, e.clientY);
      if (onDragStart) onDragStart(data);
    });
    element.addEventListener('dragend', () => {
      this.dragPreview.remove();
      this.draggedElement = null;
      this.dragData = null;
    });
  }

  /**
   * @param {HTMLElement} element
   * @param {Function} onDrop
   */
  registerDropZone(element, onDrop) {
    const dropZone = new DropZone(element, onDrop);
    this.dropZones.set(element, dropZone);
    element.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      dropZone.activate();
    });
    element.addEventListener('dragleave', () => {
      dropZone.deactivate();
    });
    element.addEventListener('drop', (e) => {
      e.preventDefault();
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      dropZone.handleDrop(data);
      dropZone.deactivate();
    });
  }
}

