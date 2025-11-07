import { TestSuite } from '../../test-framework/TestSuite.js';
import { Assert } from '../../test-framework/Assert.js';
import { MetadataRegistry } from '../../../src/integrations/metadata/MetadataRegistry.js';

const suite = new TestSuite('MetadataRegistry', 'Metadata registry tests');

let registry;

suite.beforeEach(() => {
  registry = new MetadataRegistry();
});

suite.afterEach(() => {
  registry.clear();
});

suite.test('should create empty registry', () => {
  Assert.isDefined(registry);
  Assert.equal(registry.count(), 0);
  Assert.isFalse(registry.isLoaded);
});

suite.test('should register metadata object', () => {
  const obj = {
    type: 'catalog',
    name: 'Products',
    displayName: 'Справочник.Товары'
  };
  
  registry.register(obj);
  
  Assert.equal(registry.count(), 1);
});

suite.test('should get registered object', () => {
  const obj = {
    type: 'catalog',
    name: 'Products',
    displayName: 'Справочник.Товары'
  };
  
  registry.register(obj);
  const retrieved = registry.get('catalog', 'Products');
  
  Assert.isNotNull(retrieved);
  Assert.equal(retrieved.type, 'catalog');
  Assert.equal(retrieved.name, 'Products');
});

suite.test('should return null for non-existent object', () => {
  const retrieved = registry.get('catalog', 'NonExistent');
  
  Assert.isNull(retrieved);
});

suite.test('should check if object exists', () => {
  const obj = {
    type: 'catalog',
    name: 'Products',
    displayName: 'Справочник.Товары'
  };
  
  registry.register(obj);
  
  Assert.isTrue(registry.has('catalog', 'Products'));
  Assert.isFalse(registry.has('catalog', 'NonExistent'));
});

suite.test('should get objects by type', () => {
  registry.register({ type: 'catalog', name: 'Products', displayName: 'Товары' });
  registry.register({ type: 'catalog', name: 'Services', displayName: 'Услуги' });
  registry.register({ type: 'document', name: 'Sales', displayName: 'Продажи' });
  
  const catalogs = registry.getByType('catalog');
  
  Assert.equal(catalogs.length, 2);
  Assert.equal(catalogs[0].type, 'catalog');
  Assert.equal(catalogs[1].type, 'catalog');
});

suite.test('should search objects by name', () => {
  registry.register({ type: 'catalog', name: 'Products', displayName: 'Товары' });
  registry.register({ type: 'catalog', name: 'ProductGroups', displayName: 'Группы товаров' });
  registry.register({ type: 'document', name: 'Sales', displayName: 'Продажи' });
  
  const results = registry.search('product');
  
  Assert.equal(results.length, 2);
  Assert.match(results[0].name.toLowerCase(), /product/);
});

suite.test('should limit search results', () => {
  for (let i = 0; i < 20; i++) {
    registry.register({ 
      type: 'catalog', 
      name: `Product${i}`, 
      displayName: `Товар ${i}` 
    });
  }
  
  const results = registry.search('product', 5);
  
  Assert.equal(results.length, 5);
});

suite.test('should autocomplete object names', () => {
  registry.register({ type: 'catalog', name: 'Products', displayName: 'Товары' });
  registry.register({ type: 'catalog', name: 'ProductGroups', displayName: 'Группы' });
  registry.register({ type: 'catalog', name: 'Services', displayName: 'Услуги' });
  
  const results = registry.autocomplete(null, 'prod');
  
  Assert.equal(results.length, 2);
  Assert.isTrue(results[0].name.toLowerCase().startsWith('prod'));
});

suite.test('should autocomplete with type filter', () => {
  registry.register({ type: 'catalog', name: 'Products', displayName: 'Товары' });
  registry.register({ type: 'document', name: 'ProductSales', displayName: 'Продажи' });
  
  const results = registry.autocomplete('catalog', 'prod');
  
  Assert.equal(results.length, 1);
  Assert.equal(results[0].type, 'catalog');
});

suite.test('should clear registry', () => {
  registry.register({ type: 'catalog', name: 'Test', displayName: 'Тест' });
  Assert.equal(registry.count(), 1);
  
  registry.clear();
  
  Assert.equal(registry.count(), 0);
  Assert.isFalse(registry.isLoaded);
});

suite.test('should load mock data', () => {
  registry.loadMockData();
  
  Assert.isTrue(registry.isLoaded);
  Assert.isTrue(registry.count() > 0);
});

suite.test('should emit events on register', (done) => {
  registry.on('register', (obj) => {
    Assert.equal(obj.name, 'Test');
    done();
  });
  
  registry.register({ type: 'catalog', name: 'Test', displayName: 'Тест' });
});

export default suite;

