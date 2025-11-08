import { TestSuite } from '../../../test-framework/TestSuite.js';
import { Assert } from '../../../test-framework/Assert.js';
import { ActionBlock } from '../../../../src/blocks/specialized/ActionBlock.js';

const suite = new TestSuite('Blocks/Specialized/ActionBlock');

suite.test('renders action with outcome and steps', () => {
  const block = new ActionBlock({
    id: 'action-1',
    type: 'action',
    position: 0,
    parentId: null,
    protected: false,
    data: {
      title: 'Подготовить релиз',
      outcome: 'Релиз готов к выкладке',
      steps: [
        { title: 'Собрать изменения', description: 'Проверить задачи и коммуникацию' },
        { title: 'Пройти тестирование', description: 'Запустить регрессионный прогон' }
      ]
    }
  });

  const el = block.render();

  Assert.isTrue(el.classList.contains('action-block'));
  Assert.strictEqual(el.querySelector('.action-title').textContent, 'Подготовить релиз');
  Assert.strictEqual(el.querySelector('.action-outcome').textContent, 'Релиз готов к выкладке');
  Assert.strictEqual(el.querySelectorAll('.action-step').length, 2);
  Assert.strictEqual(el.querySelector('.action-step-number').textContent, '1');
  Assert.strictEqual(el.querySelector('.action-step-title').textContent, 'Собрать изменения');
});

suite.test('toJSON normalizes steps and fallback values', () => {
  const block = new ActionBlock({
    id: 'action-2',
    type: 'action',
    position: 1,
    parentId: null,
    protected: false,
    data: {
      outcome: 'Команда синхронизирована',
      steps: [
        { description: 'Обсудить повестку' },
        { title: 'Зарегистрировать решения' },
        { title: ' ', description: ' ' }
      ]
    }
  });

  const json = block.toJSON();

  Assert.strictEqual(json.title, 'Действие');
  Assert.strictEqual(json.outcome, 'Команда синхронизирована');
  Assert.strictEqual(json.steps.length, 2);
  Assert.strictEqual(json.steps[0].title, 'Шаг 1');
  Assert.strictEqual(json.steps[0].description, 'Обсудить повестку');
  Assert.strictEqual(json.steps[1].title, 'Зарегистрировать решения');
});

suite.test('renders empty state when no steps provided', () => {
  const block = new ActionBlock({
    id: 'action-3',
    type: 'action',
    position: 2,
    parentId: null,
    protected: false,
    data: {
      title: 'Предварительная подготовка'
    }
  });

  const el = block.render();
  const empty = el.querySelector('.action-empty');

  Assert.isTrue(Boolean(empty));
  Assert.strictEqual(empty.textContent, 'Шаги ещё не заданы');
});

export default suite;


