import { TestSuite } from '../../../test-framework/TestSuite.js';
import { Assert } from '../../../test-framework/Assert.js';
import { ContentSanitizer } from '../../../../src/security/ContentSanitizer.js';

const suite = new TestSuite('Security/ContentSanitizer');

suite.beforeEach(() => {
  // Создаем тестовый контейнер для DOM операций
  if (!document.getElementById('test-container')) {
    const container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);
  }
});

suite.afterEach(() => {
  const container = document.getElementById('test-container');
  if (container) {
    container.innerHTML = '';
  }
});

suite.test('should sanitize dangerous script tags', () => {
  const html = '<script>alert("xss")</script><p>Safe text</p>';
  const sanitized = ContentSanitizer.sanitize(html);
  Assert.isFalse(sanitized.includes('<script'));
  Assert.isTrue(sanitized.includes('<p>'));
});

suite.test('should sanitize javascript: protocol in links', () => {
  const html = '<a href="javascript:alert(1)">Click</a>';
  const sanitized = ContentSanitizer.sanitize(html);
  Assert.isFalse(sanitized.includes('javascript:'));
});

suite.test('should allow safe links', () => {
  const html = '<a href="https://example.com">Link</a>';
  const sanitized = ContentSanitizer.sanitize(html);
  Assert.isTrue(sanitized.includes('https://example.com'));
});

suite.test('should sanitize event handlers', () => {
  const html = '<div onclick="alert(1)">Click me</div>';
  const sanitized = ContentSanitizer.sanitize(html);
  Assert.isFalse(sanitized.includes('onclick'));
});

suite.test('should allow safe HTML tags', () => {
  const html = '<p><strong>Bold</strong> and <em>italic</em> text</p>';
  const sanitized = ContentSanitizer.sanitize(html);
  Assert.isTrue(sanitized.includes('<strong>'));
  Assert.isTrue(sanitized.includes('<em>'));
});

suite.test('should remove iframe tags', () => {
  const html = '<iframe src="evil.com"></iframe><p>Safe</p>';
  const sanitized = ContentSanitizer.sanitize(html);
  Assert.isFalse(sanitized.includes('<iframe'));
});

suite.test('should sanitize images with safe src', () => {
  const html = '<img src="https://example.com/image.jpg" alt="Test">';
  const sanitized = ContentSanitizer.sanitize(html);
  Assert.isTrue(sanitized.includes('<img'));
  Assert.isTrue(sanitized.includes('https://example.com'));
});

suite.test('should remove images with javascript: protocol', () => {
  const html = '<img src="javascript:alert(1)">';
  const sanitized = ContentSanitizer.sanitize(html);
  const img = sanitized.match(/<img[^>]*>/);
  if (img) {
    Assert.isFalse(img[0].includes('javascript:'));
  }
});

suite.test('should allow anchors with #', () => {
  const html = '<a href="#section1">Anchor</a>';
  const sanitized = ContentSanitizer.sanitize(html);
  Assert.isTrue(sanitized.includes('#section1'));
});

suite.test('should escape special characters', () => {
  const text = '<script>&"\'';
  const escaped = ContentSanitizer.escape(text);
  Assert.isTrue(escaped.includes('&lt;'));
  Assert.isTrue(escaped.includes('&amp;'));
  Assert.isTrue(escaped.includes('&quot;'));
});

suite.test('should detect dangerous content', () => {
  Assert.isTrue(ContentSanitizer.containsDangerousContent('<script>alert(1)</script>'));
  Assert.isTrue(ContentSanitizer.containsDangerousContent('javascript:void(0)'));
  Assert.isTrue(ContentSanitizer.containsDangerousContent('<div onclick="test()">'));
  Assert.isFalse(ContentSanitizer.containsDangerousContent('<p>Safe text</p>'));
});

suite.test('should sanitize paste content', () => {
  const text = '<p>Safe</p><script>alert(1)</script>';
  const sanitized = ContentSanitizer.sanitizePaste(text);
  Assert.isTrue(sanitized.includes('<p>'));
  Assert.isFalse(sanitized.includes('<script'));
});

suite.test('should return plain text as is when no HTML', () => {
  const text = 'Plain text without HTML';
  const sanitized = ContentSanitizer.sanitizePaste(text);
  Assert.strictEqual(sanitized, text);
});

suite.test('should handle empty or null input', () => {
  Assert.strictEqual(ContentSanitizer.sanitize(''), '');
  Assert.strictEqual(ContentSanitizer.sanitize(null), '');
  Assert.strictEqual(ContentSanitizer.sanitize(undefined), '');
});

suite.test('should allow table tags', () => {
  const html = '<table><tr><td>Cell</td></tr></table>';
  const sanitized = ContentSanitizer.sanitize(html);
  Assert.isTrue(sanitized.includes('<table'));
  Assert.isTrue(sanitized.includes('<tr'));
  Assert.isTrue(sanitized.includes('<td'));
});

suite.test('should allow colspan and rowspan attributes', () => {
  const html = '<td colspan="2" rowspan="3">Cell</td>';
  const sanitized = ContentSanitizer.sanitize(html);
  Assert.isTrue(sanitized.includes('colspan="2"'));
  Assert.isTrue(sanitized.includes('rowspan="3"'));
});

export default suite;

