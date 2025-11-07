import { TestSuite } from '../../../test-framework/TestSuite.js';
import { Assert } from '../../../test-framework/Assert.js';
import { HeaderBlock } from '../../../../src/blocks/structure/HeaderBlock.js';

const suite = new TestSuite('Blocks/Structure/HeaderBlock');

suite.test('render header with title and metadata', () => {
  const block = new HeaderBlock({ 
    id: 'h1', 
    type: 'header', 
    position: 0, 
    title: 'My Document',
    metadata: { author: 'John', version: 1 },
    data: {} 
  });
  const el = block.render();
  Assert.isTrue(el.classList.contains('document-header'));
  Assert.isTrue(el.innerHTML.includes('My Document'));
});

export default suite;

