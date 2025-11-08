export class RolesRegistry {
  constructor() {
    /** @type {Map<string, { title: string, color: string }>} */
    this._roles = new Map();
  }

  /**
   * @param {string} id
   * @param {{ title: string, color: string }} data
   */
  add(id, data) {
    if (!id) {
      return;
    }
    const current = this._roles.get(id) || {};
    this._roles.set(id, {
      title: data.title ?? current.title ?? '',
      color: data.color ?? current.color ?? ''
    });
  }

  /**
   * @param {string} id
   * @param {string} color
   */
  setColor(id, color) {
    if (!id) {
      return;
    }
    const current = this._roles.get(id) || { title: '', color: '' };
    this._roles.set(id, {
      title: current.title,
      color: color || current.color || ''
    });
  }

  /**
   * @returns {Array<{ id: string, title: string, color: string }>}
   */
  getAll() {
    return Array.from(this._roles.entries()).map(([id, value]) => ({
      id,
      title: value.title,
      color: value.color
    }));
  }

  clear() {
    this._roles.clear();
  }
}

const instance = new RolesRegistry();

export function getRolesRegistry() {
  return instance;
}
