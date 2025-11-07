import { TestSuite } from '../../../test-framework/TestSuite.js';
import { Assert } from '../../../test-framework/Assert.js';
import { DragManager } from '../../../../src/interactions/drag-drop/DragManager.js';

const suite = new TestSuite('Interactions/DragDrop/DragManager');

suite.test('register draggable element', () => {
  const dm = new DragManager();
  const el = document.createElement('div');
  dm.registerDraggable(el, { id: 'test' }, () => {});
  Assert.strictEqual(el.getAttribute('draggable'), 'true');
});

export default suite;

