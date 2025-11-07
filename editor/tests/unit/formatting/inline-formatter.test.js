import { TestSuite } from '../../test-framework/TestSuite.js';
import { Assert } from '../../test-framework/Assert.js';
import { InlineFormatter } from '../../../src/formatting/InlineFormatter.js';

const suite = new TestSuite('Formatting/InlineFormatter');

suite.test('format text with bold and italic', () => {
  const result = InlineFormatter.format('text', { bold: true, italic: true });
  Assert.isTrue(result.includes('<strong>'));
  Assert.isTrue(result.includes('<em>'));
});

export default suite;

