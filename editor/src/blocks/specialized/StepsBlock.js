import { Block } from '../base/Block.js';

/**
 * @typedef {Object} StepItem
 * @property {string} id
 * @property {string} title
 * @property {string} [description]
 * @property {('pending'|'active'|'done')} [status]
 */

const STATUS_LABELS = {
  done: 'Готово',
  active: 'В работе'
};

/**
 * Блок пошаговой инструкции (Steps).
 */
export class StepsBlock extends Block {
  /**
   * @param {Object} data
   * @param {string} [data.title]
   * @param {StepItem[]} [data.steps]
   */
  constructor(data) {
    super(data);

    const source = data.data || data;

    this.title = typeof source.title === 'string' ? source.title : '';

    /** @type {StepItem[]} */
    const rawSteps = Array.isArray(source.steps) ? source.steps : [];
    this.steps = rawSteps.map((step, index) => ({
      id: step?.id || `${this.id}-step-${index + 1}`,
      title: typeof step?.title === 'string' && step.title.trim()
        ? step.title
        : `Шаг ${index + 1}`,
      description: typeof step?.description === 'string' ? step.description : '',
      status: step?.status === 'done' || step?.status === 'active' ? step.status : 'pending'
    }));
  }

  /**
   * @returns {HTMLElement}
   */
  render() {
    const el = super.render();
    el.className = 'block steps-block';

    if (this.title) {
      const titleEl = document.createElement('div');
      titleEl.className = 'steps-title';
      titleEl.textContent = this.title;
      el.appendChild(titleEl);
    }

    if (this.steps.length === 0) {
      const emptyEl = document.createElement('div');
      emptyEl.className = 'steps-empty';
      emptyEl.textContent = 'Нет шагов';
      el.appendChild(emptyEl);
      return el;
    }

    const listEl = document.createElement('ol');
    listEl.className = 'steps-list';

    this.steps.forEach((step, index) => {
      const itemEl = document.createElement('li');
      itemEl.className = 'step-item';
      itemEl.dataset.stepId = step.id;
      if (step.status && step.status !== 'pending') {
        itemEl.dataset.status = step.status;
      }

      const numberEl = document.createElement('span');
      numberEl.className = 'step-number';
      numberEl.textContent = String(index + 1);

      const contentEl = document.createElement('div');
      contentEl.className = 'step-content';

      const titleEl = document.createElement('div');
      titleEl.className = 'step-title';
      titleEl.textContent = step.title;
      contentEl.appendChild(titleEl);

      if (step.status && step.status !== 'pending') {
        const statusEl = document.createElement('span');
        statusEl.className = 'step-status';
        statusEl.textContent = STATUS_LABELS[step.status] || '';
        contentEl.appendChild(statusEl);
      }

      if (step.description) {
        const descriptionEl = document.createElement('div');
        descriptionEl.className = 'step-description';
        descriptionEl.textContent = step.description;
        contentEl.appendChild(descriptionEl);
      }

      itemEl.appendChild(numberEl);
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
      steps: this.steps.map(step => ({
        id: step.id,
        title: step.title,
        description: step.description,
        status: step.status
      }))
    };
  }
}


