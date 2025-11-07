import { TestSuite } from '../../../test-framework/TestSuite.js';
import { Assert } from '../../../test-framework/Assert.js';
import { JsonExporter } from '../../../../src/export/exporters/JsonExporter.js';

const suite = new TestSuite('Export/Exporters/JsonExporter');

suite.test('export document to JSON', async () => {
  const exporter = new JsonExporter();
  const doc = { id: 'doc1', title: 'Test', blocks: [] };
  const result = await exporter.export(doc);
  Assert.isTrue(result.includes('doc1'));
  Assert.isTrue(result.includes('Test'));
});

export default suite;

