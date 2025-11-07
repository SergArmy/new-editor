import { TestSuite } from '../../../test-framework/TestSuite.js';
import { Assert } from '../../../test-framework/Assert.js';
import { XmlExporter } from '../../../../src/export/exporters/XmlExporter.js';

const suite = new TestSuite('Export/Exporters/XmlExporter');

suite.test('export document to XML', async () => {
  const exporter = new XmlExporter();
  const doc = { id: 'doc1', title: 'Test', blocks: [] };
  const result = await exporter.export(doc);
  Assert.isTrue(result.includes('<document'));
  Assert.isTrue(result.includes('doc1'));
});

export default suite;

