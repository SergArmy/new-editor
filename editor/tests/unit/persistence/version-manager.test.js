import { TestSuite } from '../../test-framework/TestSuite.js';
import { Assert } from '../../test-framework/Assert.js';
import { VersionManager } from '../../../src/persistence/VersionManager.js';
import { ApiMock } from '../../../src/api/ApiMock.js';

const suite = new TestSuite('Persistence/VersionManager');

suite.test('create version', async () => {
  const mock = new ApiMock();
  // Сначала создаем документ
  await mock.createDocument({ id: 'doc1', title: 'Test Document' });
  const vm = new VersionManager(mock);
  const version = await vm.createVersion('doc1', { blocks: [] }, 'test');
  Assert.isDefined(version.id);
  Assert.strictEqual(version.comment, 'test');
});

export default suite;

