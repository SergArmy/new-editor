import { TestSuite } from '../../test-framework/TestSuite.js';
import { Assert } from '../../test-framework/Assert.js';
import { Document } from '../../../src/document/Document.js';

const suite = new TestSuite('Document/Document');

suite.test('create document with metadata', () => {
  const doc = new Document({ id: '1', title: 'Test' });
  Assert.strictEqual(doc.id, '1');
  Assert.strictEqual(doc.title, 'Test');
  Assert.isDefined(doc.metadata);
});

suite.test('add and get blocks', () => {
  const doc = new Document({ id: '1' });
  doc.addBlock({ id: 'b1', type: 'text', position: 0, data: {} });
  Assert.isDefined(doc.getBlock('b1'));
  Assert.strictEqual(doc.blocks.length, 1);
});

suite.test('remove block', () => {
  const doc = new Document({ id: '1' });
  doc.addBlock({ id: 'b1', type: 'text', position: 0, data: {} });
  doc.removeBlock('b1');
  Assert.strictEqual(doc.blocks.length, 0);
});

export default suite;

