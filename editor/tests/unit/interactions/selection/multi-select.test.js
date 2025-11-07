import { TestSuite } from '../../../test-framework/TestSuite.js';
import { Assert } from '../../../test-framework/Assert.js';
import { MultiSelect } from '../../../../src/interactions/selection/MultiSelect.js';

const suite = new TestSuite('Interactions/Selection/MultiSelect');

suite.test('select and toggle items', () => {
  const ms = new MultiSelect();
  ms.select('b1');
  Assert.isTrue(ms.isSelected('b1'));
  Assert.strictEqual(ms.getSelected().length, 1);
  ms.toggle('b2');
  Assert.strictEqual(ms.getSelected().length, 2);
});

export default suite;

