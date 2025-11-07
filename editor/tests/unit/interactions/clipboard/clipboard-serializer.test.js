import { TestSuite } from '../../../test-framework/TestSuite.js';
import { Assert } from '../../../test-framework/Assert.js';
import { ClipboardSerializer } from '../../../../src/interactions/clipboard/ClipboardSerializer.js';

const suite = new TestSuite('Interactions/Clipboard/ClipboardSerializer');

suite.test('serialize and deserialize blocks', () => {
  const blocks = [{ id: 'b1', type: 'text' }];
  const serialized = ClipboardSerializer.serialize(blocks);
  Assert.isTrue(serialized.includes('editor/blocks'));
  const deserialized = ClipboardSerializer.deserialize(serialized);
  Assert.strictEqual(deserialized.length, 1);
  Assert.strictEqual(deserialized[0].id, 'b1');
});

export default suite;

