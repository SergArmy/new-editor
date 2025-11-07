import { TestSuite } from '../../../test-framework/TestSuite.js';
import { Assert } from '../../../test-framework/Assert.js';
import { StateManager } from '../../../../src/core/state/StateManager.js';
import { HistoryManager } from '../../../../src/core/history/HistoryManager.js';
import { UpdateStateCommand } from '../../../../src/core/history/Command.js';

const suite = new TestSuite('Core/History/HistoryManager');

suite.test('execute pushes command; undo/redo work', () => {
  const sm = new StateManager({ v: 0 });
  const hm = new HistoryManager(sm);
  hm.execute(new UpdateStateCommand(s => ({ v: s.v + 1 })));
  Assert.strictEqual(sm.state.v, 1);
  Assert.isTrue(hm.undo());
  Assert.strictEqual(sm.state.v, 0);
  Assert.isTrue(hm.redo());
  Assert.strictEqual(sm.state.v, 1);
});

export default suite;


