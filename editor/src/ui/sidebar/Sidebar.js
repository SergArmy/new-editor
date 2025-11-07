export class Sidebar {
  /**
   * @param {Object} options
   * @param {boolean} [options.collapsed]
   */
  constructor(options = {}) {
    this.collapsed = options.collapsed || false;
    this.content = null;
  }

  /**
   * @param {HTMLElement} content
   */
  setContent(content) {
    this.content = content;
  }

  /**
   * @returns {HTMLElement}
   */
  render() {
    const sidebar = document.createElement('div');
    sidebar.className = `sidebar ${this.collapsed ? 'collapsed' : ''}`;
    
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'sidebar-toggle';
    toggleBtn.textContent = this.collapsed ? '>' : '<';
    toggleBtn.addEventListener('click', () => {
      this.collapsed = !this.collapsed;
      sidebar.classList.toggle('collapsed');
      toggleBtn.textContent = this.collapsed ? '>' : '<';
    });
    sidebar.appendChild(toggleBtn);
    
    if (this.content) {
      sidebar.appendChild(this.content);
    }
    
    return sidebar;
  }
}

