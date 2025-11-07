import { TestSuite } from '../../test-framework/TestSuite.js';
import { Assert } from '../../test-framework/Assert.js';
import { Document } from '../../../src/document/Document.js';
import { DocumentSerializer } from '../../../src/document/DocumentSerializer.js';

const suite = new TestSuite('Document/DocumentSerializer');

suite.test('serialize and deserialize', () => {
  const doc = new Document({ id: '1', title: 'Test', blocks: [{ id: 'b1', type: 'text', position: 0, data: {} }] });
  const json = DocumentSerializer.serialize(doc);
  Assert.strictEqual(json.id, '1');
  Assert.strictEqual(json.content.blocks.length, 1);
  const restored = DocumentSerializer.deserialize(json);
  Assert.strictEqual(restored.id, '1');
  Assert.strictEqual(restored.blocks.length, 1);
});

export default suite;

