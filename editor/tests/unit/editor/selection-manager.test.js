import { TestSuite } from '../../test-framework/TestSuite.js';
import { Assert } from '../../test-framework/Assert.js';
import { SelectionManager } from '../../../src/editor/SelectionManager.js';

const suite = new TestSuite('Editor/SelectionManager');

suite.test('select and check selection', () => {
  const sm = new SelectionManager();
  sm.select('b1');
  Assert.isTrue(sm.isSelected('b1'));
  Assert.strictEqual(sm.getSelected().length, 1);
});

suite.test('toggle selection', () => {
  const sm = new SelectionManager();
  sm.toggle('b1');
  Assert.isTrue(sm.isSelected('b1'));
  sm.toggle('b1');
  Assert.isFalse(sm.isSelected('b1'));
});

suite.test('select range with getBetweenIds', () => {
  const sm = new SelectionManager();
  const getBetweenIds = (startId, endId) => {
    // Симуляция получения блоков между start и end
    if (startId === 'b1' && endId === 'b3') {
      return ['b1', 'b2', 'b3'];
    }
    return [startId, endId];
  };
  
  sm.selectRange('b1', 'b3', getBetweenIds);
  Assert.isTrue(sm.isSelected('b1'));
  Assert.isTrue(sm.isSelected('b2'));
  Assert.isTrue(sm.isSelected('b3'));
  Assert.strictEqual(sm.getSelected().length, 3);
  Assert.strictEqual(sm.getAnchor(), 'b1');
});

suite.test('getAnchor returns anchor block', () => {
  const sm = new SelectionManager();
  Assert.strictEqual(sm.getAnchor(), null);
  
  sm.select('b1');
  Assert.strictEqual(sm.getAnchor(), 'b1');
  
  sm.select('b2');
  Assert.strictEqual(sm.getAnchor(), 'b2');
  
  sm.clear();
  Assert.strictEqual(sm.getAnchor(), null);
});

export default suite;

