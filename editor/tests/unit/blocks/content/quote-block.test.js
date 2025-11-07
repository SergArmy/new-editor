import { TestSuite } from '../../../test-framework/TestSuite.js';
import { Assert } from '../../../test-framework/Assert.js';
import { QuoteBlock } from '../../../../src/blocks/content/QuoteBlock.js';

const suite = new TestSuite('Blocks/Content/QuoteBlock');

suite.test('render quote with type', () => {
  const block = new QuoteBlock({ 
    id: 'q1', 
    type: 'quote', 
    position: 0, 
    text: 'Quote text',
    quoteType: 'warning',
    data: {}
  });
  const el = block.render();
  Assert.isTrue(el.classList.contains('quote-block'));
  Assert.isTrue(el.classList.contains('quote-type-warning'));
});

export default suite;

