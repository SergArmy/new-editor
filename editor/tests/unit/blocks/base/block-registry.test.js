import { TestSuite } from '../../../test-framework/TestSuite.js';
import { Assert } from '../../../test-framework/Assert.js';
import { BlockRegistry } from '../../../../src/blocks/base/BlockRegistry.js';
import { Block } from '../../../../src/blocks/base/Block.js';

const suite = new TestSuite('Blocks/Base/BlockRegistry');

suite.test('register and get block type', () => {
  const reg = new BlockRegistry();
  reg.register('text', Block);
  Assert.strictEqual(reg.get('text'), Block);
  Assert.isTrue(reg.getTypes().includes('text'));
});

export default suite;

