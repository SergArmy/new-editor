import { TestSuite } from '../../test-framework/TestSuite.js';
import { Assert } from '../../test-framework/Assert.js';
import { FocusManager } from '../../../src/editor/FocusManager.js';

const suite = new TestSuite('Editor/FocusManager');

suite.test('focus and get focused block', () => {
  const fm = new FocusManager();
  fm.focus('b1');
  Assert.strictEqual(fm.getFocused(), 'b1');
  fm.blur();
  Assert.strictEqual(fm.getFocused(), null);
});

export default suite;

