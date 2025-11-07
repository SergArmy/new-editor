import { TestSuite } from '../../../test-framework/TestSuite.js';
import { Assert } from '../../../test-framework/Assert.js';
import { StateSnapshot } from '../../../../src/core/state/StateSnapshot.js';

const suite = new TestSuite('Core/State/StateSnapshot');

suite.test('deep freeze snapshot data', () => {
  const snap = new StateSnapshot({ a: { b: 1 } });
  Assert.isTrue(Object.isFrozen(snap.data));
  Assert.isTrue(Object.isFrozen(snap.data.a));
});

export default suite;


