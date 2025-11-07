import { TestSuite } from '../../../test-framework/TestSuite.js';
import { Assert } from '../../../test-framework/Assert.js';
import { TableBlock } from '../../../../src/blocks/content/TableBlock.js';

const suite = new TestSuite('Blocks/Content/TableBlock');

suite.test('render table with rows', () => {
  const block = new TableBlock({ 
    id: 'tb1', 
    type: 'table', 
    position: 0, 
    rows: [['A', 'B'], ['1', '2']],
    header: true,
    data: {} 
  });
  const el = block.render();
  Assert.isTrue(el.classList.contains('table-block'));
  Assert.isTrue(el.innerHTML.includes('<table>'));
});

export default suite;

