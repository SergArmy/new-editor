export class DiffEngine {
  /**
   * @param {Object} prev
   * @param {Object} next
   * @returns {Object}
   */
  static diff(prev, next) {
    const changes = {
      added: [],
      removed: [],
      modified: []
    };

    const prevBlocks = new Map(prev.blocks?.map(b => [b.id, b]) || []);
    const nextBlocks = new Map(next.blocks?.map(b => [b.id, b]) || []);

    // Найдем удаленные и измененные
    for (const [id, block] of prevBlocks.entries()) {
      if (!nextBlocks.has(id)) {
        changes.removed.push({ id, block });
      } else {
        const nextBlock = nextBlocks.get(id);
        if (!this.blocksEqual(block, nextBlock)) {
          changes.modified.push({ id, prev: block, next: nextBlock });
        }
      }
    }

    // Найдем добавленные
    for (const [id, block] of nextBlocks.entries()) {
      if (!prevBlocks.has(id)) {
        changes.added.push({ id, block });
      }
    }

    return changes;
  }

  /**
   * @param {Object} block1
   * @param {Object} block2
   * @returns {boolean}
   */
  static blocksEqual(block1, block2) {
    return JSON.stringify(block1) === JSON.stringify(block2);
  }

  /**
   * @param {string} text1
   * @param {string} text2
   * @returns {Array<{type: string, value: string}>}
   */
  static textDiff(text1, text2) {
    // Упрощенный diff - в реальности можно использовать библиотеку
    const parts = [];
    if (text1 === text2) {
      parts.push({ type: 'equal', value: text1 });
    } else {
      parts.push({ type: 'removed', value: text1 });
      parts.push({ type: 'added', value: text2 });
    }
    return parts;
  }
}

