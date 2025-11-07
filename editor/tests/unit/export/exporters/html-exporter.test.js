import { TestSuite } from '../../../test-framework/TestSuite.js';
import { Assert } from '../../../test-framework/Assert.js';
import { HtmlExporter } from '../../../../src/export/exporters/HtmlExporter.js';

const suite = new TestSuite('Export/Exporters/HtmlExporter');

suite.test('export document to HTML', async () => {
  const exporter = new HtmlExporter();
  const doc = { id: 'doc1', title: 'Test', blocks: [] };
  const result = await exporter.export(doc);
  Assert.isTrue(result.includes('<html'));
  Assert.isTrue(result.includes('Test'));
});

export default suite;

