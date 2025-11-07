import { TestSuite } from '../../../test-framework/TestSuite.js';
import { Assert } from '../../../test-framework/Assert.js';
import { MarkdownShortcuts } from '../../../../src/commands/base/MarkdownShortcuts.js';

const suite = new TestSuite('Commands/Base/MarkdownShortcuts');

suite.test('match markdown pattern', () => {
  const ms = new MarkdownShortcuts();
  // После ввода '##' и пробела, курсор на позиции 3
  // Паттерн '##' должен быть найден (пробелы в конце игнорируются)
  const result = ms.match('## ', 3, 'Space');
  Assert.isNotNull(result);
  Assert.strictEqual(result.pattern, '##');
});

export default suite;

