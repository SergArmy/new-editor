import { TestSuite } from '../../../test-framework/TestSuite.js';
import { Assert } from '../../../test-framework/Assert.js';
import { FooterBlock } from '../../../../src/blocks/structure/FooterBlock.js';

const suite = new TestSuite('Blocks/Structure/FooterBlock');

suite.test('render footer with content', () => {
  const block = new FooterBlock({ id: 'f1', type: 'footer', position: 0, content: 'Footer text', data: {} });
  const el = block.render();
  Assert.isTrue(el.classList.contains('document-footer'));
  Assert.isTrue(el.innerHTML.includes('Footer text'));
});

export default suite;

