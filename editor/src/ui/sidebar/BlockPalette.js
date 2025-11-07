export class BlockPalette {
  /**
   * @param {Array<{type: string, label: string, icon?: string, onClick: Function}>} blocks
   */
  constructor(blocks = []) {
    this.blocks = blocks;
  }

  /**
   * @returns {HTMLElement}
   */
  render() {
    const palette = document.createElement('div');
    palette.className = 'block-palette';
    
    this.blocks.forEach(block => {
      const item = document.createElement('div');
      item.className = 'block-palette-item';
      if (block.icon) {
        const icon = document.createElement('span');
        icon.className = `icon ${block.icon}`;
        item.appendChild(icon);
      }
      const label = document.createElement('span');
      label.textContent = block.label;
      item.appendChild(label);
      item.addEventListener('click', () => block.onClick(block.type));
      palette.appendChild(item);
    });
    
    return palette;
  }
}

