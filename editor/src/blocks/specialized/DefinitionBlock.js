import { Block } from '../base/Block.js';

/**
 * Простой блок определения термина.
 * Содержит название и текст определения. Остальные блоки могут располагаться рядом или ниже.
 */
export class DefinitionBlock extends Block {
  /**
   * @param {Object} data
   */
  constructor(data) {
    super(data);

    const source = data.data || data;

    this.term = this.#normalizeString(source.term) || 'Определение';
    this.description = this.#normalizeDescription(source.description ?? source.definition ?? source.text);
  }

  /**
   * @returns {HTMLElement}
   */
  render() {
    const el = super.render();
    el.className = 'block definition-block';

    const header = document.createElement('div');
    header.className = 'definition-header';

    const termEl = document.createElement('h3');
    termEl.className = 'definition-term';
    termEl.textContent = this.term;
    header.appendChild(termEl);

    el.appendChild(header);

    const body = document.createElement('div');
    body.className = 'definition-description';

    if (this.description.length === 0) {
      const placeholder = document.createElement('p');
      placeholder.className = 'definition-empty';
      placeholder.textContent = 'Определение пока не заполнено.';
      body.appendChild(placeholder);
    } else {
      this.description.forEach(paragraph => {
        const p = document.createElement('p');
        p.textContent = paragraph;
        body.appendChild(p);
      });
    }

    el.appendChild(body);

    return el;
  }

  /**
   * @returns {Object}
   */
  toJSON() {
    return {
      ...super.toJSON(),
      term: this.term,
      description: [...this.description]
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

  /**
   * @param {unknown} input
   * @returns {string[]}
   */
  #normalizeDescription(input) {
    if (Array.isArray(input)) {
      return input
        .map(item => this.#normalizeString(item))
        .filter(Boolean);
    }

    if (typeof input === 'string') {
      return input
        .split(/\n{2,}/g)
        .map(paragraph => paragraph.trim())
        .filter(Boolean);
    }

    return [];
  }
}



