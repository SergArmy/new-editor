import { TestSuite } from '../../../test-framework/TestSuite.js';
import { Assert } from '../../../test-framework/Assert.js';
import { StateDiff } from '../../../../src/core/state/StateDiff.js';

const suite = new TestSuite('Core/State/StateDiff');

suite.test('detects added, removed, updated fields', () => {
  const prev = { a: 1, deep: { x: 1 } };
  const next = { a: 2, deep: { x: 1, y: 3 }, z: 9 };
  const { changes } = StateDiff.diff(prev, next);
  const types = changes.reduce((acc, c) => { acc[c.type] = true; return acc; }, {});
  Assert.isTrue(types.updated);
  Assert.isTrue(types.added);
  // removed should appear when a key disappears
  const { changes: ch2 } = StateDiff.diff({ k: 1 }, {});
  Assert.isTrue(ch2.some(c => c.type === 'removed' && c.path === 'k'));
});

export default suite;


