export class TextStyler {
  /**
   * @param {string} text
   * @param {Object} style
   * @returns {string}
   */
  static apply(text, style = {}) {
    const parts = [];
    if (style.color) parts.push(`color: ${style.color}`);
    if (style.backgroundColor) parts.push(`background-color: ${style.backgroundColor}`);
    if (parts.length === 0) return text;
    return `<span style="${parts.join('; ')}">${text}</span>`;
  }
}

