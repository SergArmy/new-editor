import { TestSuite } from '../../../test-framework/TestSuite.js';
import { Assert } from '../../../test-framework/Assert.js';
import { BlockRenderer } from '../../../../src/blocks/base/BlockRenderer.js';
import { BlockFactory } from '../../../../src/blocks/base/BlockFactory.js';
import { BlockRegistry } from '../../../../src/blocks/base/BlockRegistry.js';
import { Block } from '../../../../src/blocks/base/Block.js';

const suite = new TestSuite('Blocks/Base/BlockRenderer');

suite.test('render block to DOM', () => {
  const reg = new BlockRegistry();
  reg.register('text', Block);
  const factory = new BlockFactory(reg);
  const renderer = new BlockRenderer(factory);
  const el = renderer.render({ id: 'b1', type: 'text', position: 0, data: {} });
  Assert.isTrue(el.classList.contains('block'));
});

export default suite;

