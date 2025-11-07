import { TestSuite } from '../../test-framework/TestSuite.js';
import { Assert } from '../../test-framework/Assert.js';
import { ExportManager } from '../../../src/export/ExportManager.js';
import { JsonExporter } from '../../../src/export/exporters/JsonExporter.js';

const suite = new TestSuite('Export/ExportManager');

suite.test('register and export', async () => {
  const manager = new ExportManager();
  manager.registerExporter('json', new JsonExporter());
  const doc = { id: 'doc1', title: 'Test', blocks: [] };
  const result = await manager.export(doc, 'json');
  Assert.isTrue(result.includes('doc1'));
});

suite.test('get available formats', () => {
  const manager = new ExportManager();
  manager.registerExporter('json', new JsonExporter());
  Assert.isTrue(manager.getAvailableFormats().includes('json'));
});

export default suite;

