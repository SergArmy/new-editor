export class SlashCommands {
  constructor() {
    this.commands = new Map();
    this.registerDefaults();
  }

  registerDefaults() {
    this.register('/code', { type: 'code', label: 'Code Block', description: 'Create code block' });
    this.register('/table', { type: 'table', label: 'Table', description: 'Create table' });
    this.register('/quote', { type: 'quote', label: 'Quote', description: 'Create quote block' });
    this.register('/h1', { type: 'section', label: 'Heading 1', description: 'Create H1 section', level: 1 });
    this.register('/h2', { type: 'section', label: 'Heading 2', description: 'Create H2 section', level: 2 });
    this.register('/h3', { type: 'section', label: 'Heading 3', description: 'Create H3 section', level: 3 });
    this.register('/text', { type: 'text', label: 'Text', description: 'Create text block' });
    this.register('/image', { type: 'image', label: 'Image', description: 'Insert image' });
  }

  /**
   * @param {string} command
   * @param {Object} config
   */
  register(command, config) {
    this.commands.set(command, config);
  }

  /**
   * @param {string} query
   * @returns {Array<{command: string, config: Object}>}
   */
  search(query) {
    const results = [];
    const lowerQuery = query.toLowerCase();
    for (const [cmd, config] of this.commands.entries()) {
      if (cmd.toLowerCase().includes(lowerQuery) || 
          config.label.toLowerCase().includes(lowerQuery)) {
        results.push({ command: cmd, config });
      }
    }
    return results.sort((a, b) => a.command.localeCompare(b.command));
  }

  /**
   * @param {string} command
   * @returns {Object|undefined}
   */
  get(command) {
    return this.commands.get(command);
  }

  /**
   * @returns {Array<string>}
   */
  getAll() {
    return Array.from(this.commands.keys());
  }
}

