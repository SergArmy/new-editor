export class ClipboardSerializer {
  /**
   * @param {Object[]} blocks
   * @returns {string}
   */
  static serialize(blocks) {
    return JSON.stringify({
      format: 'editor/blocks',
      version: '1.0',
      blocks
    });
  }

  /**
   * @param {string} data
   * @returns {Object[]|null}
   */
  static deserialize(data) {
    try {
      const parsed = JSON.parse(data);
      if (parsed.format === 'editor/blocks' && Array.isArray(parsed.blocks)) {
        return parsed.blocks;
      }
    } catch (e) {
      return null;
    }
    return null;
  }

  /**
   * @param {string} html
   * @returns {string}
   */
  static sanitizeHTML(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    // Удаляем скрипты и опасные элементы
    const scripts = div.querySelectorAll('script, style, iframe');
    scripts.forEach(s => s.remove());
    return div.innerHTML;
  }
}

