import { TestSuite } from '../../../test-framework/TestSuite.js';
import { Assert } from '../../../test-framework/Assert.js';
import { ComparisonBlock } from '../../../../src/blocks/specialized/ComparisonBlock.js';

const suite = new TestSuite('Blocks/Specialized/ComparisonBlock');

suite.test('renders comparison columns with statuses', () => {
  const block = new ComparisonBlock({
    id: 'cmp-1',
    type: 'comparison',
    position: 0,
    data: {
      title: 'Сравнение реализации',
      before: {
        title: 'До refactor',
        status: 'incorrect',
        content: [
          'Монолитный модуль без тестов',
          'Обработка ошибок отсутствует'
        ]
      },
      after: {
        title: 'После refactor',
        status: 'correct',
        content: [
          'Выделены сервисы, добавлены тесты',
          'Внедрена централизованная обработка ошибок'
        ]
      }
    }
  });

  const element = block.render();

  Assert.isTrue(element.classList.contains('comparison-block'));

  const title = element.querySelector('.comparison-title');
  Assert.strictEqual(title?.textContent, 'Сравнение реализации');

  const columns = element.querySelectorAll('.comparison-column');
  Assert.strictEqual(columns.length, 2);
  Assert.isTrue(columns[0].classList.contains('incorrect'));
  Assert.isTrue(columns[1].classList.contains('correct'));

  const paragraphs = element.querySelectorAll('.comparison-body p');
  Assert.strictEqual(paragraphs.length, 4);

  const headers = element.querySelectorAll('.comparison-header');
  Assert.strictEqual(headers.length, 2);
  Assert.strictEqual(headers[0]?.getAttribute('role'), 'button');
  Assert.strictEqual(headers[0]?.tabIndex, 0);
  Assert.isTrue(headers[0]?.getAttribute('title')?.includes('иконки'));
});

suite.test('renders code content with diff markers', () => {
  const block = new ComparisonBlock({
    id: 'cmp-2',
    type: 'comparison',
    position: 0,
    data: {
      sections: [
        {
          title: 'Метод calculate',
          before: {
            mode: 'code',
            content: [
              'function calculate(value) {',
              '  const tax = value * 0.2;',
              '  return value + tax;',
              '}'
            ]
          },
          after: {
            mode: 'code',
            content: [
              'function calculate(value, rate = 0.2) {',
              '+  const tax = value * rate;',
              '~  return value + tax;',
              '}'
            ]
          }
        }
      ]
    }
  });

  const element = block.render();
  const codeBlock = element.querySelector('.comparison-inline-code-block');
  Assert.isDefined(codeBlock);

  const pre = codeBlock?.querySelector('pre');
  Assert.isDefined(pre);
  const preContent = pre?.textContent || '';
  Assert.isTrue(preContent.includes('function calculate(value, rate = 0.2) {'));
  Assert.isTrue(preContent.includes('+  const tax = value * rate;'));
  Assert.isTrue(preContent.includes('~  return value + tax;'));
});

suite.test('toJSON persists normalized structure', () => {
  const block = new ComparisonBlock({
    id: 'cmp-3',
    type: 'comparison',
    position: 0,
    data: {
      title: 'Сравнение API',
      sections: [
        {
          id: 'section-1',
          title: 'Ответ сервиса',
          description: 'Выводим критичные поля',
          before: {
            title: 'Старая версия',
            status: 'incorrect',
            content: 'Поля `id` и `name` отсутствуют'
          },
          after: {
            title: 'Новая версия',
            status: 'correct',
            notes: ['Добавлен `id`', 'Добавлен `name`'],
            content: 'Ответ содержит идентификатор и имя'
          }
        }
      ]
    }
  });

  const json = block.toJSON();

  Assert.strictEqual(json.title, 'Сравнение API');
  Assert.strictEqual(json.sections.length, 1);
  const [section] = json.sections;

  Assert.strictEqual(section.id, 'section-1');
  Assert.strictEqual(section.title, 'Ответ сервиса');
  Assert.strictEqual(section.description, 'Выводим критичные поля');
  Assert.strictEqual(section.before.status, 'incorrect');
  Assert.strictEqual(section.after.status, 'correct');
  Assert.strictEqual(section.after.notes.length, 2);
  Assert.strictEqual(section.after.notes[0], 'Добавлен `id`');
  Assert.strictEqual(section.after.notes[1], 'Добавлен `name`');
  Assert.isTrue(section.before.content.includes('Поля `id`'));
  Assert.strictEqual(section.after.paragraphs.length, 1);
  Assert.strictEqual(section.after.language, null);
});

export default suite;


