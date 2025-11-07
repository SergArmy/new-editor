import { TestSuite } from '../../../test-framework/TestSuite.js';
import { Assert } from '../../../test-framework/Assert.js';
import { PdfExporter } from '../../../../src/export/exporters/PdfExporter.js';

const suite = new TestSuite('Export/Exporters/PdfExporter');

suite.test('export document to PDF (HTML)', async () => {
  const exporter = new PdfExporter();
  const doc = { id: 'doc1', title: 'Test', blocks: [] };
  const result = await exporter.export(doc);
  Assert.isDefined(result);
  Assert.isTrue(result instanceof Blob);
});

export default suite;

