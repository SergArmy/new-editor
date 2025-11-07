import { TestSuite } from '../../../test-framework/TestSuite.js';
import { Assert } from '../../../test-framework/Assert.js';
import { StateManager } from '../../../../src/core/state/StateManager.js';

const suite = new TestSuite('Core/State/StateManager');

suite.test('initial state and replaceState', () => {
  const sm = new StateManager({ a: 1 });
  Assert.strictEqual(sm.state.a, 1);
  let notified = 0;
  sm.subscribe(({ next }) => { if (next.a === 2) notified++; });
  sm.replaceState({ a: 2 });
  Assert.strictEqual(notified, 1);
});

suite.test('setState with updater function', () => {
  const sm = new StateManager({ count: 0 });
  sm.setState(s => ({ count: s.count + 1 }));
  Assert.strictEqual(sm.state.count, 1);
});

suite.test('no notify on shallow equal state', () => {
  const sm = new StateManager({ x: 1 });
  let notified = 0;
  sm.subscribe(() => { notified++; });
  sm.replaceState({ x: 1 });
  Assert.strictEqual(notified, 0);
});

export default suite;


