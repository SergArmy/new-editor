import { TestSuite } from '../../../test-framework/TestSuite.js';
import { Assert } from '../../../test-framework/Assert.js';
import { Command } from '../../../../src/core/history/Command.js';
import { CommandStack } from '../../../../src/core/history/CommandStack.js';

const suite = new TestSuite('Core/History/CommandStack');

suite.test('push, undo/redo availability', () => {
  const st = new CommandStack(10);
  Assert.isFalse(st.canUndo());
  st.push(new Command());
  Assert.isTrue(st.canUndo());
  Assert.isFalse(st.canRedo());
  const c = st.popUndo();
  st.pushRedo(c);
  Assert.isTrue(st.canRedo());
});

export default suite;


