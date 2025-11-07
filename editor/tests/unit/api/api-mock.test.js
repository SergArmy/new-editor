import { TestSuite } from '../../test-framework/TestSuite.js';
import { Assert } from '../../test-framework/Assert.js';
import { ApiMock } from '../../../src/api/ApiMock.js';

const suite = new TestSuite('API/ApiMock');

suite.test('mock CRUD operations', async () => {
  const mock = new ApiMock();
  const doc = await mock.createDocument({ id: 'doc1', title: 'Test' });
  Assert.strictEqual(doc.title, 'Test');
  const retrieved = await mock.getDocument('doc1');
  Assert.strictEqual(retrieved.title, 'Test');
  await mock.deleteDocument('doc1');
  const deleted = await mock.getDocument('doc1');
  Assert.isNull(deleted);
});

export default suite;

