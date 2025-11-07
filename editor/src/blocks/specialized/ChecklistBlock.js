import { Block } from '../base/Block.js';

/**
 * @typedef {Object} ChecklistItem
 * @property {string} id
 * @property {string} text
 * @property {boolean} [checked]
 * @property {string} [description]
 */

/**
 * Блок контрольного списка (Checklist).
 */
export class ChecklistBlock extends Block {
  /**
   * @param {Object} data
   * @param {string} [data.title]
   * @param {ChecklistItem[]} [data.items]
   * @param {boolean} [data.showProgress]
   */
  constructor(data) {
    super(data);

    const source = data.data || data;

    this.title = typeof source.title === 'string' ? source.title : '';
    this.showProgress = source.showProgress !== false;

    /** @type {ChecklistItem[]} */
    const rawItems = Array.isArray(source.items) ? source.items : [];
    this.items = rawItems.map((item, index) => ({
      id: item?.id || `${this.id}-item-${index}`,
      text: typeof item?.text === 'string' ? item.text : '',
      checked: Boolean(item?.checked || item?.completed),
      description: typeof item?.description === 'string' ? item.description : ''
    }));
  }

  /**
   * @returns {HTMLElement}
   */
  render() {
    const el = super.render();
    el.className = 'block checklist-block';

    if (this.title) {
      const titleEl = document.createElement('div');
      titleEl.className = 'checklist-title';
      titleEl.textContent = this.title;
      el.appendChild(titleEl);
    }

    if (this.items.length === 0) {
      const emptyEl = document.createElement('div');
      emptyEl.className = 'checklist-empty';
      emptyEl.textContent = 'Нет элементов';
      el.appendChild(emptyEl);
      return el;
    }

    if (this.showProgress) {
      const progressEl = document.createElement('div');
      progressEl.className = 'checklist-progress';
      const completed = this.items.filter(item => item.checked).length;
      progressEl.textContent = `${completed}/${this.items.length}`;
      el.appendChild(progressEl);
    }

    const listEl = document.createElement('ul');
    listEl.className = 'checklist-items';

    this.items.forEach(item => {
      const itemEl = document.createElement('li');
      itemEl.className = 'checklist-item';
      itemEl.dataset.itemId = item.id;

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.disabled = true;
      checkbox.checked = Boolean(item.checked);

      const contentEl = document.createElement('div');
      contentEl.className = 'checklist-item-content';

      const labelEl = document.createElement('span');
      labelEl.className = 'checklist-item-label';
      labelEl.textContent = item.text;
      contentEl.appendChild(labelEl);

      if (item.description) {
        const descriptionEl = document.createElement('div');
        descriptionEl.className = 'checklist-item-description';
        descriptionEl.textContent = item.description;
        contentEl.appendChild(descriptionEl);
      }

      itemEl.appendChild(checkbox);
      itemEl.appendChild(contentEl);
      listEl.appendChild(itemEl);
    });

    el.appendChild(listEl);
    return el;
  }

  /**
   * @returns {Object}
   */
  toJSON() {
    return {
      ...super.toJSON(),
      title: this.title,
      items: this.items.map(item => ({
        id: item.id,
        text: item.text,
        checked: Boolean(item.checked),
        description: item.description
      })),
      showProgress: this.showProgress
    };
  }
}


