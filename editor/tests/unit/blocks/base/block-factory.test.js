import { TestSuite } from '../../../test-framework/TestSuite.js';
import { Assert } from '../../../test-framework/Assert.js';
import { BlockFactory } from '../../../../src/blocks/base/BlockFactory.js';
import { BlockRegistry } from '../../../../src/blocks/base/BlockRegistry.js';
import { Block } from '../../../../src/blocks/base/Block.js';

const suite = new TestSuite('Blocks/Base/BlockFactory');

suite.test('create block from factory', () => {
  const reg = new BlockRegistry();
  reg.register('text', Block);
  const factory = new BlockFactory(reg);
  const block = factory.create({ id: 'b1', type: 'text', position: 0, data: {} });
  Assert.strictEqual(block.type, 'text');
});

export default suite;

