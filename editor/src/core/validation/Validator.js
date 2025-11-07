export class Validator {
  /**
   * @param {any} value
   * @param {Function[]} rules
   * @returns {{valid: boolean, errors: string[]}}
   */
  static validate(value, rules = []) {
    const errors = [];
    for (const rule of rules) {
      try {
        const result = rule(value);
        if (result !== true && typeof result === 'string') {
          errors.push(result);
        }
      } catch (e) {
        errors.push(e.message || 'Validation failed');
      }
    }
    return { valid: errors.length === 0, errors };
  }

  /**
   * @param {any} value
   * @returns {boolean|string}
   */
  static required(value) {
    return (value !== null && value !== undefined && value !== '') ? true : 'Field is required';
  }

  /**
   * @param {number} min
   * @param {number} max
   * @returns {Function}
   */
  static length(min, max) {
    return (value) => {
      const len = String(value || '').length;
      return len >= min && len <= max ? true : `Length must be between ${min} and ${max}`;
    };
  }
}

