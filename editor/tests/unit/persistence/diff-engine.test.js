import { TestSuite } from '../../test-framework/TestSuite.js';
import { Assert } from '../../test-framework/Assert.js';
import { DiffEngine } from '../../../src/persistence/DiffEngine.js';

const suite = new TestSuite('Persistence/DiffEngine');

suite.test('diff detects added and removed blocks', () => {
  const prev = { blocks: [{ id: 'b1', type: 'text' }] };
  const next = { blocks: [{ id: 'b2', type: 'text' }] };
  const diff = DiffEngine.diff(prev, next);
  Assert.strictEqual(diff.added.length, 1);
  Assert.strictEqual(diff.removed.length, 1);
});

suite.test('diff detects modified blocks', () => {
  const prev = { blocks: [{ id: 'b1', type: 'text', data: { text: 'old' } }] };
  const next = { blocks: [{ id: 'b1', type: 'text', data: { text: 'new' } }] };
  const diff = DiffEngine.diff(prev, next);
  Assert.strictEqual(diff.modified.length, 1);
});

export default suite;

