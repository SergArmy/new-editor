import { Validator } from './Validator.js';

export class SchemaValidator {
  /**
   * @param {Object} schema
   */
  constructor(schema) {
    this.schema = schema;
  }

  /**
   * @param {Object} data
   * @returns {{valid: boolean, errors: string[]}}
   */
  validate(data) {
    const errors = [];
    for (const [key, rules] of Object.entries(this.schema)) {
      const value = data[key];
      const result = Validator.validate(value, Array.isArray(rules) ? rules : [rules]);
      if (!result.valid) {
        errors.push(...result.errors.map(e => `${key}: ${e}`));
      }
    }
    return { valid: errors.length === 0, errors };
  }
}

