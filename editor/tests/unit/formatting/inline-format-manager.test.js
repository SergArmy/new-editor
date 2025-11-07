import { TestSuite } from '../../test-framework/TestSuite.js';
import { Assert } from '../../test-framework/Assert.js';
import { InlineFormatManager } from '../../../src/formatting/InlineFormatManager.js';

const suite = new TestSuite('Formatting/InlineFormatManager');

suite.test('apply bold format to selected text', () => {
  const element = document.createElement('div');
  element.contentEditable = true;
  element.textContent = 'Hello world';
  document.body.appendChild(element);

  // Фокусируем элемент, чтобы execCommand работал
  element.focus();

  // Выделяем текст
  const range = document.createRange();
  range.selectNodeContents(element);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);

  const result = InlineFormatManager.applyFormat(element, 'bold');
  Assert.isTrue(result, 'Format should be applied');
  // document.execCommand может создавать <strong> или <b> в зависимости от браузера
  Assert.isTrue(
    element.innerHTML.includes('<strong>') || element.innerHTML.includes('<b>'),
    'Should contain strong or b tag'
  );

  document.body.removeChild(element);
});

suite.test('toggle italic format', () => {
  const element = document.createElement('div');
  element.contentEditable = true;
  element.textContent = 'Hello world';
  document.body.appendChild(element);

  // Фокусируем элемент, чтобы execCommand работал
  element.focus();

  // Выделяем текст
  const range = document.createRange();
  range.selectNodeContents(element);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);

  const result = InlineFormatManager.toggleFormat(element, 'italic');
  Assert.isTrue(result, 'Format should be toggled');
  // document.execCommand может создавать <em> или <i> в зависимости от браузера
  Assert.isTrue(
    element.innerHTML.includes('<em>') || element.innerHTML.includes('<i>'),
    'Should contain italic tag'
  );

  document.body.removeChild(element);
});

suite.test('create link from selected text', () => {
  const element = document.createElement('div');
  element.contentEditable = true;
  element.textContent = 'Click here';
  document.body.appendChild(element);

  // Фокусируем элемент, чтобы execCommand работал
  element.focus();

  // Выделяем текст
  const range = document.createRange();
  range.selectNodeContents(element);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);

  const result = InlineFormatManager.createLink(element, 'https://example.com');
  Assert.isTrue(result, 'Link should be created');
  Assert.isTrue(element.innerHTML.includes('<a'), 'Should contain link tag');
  Assert.isTrue(element.innerHTML.includes('https://example.com'), 'Should contain URL');

  document.body.removeChild(element);
});

suite.test('auto link URLs in text', () => {
  const element = document.createElement('div');
  element.contentEditable = true;
  element.textContent = 'Visit https://example.com for more info';
  document.body.appendChild(element);

  const linkCount = InlineFormatManager.autoLinkUrls(element);
  Assert.isTrue(linkCount > 0, 'Should create at least one link');
  Assert.isTrue(element.innerHTML.includes('<a'), 'Should contain link tag');
  Assert.isTrue(element.innerHTML.includes('https://example.com'), 'Should contain URL');

  document.body.removeChild(element);
});

suite.test('get and set HTML', () => {
  const element = document.createElement('div');
  element.contentEditable = true;
  element.innerHTML = '<strong>Bold</strong> text';
  document.body.appendChild(element);

  const html = InlineFormatManager.getHTML(element);
  Assert.isTrue(html.includes('<strong>'), 'Should get HTML with formatting');

  InlineFormatManager.setHTML(element, '<em>Italic</em> text');
  Assert.isTrue(element.innerHTML.includes('<em>'), 'Should set HTML with formatting');

  document.body.removeChild(element);
});

export default suite;

