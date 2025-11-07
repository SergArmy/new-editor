/**
 * @typedef {Object} Exporter
 * @property {Function} export
 * @property {Function} validate
 */

export class ExportManager {
  constructor() {
    /** @type {Map<string, Exporter>} */
    this.exporters = new Map();
  }

  /**
   * @param {string} format
   * @param {Exporter} exporter
   */
  registerExporter(format, exporter) {
    this.exporters.set(format, exporter);
  }

  /**
   * @param {Object} document
   * @param {string} format
   * @param {Object} [options]
   * @returns {Promise<any>}
   */
  async export(document, format, options = {}) {
    const exporter = this.exporters.get(format);
    if (!exporter) {
      throw new Error(`Exporter for format ${format} not found`);
    }

    if (exporter.validate && !exporter.validate(document)) {
      throw new Error(`Document validation failed for format ${format}`);
    }

    return exporter.export(document, options);
  }

  /**
   * @returns {string[]}
   */
  getAvailableFormats() {
    return Array.from(this.exporters.keys());
  }
}

