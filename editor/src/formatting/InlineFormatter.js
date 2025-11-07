export class InlineFormatter {
  /**
   * @param {string} text
   * @param {Object} format
   * @returns {string}
   */
  static format(text, format = {}) {
    let result = text;
    if (format.bold) result = `<strong>${result}</strong>`;
    if (format.italic) result = `<em>${result}</em>`;
    if (format.underline) result = `<u>${result}</u>`;
    if (format.strikethrough) result = `<s>${result}</s>`;
    if (format.code) result = `<code>${result}</code>`;
    return result;
  }

  /**
   * @param {string} text
   * @param {string} tag
   * @returns {string}
   */
  static wrap(text, tag) {
    return `<${tag}>${text}</${tag}>`;
  }
}

