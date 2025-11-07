import { TestSuite } from '../../../test-framework/TestSuite.js';
import { Assert } from '../../../test-framework/Assert.js';
import { Block } from '../../../../src/blocks/base/Block.js';

const suite = new TestSuite('Blocks/Base/Block');

suite.test('create block and render', () => {
  const block = new Block({ id: 'b1', type: 'text', position: 0, data: {} });
  Assert.strictEqual(block.id, 'b1');
  Assert.strictEqual(block.type, 'text');
  const el = block.render();
  Assert.isTrue(el.classList.contains('block-text'));
});

export default suite;

