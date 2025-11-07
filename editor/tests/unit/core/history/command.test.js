import { TestSuite } from '../../../test-framework/TestSuite.js';
import { Assert } from '../../../test-framework/Assert.js';
import { StateManager } from '../../../../src/core/state/StateManager.js';
import { UpdateStateCommand } from '../../../../src/core/history/Command.js';

const suite = new TestSuite('Core/History/Command');

suite.test('UpdateStateCommand execute and undo', () => {
  const sm = new StateManager({ n: 0 });
  const cmd = new UpdateStateCommand(s => ({ n: s.n + 1 }));
  cmd.execute(sm);
  Assert.strictEqual(sm.state.n, 1);
  cmd.undo(sm);
  Assert.strictEqual(sm.state.n, 0);
});

export default suite;


