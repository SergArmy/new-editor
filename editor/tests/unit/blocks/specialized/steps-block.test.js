import { TestSuite } from '../../../test-framework/TestSuite.js';
import { Assert } from '../../../test-framework/Assert.js';
import { StepsBlock } from '../../../../src/blocks/specialized/StepsBlock.js';

const suite = new TestSuite('Blocks/Specialized/StepsBlock');

suite.test('renders steps with numbering and status', () => {
  const block = new StepsBlock({
    id: 's1',
    type: 'steps',
    position: 0,
    data: {
      title: 'Процесс релиза',
      steps: [
        { id: 'step-1', title: 'Подготовка', status: 'done' },
        { id: 'step-2', title: 'Тестирование', status: 'active' },
        { id: 'step-3', title: 'Деплой' }
      ]
    }
  });

  const el = block.render();

  Assert.isTrue(el.classList.contains('steps-block'));
  Assert.strictEqual(el.querySelectorAll('.step-item').length, 3);
  Assert.strictEqual(el.querySelector('.step-item[data-status="done"] .step-number').textContent, '1');
  Assert.strictEqual(el.querySelector('.steps-title').textContent, 'Процесс релиза');
});

suite.test('toJSON serializes steps data', () => {
  const block = new StepsBlock({
    id: 's2',
    type: 'steps',
    position: 0,
    data: {
      steps: [
        { title: 'Первый шаг', description: 'Описание' }
      ]
    }
  });

  const json = block.toJSON();

  Assert.strictEqual(json.steps.length, 1);
  Assert.strictEqual(json.steps[0].title, 'Первый шаг');
  Assert.strictEqual(json.steps[0].description, 'Описание');
  Assert.strictEqual(json.steps[0].status, 'pending');
});

export default suite;


