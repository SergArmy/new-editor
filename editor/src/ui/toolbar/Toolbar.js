import { ToolbarGroup } from './ToolbarGroup.js';

export class Toolbar {
  constructor() {
    this.groups = [];
  }

  /**
   * @param {ToolbarGroup} group
   */
  addGroup(group) {
    this.groups.push(group);
  }

  /**
   * @returns {HTMLElement}
   */
  render() {
    const toolbar = document.createElement('div');
    toolbar.className = 'toolbar';
    this.groups.forEach(group => {
      toolbar.appendChild(group.render());
    });
    return toolbar;
  }
}

