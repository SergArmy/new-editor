import { TestSuite } from '../../test-framework/TestSuite.js';
import { Assert } from '../../test-framework/Assert.js';
import { LinkManager } from '../../../src/formatting/LinkManager.js';

const suite = new TestSuite('Formatting/LinkManager');

suite.test('create link', () => {
  const result = LinkManager.createLink('Link text', 'https://example.com');
  Assert.isTrue(result.includes('href="https://example.com"'));
  Assert.isTrue(result.includes('Link text'));
});

suite.test('extract URL from text', () => {
  const url = LinkManager.extractUrl('Visit https://example.com for more');
  Assert.strictEqual(url, 'https://example.com');
});

export default suite;

