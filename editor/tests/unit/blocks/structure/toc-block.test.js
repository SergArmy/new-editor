import { TestSuite } from '../../../test-framework/TestSuite.js';
import { Assert } from '../../../test-framework/Assert.js';
import { TocBlock } from '../../../../src/blocks/structure/TocBlock.js';

const suite = new TestSuite('Blocks/Structure/TocBlock');

suite.test('render TOC with items', () => {
  const block = new TocBlock({ 
    id: 'toc1', 
    type: 'toc', 
    position: 0, 
    items: [{ id: 's1', title: 'Section 1', level: 1 }],
    data: {} 
  });
  const el = block.render();
  Assert.isTrue(el.classList.contains('toc-block'));
  Assert.isTrue(el.innerHTML.includes('Section 1'));
});

export default suite;

