import { Block } from '../base/Block.js';
import { ContextMenu } from '../../ui/components/ContextMenu.js';
import { openColorPalette } from '../../ui/components/ColorPaletteMenu.js';
import { getRolesRegistry } from '../../registry/RolesRegistry.js';

const DEFAULT_COLORS = [
  '#2563EB',
  '#7C3AED',
  '#F97316',
  '#059669',
  '#DB2777',
  '#0EA5E9',
  '#D97706'
];

/**
 * @typedef {Object} RoleEntry
 * @property {string} id
 * @property {string} title
 * @property {string|null} contact
 * @property {string[]} responsibilities
 * @property {string} color
 */

/**
 * Блок описания ролей команды.
 */
export class RolesBlock extends Block {
  /**
   * @param {Object} data
   */
  constructor(data) {
    super(data);

    const source = data.data || data;

    this.editorDeps = data.editorDeps || null;

    this.title = this.#normalizeString(source.title) || 'Роли команды';
    this.description = this.#normalizeDescription(source.description ?? source.summary);

    /** @type {RoleEntry[]} */
    this.roles = [];
    /** @type {Set<string>} */
    this._colorUsed = new Set();
    this._palette = DEFAULT_COLORS;

    const rawRoles = Array.isArray(source.roles) ? source.roles : [];

    rawRoles.forEach((role, index) => {
      const title = this.#normalizeString(role?.title ?? role?.name);
      const contact = this.#normalizeString(role?.contact ?? role?.owner);
      const responsibilities = this.#normalizeResponsibilities(role?.responsibilities ?? role?.notes ?? role?.description);

      if (!title && responsibilities.length === 0 && !contact) {
        return;
      }

      const id = this.#normalizeString(role?.id) || `${this.id}-role-${index + 1}`;
      const baseColor = this.#normalizeString(role?.color);
      const color = baseColor || this.#pickUniqueColor(index);
      this._colorUsed.add(color);

      this.roles.push({
        id,
        title: title || `Роль ${index + 1}`,
        contact: contact || null,
        responsibilities,
        color
      });
    });
  }

  /**
   * @returns {HTMLElement}
   */
  render() {
    const el = super.render();
    el.className = 'block roles-block';

    const header = document.createElement('div');
    header.className = 'roles-header';

    const titleEl = document.createElement('h3');
    titleEl.className = 'roles-title';
    titleEl.textContent = this.title;
    header.appendChild(titleEl);

    if (this.description.length > 0) {
      const descriptionEl = document.createElement('div');
      descriptionEl.className = 'roles-description';
      this.description.forEach(paragraph => {
        const p = document.createElement('p');
        p.textContent = paragraph;
        descriptionEl.appendChild(p);
      });
      header.appendChild(descriptionEl);
    }

    el.appendChild(header);

    if (this.roles.length === 0) {
      const emptyEl = document.createElement('div');
      emptyEl.className = 'roles-empty';
      emptyEl.textContent = 'Роли пока не определены';
      el.appendChild(emptyEl);
      return el;
    }

    const listEl = document.createElement('ul');
    listEl.className = 'roles-list';

    this.roles.forEach((role) => {
      const itemEl = document.createElement('li');
      itemEl.className = 'roles-item';
      itemEl.dataset.roleId = role.id;

      const headerLine = document.createElement('div');
      headerLine.className = 'roles-item-header';

      const badge = document.createElement('span');
      badge.className = 'roles-item-badge';
      badge.textContent = role.title;
      badge.style.backgroundColor = role.color;
      badge.dataset.roleColor = role.color;
      headerLine.appendChild(badge);

      if (role.contact) {
        const contactEl = document.createElement('span');
        contactEl.className = 'roles-item-contact';
        contactEl.textContent = role.contact;
        headerLine.appendChild(contactEl);
      }

      itemEl.appendChild(headerLine);

      if (role.responsibilities.length > 0) {
        const responsibilitiesEl = document.createElement('ul');
        responsibilitiesEl.className = 'roles-item-responsibilities';

        role.responsibilities.forEach(text => {
          const responsibilityItem = document.createElement('li');
          responsibilityItem.textContent = text;
          responsibilitiesEl.appendChild(responsibilityItem);
        });

        itemEl.appendChild(responsibilitiesEl);
      }

      this.#attachContextMenu(badge, role);
      listEl.appendChild(itemEl);
    });

    el.appendChild(listEl);
    this.#notifyRegistry();

    return el;
  }

  /**
   * @returns {Object}
   */
  toJSON() {
    return {
      ...super.toJSON(),
      title: this.title,
      description: [...this.description],
      roles: this.roles.map(role => ({
        id: role.id,
        title: role.title,
        contact: role.contact,
        responsibilities: [...role.responsibilities],
        color: role.color
      }))
    };
  }

  /**
   * @private
   * @param {HTMLElement} badge
   * @param {RoleEntry} role
   */
  #attachContextMenu(badge, role) {
    badge.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      const menu = new ContextMenu([
        {
          label: 'Сменить цвет',
          onClick: () => {
            this.#openColorPalette(role, badge, event);
          }
        }
      ]);
      menu.show(event.clientX, event.clientY);
    });
  }

  /**
   * @private
   * @param {RoleEntry} role
   * @param {HTMLElement} badge
   * @param {MouseEvent} triggerEvent
   */
  #openColorPalette(role, badge, triggerEvent) {
    openColorPalette({
      anchor: badge,
      triggerEvent,
      currentColor: role.color,
      colors: this._palette,
      onSelect: (color) => {
        if (!color || color === role.color) {
          return;
        }

        role.color = color;
        badge.style.backgroundColor = color;
        badge.dataset.roleColor = color;

        const registry = getRolesRegistry();
        registry.setColor(role.id, color);
      }
    });
  }

  /**
   * @private
   */
  #notifyRegistry() {
    const registry = getRolesRegistry();
    this.roles.forEach(role => {
      registry.add(role.id, {
        title: role.title,
        color: role.color
      });
    });
  }

  /**
   * @private
   */
  #pickUniqueColor(index) {
    const palette = this._palette;
    const size = palette.length;
    const offset = index % size;

    for (let i = 0; i < size; i += 1) {
      const color = palette[(offset + i) % size];
      if (!this._colorUsed.has(color)) {
        return color;
      }
    }

    const fallback = palette[offset];
    return fallback || '#1F2937';
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

  /**
   * @param {unknown} input
   * @returns {string[]}
   */
  #normalizeResponsibilities(input) {
    if (Array.isArray(input)) {
      return input
        .map(item => (typeof item === 'string' ? item.trim() : ''))
        .filter(Boolean);
    }

    if (typeof input === 'string') {
      return input
        .split(/\n+/g)
        .map(line => line.trim())
        .filter(Boolean);
    }

    return [];
  }
}

