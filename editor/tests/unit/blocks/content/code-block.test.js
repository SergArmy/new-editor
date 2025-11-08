import { TestSuite } from '../../../test-framework/TestSuite.js';
import { Assert } from '../../../test-framework/Assert.js';
import { CodeBlock } from '../../../../src/blocks/content/CodeBlock.js';

const suite = new TestSuite('Blocks/Content/CodeBlock');

suite.test('render code block with language', () => {
  // Отключаем Monaco для теста, чтобы гарантировать fallback редактор
  const block = new CodeBlock({
    id: 'c1',
    type: 'code',
    position: 0,
    code: 'function test() {}',
    language: 'javascript',
    useMonaco: false, // Явно отключаем Monaco для теста
    readOnly: true, // Устанавливаем readOnly для использования pre
    data: {}
  });
  const el = block.render();
  Assert.isTrue(el.classList.contains('code-block'));

  // Проверяем, что код виден в контейнере (fallback редактор рендерится синхронно)
  const container = el.querySelector('.code-editor-container');
  Assert.isNotNull(container, 'Container should exist');

  // Код должен быть виден либо в pre (read-only), либо в textarea (editable)
  const pre = container.querySelector('pre');
  const textarea = container.querySelector('textarea');

  Assert.isTrue(pre !== null || textarea !== null,
    `Container should have pre or textarea. Container HTML: ${container.innerHTML}`);

  if (pre) {
    Assert.isTrue(pre.textContent.includes('function test'),
      `Pre should contain code. Pre textContent: ${pre.textContent}`);
  } else if (textarea) {
    Assert.isTrue(textarea.value.includes('function test'),
      `Textarea should contain code. Textarea value: ${textarea.value}`);
  }
});

suite.test('render code block header with copy and language buttons', () => {
  const block = new CodeBlock({
    id: 'c2',
    type: 'code',
    position: 0,
    code: 'Процедура Тест()\nКонецПроцедуры',
    language: 'bsl',
    useMonaco: false,
    data: {}
  });
  const el = block.render();

  // Проверяем наличие header
  const header = el.querySelector('.code-block-header');
  Assert.isNotNull(header, 'Header should exist');

  // Проверяем кнопку копирования
  const copyBtn = header.querySelector('.code-copy-btn');
  Assert.isNotNull(copyBtn, 'Copy button should exist');

  // Проверяем кнопку выбора языка
  const languageBtn = header.querySelector('.code-language-btn');
  Assert.isNotNull(languageBtn, 'Language button should exist');
  Assert.isTrue(languageBtn.textContent.includes('1С (BSL)'), 'Language button should show BSL label');

  // Проверяем кнопку настроек
  const settingsBtn = header.querySelector('.code-settings-btn');
  Assert.isNotNull(settingsBtn, 'Settings button should exist');
});

suite.test('render code block with settings dropdown', () => {
  const block = new CodeBlock({
    id: 'c3',
    type: 'code',
    position: 0,
    code: 'SELECT * FROM Table',
    language: 'sql',
    lineNumbers: true,
    minimap: false,
    useMonaco: false,
    data: {}
  });
  const el = block.render();

  // Проверяем наличие выпадающего списка настроек
  const settingsDropdown = el.querySelector('.code-settings-dropdown');
  Assert.isNotNull(settingsDropdown, 'Settings dropdown should exist');

  // Проверяем наличие тумблера нумерации строк в dropdown
  const lineNumbersToggle = el.querySelector('input#toggle-line-numbers-c3');
  Assert.isNotNull(lineNumbersToggle, 'Line numbers toggle should exist');
  Assert.strictEqual(lineNumbersToggle.checked, true, 'Line numbers should be enabled');

  // Проверяем наличие тумблера миникарты в dropdown
  const minimapToggle = el.querySelector('input#toggle-minimap-c3');
  Assert.isNotNull(minimapToggle, 'Minimap toggle should exist');
  Assert.strictEqual(minimapToggle.checked, false, 'Minimap should be disabled');
});

suite.test('language dropdown shows all supported languages', () => {
  const block = new CodeBlock({
    id: 'c4',
    type: 'code',
    position: 0,
    code: '{}',
    language: 'json',
    useMonaco: false,
    data: {}
  });
  const el = block.render();

  // Проверяем наличие dropdown
  const dropdown = el.querySelector('.code-language-dropdown');
  Assert.isNotNull(dropdown, 'Dropdown should exist');

  // Проверяем, что в dropdown есть все поддерживаемые языки
  const items = dropdown.querySelectorAll('.code-language-item');
  Assert.strictEqual(items.length, 8, 'Dropdown should have 8 language items');

  const labels = Array.from(items).map((item) => item.textContent.trim());
  const sortedLabels = [...labels].sort((a, b) => a.localeCompare(b, 'ru-RU'));

  Assert.strictEqual(labels.length, sortedLabels.length, 'Sorted list should keep the same length');
  labels.forEach((label, index) => {
    Assert.strictEqual(label, sortedLabels[index], `Language label at index ${index} should be alphabetically ordered`);
  });

  // Проверяем, что текущий язык отмечен как активный
  const activeItem = dropdown.querySelector('.code-language-item.active');
  Assert.isNotNull(activeItem, 'One item should be marked as active');
  Assert.strictEqual(activeItem.getAttribute('data-language'), 'json', 'JSON should be active');
});

suite.test('language normalization for 1C aliases', () => {
  const block1 = new CodeBlock({
    id: 'c5',
    type: 'code',
    position: 0,
    code: '',
    language: '1c',
    data: {}
  });
  Assert.strictEqual(block1.language, 'bsl', '1c should be normalized to bsl');

  const block2 = new CodeBlock({
    id: 'c6',
    type: 'code',
    position: 0,
    code: '',
    language: '1C',
    data: {}
  });
  Assert.strictEqual(block2.language, 'bsl', '1C should be normalized to bsl');
});

suite.test('toJSON includes new properties', () => {
  const block = new CodeBlock({
    id: 'c7',
    type: 'code',
    position: 0,
    code: 'test code',
    language: 'javascript',
    lineNumbers: false,
    minimap: true,
    data: {}
  });

  const json = block.toJSON();
  Assert.strictEqual(json.code, 'test code', 'Code should be in JSON');
  Assert.strictEqual(json.language, 'javascript', 'Language should be in JSON');
  Assert.strictEqual(json.lineNumbers, false, 'Line numbers state should be in JSON');
  Assert.strictEqual(json.minimap, true, 'Minimap state should be in JSON');
});

suite.test('language button click opens dropdown', () => {
  const block = new CodeBlock({
    id: 'c8',
    type: 'code',
    position: 0,
    code: '',
    language: 'javascript',
    useMonaco: false,
    data: {}
  });
  const el = block.render();
  document.body.appendChild(el); // Добавляем в DOM для тестирования событий

  const languageBtn = el.querySelector('.code-language-btn');
  const dropdown = el.querySelector('.code-language-dropdown');

  // Изначально dropdown скрыт
  Assert.strictEqual(dropdown.style.display, 'none', 'Dropdown should be hidden initially');
  Assert.isFalse(block.isLanguageDropdownOpen, 'isLanguageDropdownOpen should be false initially');

  // Кликаем на кнопку
  languageBtn.click();

  // Dropdown должен открыться
  Assert.strictEqual(dropdown.style.display, 'block', 'Dropdown should be visible after click');
  Assert.isTrue(block.isLanguageDropdownOpen, 'isLanguageDropdownOpen should be true after click');

  // Очищаем
  document.body.removeChild(el);
});

suite.test('change language updates button text', async () => {
  const block = new CodeBlock({
    id: 'c9',
    type: 'code',
    position: 0,
    code: '',
    language: 'javascript',
    useMonaco: false,
    data: {}
  });
  const el = block.render();

  const languageBtn = el.querySelector('.code-language-btn');
  Assert.isTrue(languageBtn.textContent.includes('JavaScript'),
    'Initial language should be JavaScript');

  // Меняем язык
  await block._changeLanguage('bsl');

  Assert.isTrue(languageBtn.textContent.includes('1С (BSL)'),
    'Language button should update to BSL');
  Assert.strictEqual(block.language, 'bsl', 'Block language property should update');
});

suite.test('default language is BSL', () => {
  const block = new CodeBlock({
    id: 'c10',
    type: 'code',
    position: 0,
    code: '',
    data: {}
  });
  Assert.strictEqual(block.language, 'bsl', 'Default language should be bsl');
});

suite.test('minimap is disabled by default', () => {
  const block = new CodeBlock({
    id: 'c11',
    type: 'code',
    position: 0,
    code: '',
    data: {}
  });
  Assert.strictEqual(block.minimap, false, 'Minimap should be disabled by default');
});

suite.test('line numbers are enabled by default', () => {
  const block = new CodeBlock({
    id: 'c12',
    type: 'code',
    position: 0,
    code: '',
    data: {}
  });
  Assert.strictEqual(block.lineNumbers, true, 'Line numbers should be enabled by default');
});

export default suite;

