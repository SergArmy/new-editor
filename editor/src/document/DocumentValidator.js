export class DocumentValidator {
  /**
   * @param {Object} data
   * @returns {{valid: boolean, errors: string[]}}
   */
  static validate(data) {
    const errors = [];
    if (!data.id || typeof data.id !== 'string') errors.push('Invalid or missing id');
    if (typeof data.title !== 'string') errors.push('Invalid title');
    if (typeof data.version !== 'number' || data.version < 1) errors.push('Invalid version');
    if (!data.content || !Array.isArray(data.content.blocks)) errors.push('Invalid content.blocks');
    if (data.content?.blocks) {
      data.content.blocks.forEach((b, i) => {
        if (!b.id) errors.push(`Block ${i}: missing id`);
        if (!b.type) errors.push(`Block ${i}: missing type`);
        if (typeof b.position !== 'number') errors.push(`Block ${i}: invalid position`);
      });
    }
    return { valid: errors.length === 0, errors };
  }
}

