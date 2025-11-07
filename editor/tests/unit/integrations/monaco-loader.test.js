import { TestSuite } from '../../test-framework/TestSuite.js';
import { Assert } from '../../test-framework/Assert.js';
import { MonacoLoader } from '../../../src/integrations/monaco/MonacoLoader.js';

const suite = new TestSuite('MonacoLoader', 'Monaco Editor loader tests');

suite.beforeEach(() => {
  // Очищаем window.monaco перед каждым тестом
  if (window.monaco) {
    delete window.monaco;
  }
});

suite.test('should create MonacoLoader instance', () => {
  const loader = new MonacoLoader();
  
  Assert.isDefined(loader);
  Assert.isFalse(loader.isLoaded);
  Assert.isFalse(loader.isLoading);
  Assert.isNull(loader.monaco);
});

suite.test('should have default CDN URL', () => {
  const loader = new MonacoLoader();
  
  Assert.isDefined(loader.cdnUrl);
  Assert.match(loader.cdnUrl, /monaco-editor/);
});

suite.test('should allow setting custom CDN URL', () => {
  const loader = new MonacoLoader();
  const customUrl = 'https://custom-cdn.com/monaco';
  
  loader.setCdnUrl(customUrl);
  
  Assert.equal(loader.cdnUrl, customUrl);
});

suite.test('should not allow changing CDN URL after loading started', () => {
  const loader = new MonacoLoader();
  loader.isLoading = true;
  
  const originalUrl = loader.cdnUrl;
  loader.setCdnUrl('https://new-url.com');
  
  Assert.equal(loader.cdnUrl, originalUrl);
});

suite.test('should detect if Monaco is already loaded', () => {
  window.monaco = { editor: {} };
  
  const loader = new MonacoLoader();
  
  Assert.isTrue(loader.isAvailable());
});

suite.test('isAvailable should return false when not loaded', () => {
  const loader = new MonacoLoader();
  
  Assert.isFalse(loader.isAvailable());
});

suite.test('getMonaco should return null when not loaded', () => {
  const loader = new MonacoLoader();
  
  Assert.isNull(loader.getMonaco());
});

suite.test('getMonaco should return Monaco instance when loaded', () => {
  const loader = new MonacoLoader();
  const mockMonaco = { editor: {} };
  loader.monaco = mockMonaco;
  loader.isLoaded = true;
  
  Assert.equal(loader.getMonaco(), mockMonaco);
});

export default suite;

