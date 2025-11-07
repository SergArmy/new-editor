export class XmlExporter {
  /**
   * @param {Object} document
   * @param {Object} [options]
   * @returns {Promise<string>}
   */
  async export(document, options = {}) {
    const xml = this.buildXML(document);
    return xml;
  }

  /**
   * @param {Object} document - может быть Document объект или сериализованный документ
   * @returns {string}
   */
  buildXML(document) {
    // Поддерживаем оба формата: document.blocks и document.content.blocks
    const blocks = document.blocks || document.content?.blocks || [];
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += `<document id="${this.escape(document.id)}" version="${document.version || 1}">\n`;
    xml += '  <metadata>\n';
    xml += `    <title>${this.escape(document.title || '')}</title>\n`;
    if (document.author) {
      xml += `    <author id="${this.escape(document.author.id || '')}" name="${this.escape(document.author.name || '')}"/>\n`;
    }
    xml += '  </metadata>\n';
    xml += '  <content>\n';
    blocks.forEach(block => {
      xml += `    <block type="${this.escape(block.type)}" id="${this.escape(block.id)}" position="${block.position || 0}">\n`;
      xml += `      <data>${this.escape(JSON.stringify(block.data || {}))}</data>\n`;
      xml += '    </block>\n';
    });
    xml += '  </content>\n';
    xml += '</document>';
    return xml;
  }

  /**
   * @param {string} str
   * @returns {string}
   */
  escape(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * @param {Object} document - может быть Document объект или сериализованный документ
   * @returns {boolean}
   */
  validate(document) {
    if (!document || !document.id) {
      return false;
    }
    
    // Поддерживаем оба формата: document.blocks (Document) и document.content.blocks (сериализованный)
    const hasBlocks = document.blocks && Array.isArray(document.blocks);
    const hasContentBlocks = document.content && document.content.blocks && Array.isArray(document.content.blocks);
    
    return hasBlocks || hasContentBlocks;
  }
}

