import { TestSuite } from '../../../test-framework/TestSuite.js';
import { Assert } from '../../../test-framework/Assert.js';
import { KeyboardHandler } from '../../../../src/interactions/shortcuts/KeyboardHandler.js';

const suite = new TestSuite('Interactions/Shortcuts/KeyboardHandler');

suite.test('register and handle shortcut', () => {
  const kh = new KeyboardHandler();
  let called = false;
  kh.on('Ctrl+S', () => { called = true; });
  const e = new KeyboardEvent('keydown', { key: 's', ctrlKey: true });
  kh.handle(e);
  Assert.isTrue(called);
});

export default suite;

