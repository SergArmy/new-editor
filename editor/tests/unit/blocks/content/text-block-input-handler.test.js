import { TestSuite } from '../../../test-framework/TestSuite.js';
import { Assert } from '../../../test-framework/Assert.js';
import { TextBlockInputHandler } from '../../../../src/blocks/content/TextBlockInputHandler.js';
import { SlashCommands } from '../../../../src/commands/base/SlashCommands.js';
import { MarkdownShortcuts } from '../../../../src/commands/base/MarkdownShortcuts.js';

const suite = new TestSuite('Blocks/Content/TextBlockInputHandler');

suite.test('slash menu should work after typing backslash', () => {
  const slashCommands = new SlashCommands();
  const markdownShortcuts = new MarkdownShortcuts();
  let commandExecuted = false;
  
  const handler = new TextBlockInputHandler({
    slashCommands,
    markdownShortcuts,
    onCommand: () => { commandExecuted = true; },
    onMarkdown: () => {}
  });

  // Создаем элемент для тестирования
  const element = document.createElement('div');
  element.contentEditable = true;
  element.textContent = '';
  document.body.appendChild(element);

  handler.attach(element, 'test-block');

  // Симулируем ввод "/code"
  element.textContent = '/code';
  const range = document.createRange();
  range.selectNodeContents(element);
  range.collapse(false);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);

  const inputEvent = new InputEvent('input', { bubbles: true });
  element.dispatchEvent(inputEvent);

  // Проверяем, что меню появилось
  Assert.isTrue(handler.slashMenuVisible, 'Slash menu should be visible after typing /code');

  // Симулируем ввод обратного слеша после "/code"
  element.textContent = '/code\\';
  range.selectNodeContents(element);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);

  element.dispatchEvent(inputEvent);

  // Проверяем, что меню все еще видно (обратный слеш не должен закрывать меню)
  Assert.isTrue(handler.slashMenuVisible, 'Slash menu should still be visible after typing backslash');

  // Очищаем
  handler.detach();
  document.body.removeChild(element);
});

suite.test('slash menu should not appear when slash is escaped', () => {
  const slashCommands = new SlashCommands();
  const markdownShortcuts = new MarkdownShortcuts();
  
  const handler = new TextBlockInputHandler({
    slashCommands,
    markdownShortcuts,
    onCommand: () => {},
    onMarkdown: () => {}
  });

  const element = document.createElement('div');
  element.contentEditable = true;
  element.textContent = '';
  document.body.appendChild(element);

  handler.attach(element, 'test-block');

  // Симулируем ввод "\\/code" (экранированный слеш)
  element.textContent = '\\/code';
  const range = document.createRange();
  range.selectNodeContents(element);
  range.collapse(false);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);

  const inputEvent = new InputEvent('input', { bubbles: true });
  element.dispatchEvent(inputEvent);

  // Проверяем, что меню не появилось (слеш экранирован)
  Assert.isFalse(handler.slashMenuVisible, 'Slash menu should not appear when slash is escaped');

  // Очищаем
  handler.detach();
  document.body.removeChild(element);
});

suite.test('slash menu should appear after double backslash before slash', () => {
  const slashCommands = new SlashCommands();
  const markdownShortcuts = new MarkdownShortcuts();
  
  const handler = new TextBlockInputHandler({
    slashCommands,
    markdownShortcuts,
    onCommand: () => {},
    onMarkdown: () => {}
  });

  const element = document.createElement('div');
  element.contentEditable = true;
  element.textContent = '';
  document.body.appendChild(element);

  handler.attach(element, 'test-block');

  // Симулируем ввод "text \\\\/code" (двойной обратный слеш перед слешем после пробела - не экранирован)
  // Два обратных слеша экранируют друг друга, поэтому слеш не экранирован
  element.textContent = 'text \\\\/code';
  const range = document.createRange();
  range.selectNodeContents(element);
  range.collapse(false);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);

  const inputEvent = new InputEvent('input', { bubbles: true });
  element.dispatchEvent(inputEvent);

  // Проверяем, что меню появилось (четное количество обратных слешей не экранирует, и есть пробел перед ними)
  Assert.isTrue(handler.slashMenuVisible, 'Slash menu should appear when slash is not escaped (even number of backslashes after space)');

  // Очищаем
  handler.detach();
  document.body.removeChild(element);
});

export default suite;

