import { Block } from '../base/Block.js';

/**
 * @typedef {Object} ActionStep
 * @property {string} id
 * @property {string} title
 * @property {string} description
 */

/**
 * Карточка действия: заголовок, ожидаемый результат и список шагов.
 */
export class ActionBlock extends Block {
  /**
   * @param {Object} data
   */
  constructor(data) {
    super(data);

    const source = data.data || data;

    this.title = this.#normalizeString(source.title) || 'Действие';
    this.outcome = this.#normalizeString(source.outcome);

    /** @type {ActionStep[]} */
    const rawSteps = Array.isArray(source.steps) ? source.steps : [];
    this.steps = rawSteps
      .map((step, index) => {
        const title = this.#normalizeString(step?.title);
        const description = this.#normalizeString(step?.description);

        if (!title && !description) {
          return null;
        }

        return {
          id: this.#normalizeString(step?.id) || `${this.id}-step-${index + 1}`,
          title: title || `Шаг ${index + 1}`,
          description
        };
      })
      .filter(Boolean);
  }

  /**
   * @returns {HTMLElement}
   */
  render() {
    const el = super.render();
    el.className = 'block action-block';

    const header = document.createElement('div');
    header.className = 'action-header';

    const titleEl = document.createElement('h3');
    titleEl.className = 'action-title';
    titleEl.textContent = this.title;
    header.appendChild(titleEl);

    if (this.outcome) {
      const outcomeEl = document.createElement('div');
      outcomeEl.className = 'action-outcome';
      outcomeEl.textContent = this.outcome;
      header.appendChild(outcomeEl);
    }

    el.appendChild(header);

    if (this.steps.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'action-empty';
      empty.textContent = 'Шаги ещё не заданы';
      el.appendChild(empty);
      return el;
    }

    const list = document.createElement('ol');
    list.className = 'action-steps';

    this.steps.forEach((step, index) => {
      const item = document.createElement('li');
      item.className = 'action-step';
      item.dataset.stepId = step.id;

      const number = document.createElement('span');
      number.className = 'action-step-number';
      number.textContent = String(index + 1);
      item.appendChild(number);

      const body = document.createElement('div');
      body.className = 'action-step-body';

      const title = document.createElement('div');
      title.className = 'action-step-title';
      title.textContent = step.title;
      body.appendChild(title);

      if (step.description) {
        const description = document.createElement('div');
        description.className = 'action-step-description';
        description.textContent = step.description;
        body.appendChild(description);
      }

      item.appendChild(body);
      list.appendChild(item);
    });

    el.appendChild(list);
    return el;
  }

  /**
   * @returns {Object}
   */
  toJSON() {
    return {
      ...super.toJSON(),
      title: this.title,
      outcome: this.outcome,
      steps: this.steps.map(step => ({
        id: step.id,
        title: step.title,
        description: step.description
      }))
    };
  }

  /**
   * @param {unknown} value
   * @returns {string}
   */
  #normalizeString(value) {
    if (typeof value !== 'string') {
      return '';
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : '';
  }
}


