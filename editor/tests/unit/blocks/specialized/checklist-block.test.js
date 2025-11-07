import { TestSuite } from '../../../test-framework/TestSuite.js';
import { Assert } from '../../../test-framework/Assert.js';
import { ChecklistBlock } from '../../../../src/blocks/specialized/ChecklistBlock.js';

const suite = new TestSuite('Blocks/Specialized/ChecklistBlock');

suite.test('renders checklist items with progress', () => {
  const block = new ChecklistBlock({
    id: 'c1',
    type: 'checklist',
    position: 0,
    data: {
      title: 'Deployment checklist',
      showProgress: true,
      items: [
        { id: 'i1', text: 'QA approved', checked: true },
        { id: 'i2', text: 'Release notes updated', checked: false }
      ]
    }
  });

  const el = block.render();

  Assert.isTrue(el.classList.contains('checklist-block'));
  Assert.strictEqual(el.querySelectorAll('.checklist-item').length, 2);
  Assert.strictEqual(el.querySelector('.checklist-progress').textContent, '1/2');
});

suite.test('toJSON returns persisted checklist data', () => {
  const block = new ChecklistBlock({
    id: 'c2',
    type: 'checklist',
    position: 0,
    data: {
      title: 'Launch tasks',
      items: [
        { id: 'task-1', text: 'Prepare announcement', checked: true, description: 'Draft email copy' }
      ]
    }
  });

  const json = block.toJSON();

  Assert.strictEqual(json.title, 'Launch tasks');
  Assert.strictEqual(json.items.length, 1);
  Assert.strictEqual(json.items[0].id, 'task-1');
  Assert.isTrue(json.items[0].checked);
  Assert.strictEqual(json.items[0].description, 'Draft email copy');
  Assert.strictEqual(json.showProgress, true);
});

export default suite;


