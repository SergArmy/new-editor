import { TestSuite } from '../../test-framework/TestSuite.js';
import { Assert } from '../../test-framework/Assert.js';
import { TemplateManager } from '../../../src/templates/TemplateManager.js';
import { Template } from '../../../src/templates/Template.js';

const suite = new TestSuite('TemplateManager', 'Template manager tests');

let manager;

suite.beforeEach(() => {
  manager = new TemplateManager();
});

suite.afterEach(() => {
  manager.templates.clear();
});

suite.test('should create empty manager', () => {
  Assert.isDefined(manager);
  Assert.equal(manager.templates.size, 0);
  Assert.isFalse(manager.isLoaded);
});

suite.test('should register template', () => {
  const template = new Template({
    id: 'test-1',
    name: 'Test',
    blocks: []
  });
  
  manager.register(template);
  
  Assert.equal(manager.templates.size, 1);
});

suite.test('should get registered template', () => {
  const template = new Template({
    id: 'test-1',
    name: 'Test',
    blocks: []
  });
  
  manager.register(template);
  const retrieved = manager.get('test-1');
  
  Assert.isNotNull(retrieved);
  Assert.equal(retrieved.id, 'test-1');
});

suite.test('should return null for non-existent template', () => {
  const retrieved = manager.get('non-existent');
  
  Assert.isNull(retrieved);
});

suite.test('should get all templates', () => {
  manager.register(new Template({ id: 'test-1', name: 'Test 1', blocks: [] }));
  manager.register(new Template({ id: 'test-2', name: 'Test 2', blocks: [] }));
  
  const all = manager.getAll();
  
  Assert.equal(all.length, 2);
});

suite.test('should get templates by category', () => {
  manager.register(new Template({ id: 'test-1', name: 'Test 1', category: 'docs', blocks: [] }));
  manager.register(new Template({ id: 'test-2', name: 'Test 2', category: 'specs', blocks: [] }));
  manager.register(new Template({ id: 'test-3', name: 'Test 3', category: 'docs', blocks: [] }));
  
  const docs = manager.getByCategory('docs');
  
  Assert.equal(docs.length, 2);
  Assert.equal(docs[0].category, 'docs');
  Assert.equal(docs[1].category, 'docs');
});

suite.test('should get categories list', () => {
  manager.register(new Template({ id: 'test-1', name: 'Test 1', category: 'docs', blocks: [] }));
  manager.register(new Template({ id: 'test-2', name: 'Test 2', category: 'specs', blocks: [] }));
  manager.register(new Template({ id: 'test-3', name: 'Test 3', category: 'docs', blocks: [] }));
  
  const categories = manager.getCategories();
  
  Assert.equal(categories.length, 2);
  Assert.isTrue(categories.includes('docs'));
  Assert.isTrue(categories.includes('specs'));
});

suite.test('should search templates', () => {
  manager.register(new Template({ id: 'test-1', name: 'User Manual', blocks: [] }));
  manager.register(new Template({ id: 'test-2', name: 'Tech Spec', blocks: [] }));
  manager.register(new Template({ id: 'test-3', name: 'User Guide', blocks: [] }));
  
  const results = manager.search('user');
  
  Assert.equal(results.length, 2);
});

suite.test('should create document from template', () => {
  const template = new Template({
    id: 'test-1',
    name: 'Test Template',
    blocks: [
      { type: 'text', data: { text: 'Hello, {{name}}!' } }
    ],
    variables: {
      name: { type: 'string', required: true }
    }
  });
  
  manager.register(template);
  
  const doc = manager.createDocument('test-1', { name: 'World' });
  
  Assert.isDefined(doc);
  Assert.equal(doc.blocks[0].data.text, 'Hello, World!');
  Assert.equal(doc.metadata.templateId, 'test-1');
});

suite.test('should throw error for non-existent template', () => {
  Assert.throws(() => {
    manager.createDocument('non-existent', {});
  });
});

suite.test('should throw error for invalid variables', () => {
  const template = new Template({
    id: 'test-1',
    name: 'Test',
    blocks: [],
    variables: {
      title: { type: 'string', required: true }
    }
  });
  
  manager.register(template);
  
  Assert.throws(() => {
    manager.createDocument('test-1', {});
  });
});

suite.test('should save custom template', () => {
  const templateData = {
    name: 'Custom Template',
    blocks: []
  };
  
  const template = manager.saveCustomTemplate(templateData);
  
  Assert.isDefined(template);
  Assert.isDefined(template.id);
  Assert.isTrue(template.metadata.custom);
  Assert.equal(manager.templates.size, 1);
});

suite.test('should delete custom template', () => {
  const template = manager.saveCustomTemplate({
    name: 'Custom',
    blocks: []
  });
  
  const deleted = manager.delete(template.id);
  
  Assert.isTrue(deleted);
  Assert.equal(manager.templates.size, 0);
});

suite.test('should not delete built-in template', () => {
  const template = new Template({
    id: 'builtin-1',
    name: 'Built-in',
    blocks: [],
    metadata: { custom: false }
  });
  
  manager.register(template);
  
  Assert.throws(() => {
    manager.delete('builtin-1');
  });
});

suite.test('should return false when deleting non-existent template', () => {
  const deleted = manager.delete('non-existent');
  
  Assert.isFalse(deleted);
});

suite.test('should load built-in templates', () => {
  manager.loadBuiltInTemplates();
  
  Assert.isTrue(manager.isLoaded);
  Assert.isTrue(manager.templates.size > 0);
});

suite.test('should initialize with built-in templates', () => {
  manager.initialize();
  
  Assert.isTrue(manager.isLoaded);
  Assert.isTrue(manager.templates.size > 0);
});

suite.test('should emit events on register', (done) => {
  manager.on('register', (template) => {
    Assert.equal(template.name, 'Test');
    done();
  });
  
  manager.register(new Template({ id: 'test-1', name: 'Test', blocks: [] }));
});

suite.test('should emit event on document creation', (done) => {
  const template = new Template({
    id: 'test-1',
    name: 'Test',
    blocks: [],
    variables: {}
  });
  
  manager.register(template);
  
  manager.on('document-created', (data) => {
    Assert.isDefined(data.template);
    Assert.isDefined(data.documentData);
    done();
  });
  
  manager.createDocument('test-1', {});
});

export default suite;

