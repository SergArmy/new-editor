import { TestSuite } from '../../../test-framework/TestSuite.js';
import { Assert } from '../../../test-framework/Assert.js';
import { ImageBlock } from '../../../../src/blocks/content/ImageBlock.js';

const suite = new TestSuite('Blocks/Content/ImageBlock');

suite.test('render image block with src and alt', () => {
  const block = new ImageBlock({ 
    id: 'i1', 
    type: 'image', 
    position: 0, 
    src: 'image.jpg',
    alt: 'Test image',
    data: {} 
  });
  const el = block.render();
  Assert.isTrue(el.classList.contains('image-block'));
  Assert.isTrue(el.innerHTML.includes('image.jpg'));
});

export default suite;

