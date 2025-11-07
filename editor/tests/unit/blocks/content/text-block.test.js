import { TestSuite } from '../../../test-framework/TestSuite.js';
import { Assert } from '../../../test-framework/Assert.js';
import { TextBlock } from '../../../../src/blocks/content/TextBlock.js';

const suite = new TestSuite('Blocks/Content/TextBlock');

suite.test('render text block with content', () => {
  const block = new TextBlock({ id: 't1', type: 'text', position: 0, text: 'Hello world', data: {} });
  const el = block.render();
  Assert.isTrue(el.classList.contains('text-block'));
  Assert.isTrue(el.innerHTML.includes('Hello'));
});

export default suite;

