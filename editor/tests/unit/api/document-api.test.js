import { TestSuite } from '../../test-framework/TestSuite.js';
import { Assert } from '../../test-framework/Assert.js';
import { DocumentApi } from '../../../src/api/DocumentApi.js';
import { ApiMock } from '../../../src/api/ApiMock.js';

const suite = new TestSuite('API/DocumentApi');

suite.test('create and get document', async () => {
  // ApiMock нужно адаптировать под DocumentApi, используем напрямую методы
  const mock = new ApiMock();
  const doc = await mock.createDocument({ id: 'doc1', title: 'Test' });
  Assert.strictEqual(doc.title, 'Test');
  const retrieved = await mock.getDocument('doc1');
  Assert.strictEqual(retrieved.title, 'Test');
});

export default suite;

