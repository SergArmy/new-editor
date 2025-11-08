import { TestSuite } from '../../../test-framework/TestSuite.js';
import { Assert } from '../../../test-framework/Assert.js';
import { DefinitionBlock } from '../../../../src/blocks/specialized/DefinitionBlock.js';

const suite = new TestSuite('Blocks/Specialized/DefinitionBlock');

suite.test('renders simple definition with provided paragraphs', () => {
  const block = new DefinitionBlock({
    id: 'definition-1',
    type: 'definition',
    position: 0,
    parentId: null,
    protected: false,
    data: {
      term: 'API Gateway',
      description: [
        'Единая точка входа, маршрутизирующая запросы к микросервисам.',
        'Выполняет авторизацию, кеширование и контроль трафика.'
      ]
    }
  });

  const el = block.render();

  Assert.isTrue(el.classList.contains('definition-block'));
  Assert.strictEqual(el.querySelector('.definition-term').textContent, 'API Gateway');
  Assert.strictEqual(el.querySelectorAll('.definition-description p').length, 2);
});

suite.test('renders placeholder when description is missing', () => {
  const block = new DefinitionBlock({
    id: 'definition-2',
    type: 'definition',
    position: 1,
    parentId: null,
    protected: false,
    data: {
      term: 'Undo Stack'
    }
  });

  const el = block.render();

  const placeholder = el.querySelector('.definition-empty');
  Assert.isTrue(Boolean(placeholder));
  Assert.strictEqual(placeholder.textContent, 'Определение пока не заполнено.');
});

suite.test('toJSON normalizes string description', () => {
  const block = new DefinitionBlock({
    id: 'definition-3',
    type: 'definition',
    position: 2,
    parentId: null,
    protected: false,
    data: {
      term: 'Command Pattern',
      description: 'Инкапсулирует запрос как объект.\n\nОбеспечивает поддержку undo/redo.'
    }
  });

  const json = block.toJSON();

  Assert.strictEqual(json.term, 'Command Pattern');
  Assert.strictEqual(json.description.length, 2);
  Assert.strictEqual(json.description[0], 'Инкапсулирует запрос как объект.');
  Assert.strictEqual(json.description[1], 'Обеспечивает поддержку undo/redo.');
});

export default suite;
