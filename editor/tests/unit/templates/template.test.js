import { TestSuite } from '../../test-framework/TestSuite.js';
import { Assert } from '../../test-framework/Assert.js';
import { Template } from '../../../src/templates/Template.js';

const suite = new TestSuite('Template', 'Template class tests');

suite.test('should create template instance', () => {
  const template = new Template({
    id: 'test-1',
    name: 'Test Template',
    blocks: []
  });
  
  Assert.isDefined(template);
  Assert.equal(template.id, 'test-1');
  Assert.equal(template.name, 'Test Template');
});

suite.test('should have default values', () => {
  const template = new Template({
    id: 'test-1',
    name: 'Test'
  });
  
  Assert.equal(template.description, '');
  Assert.equal(template.category, 'general');
  Assert.isTrue(Array.isArray(template.blocks));
  Assert.isDefined(template.variables);
  Assert.isDefined(template.metadata);
});

suite.test('should get variables list', () => {
  const template = new Template({
    id: 'test-1',
    name: 'Test',
    variables: {
      title: { type: 'string', required: true },
      author: { type: 'string', required: false }
    }
  });
  
  const vars = template.getVariables();
  
  Assert.equal(vars.length, 2);
  Assert.isTrue(vars.includes('title'));
  Assert.isTrue(vars.includes('author'));
});

suite.test('should check if has variables', () => {
  const template1 = new Template({
    id: 'test-1',
    name: 'Test',
    variables: { title: {} }
  });
  
  const template2 = new Template({
    id: 'test-2',
    name: 'Test',
    variables: {}
  });
  
  Assert.isTrue(template1.hasVariables());
  Assert.isFalse(template2.hasVariables());
});

suite.test('should replace variables in text', () => {
  const template = new Template({
    id: 'test-1',
    name: 'Test',
    blocks: [
      {
        type: 'text',
        data: { text: 'Hello, {{name}}!' }
      }
    ],
    variables: {
      name: { type: 'string' }
    }
  });
  
  const processed = template.apply({ name: 'World' });
  
  Assert.equal(processed.blocks[0].data.text, 'Hello, World!');
});

suite.test('should replace multiple variables', () => {
  const template = new Template({
    id: 'test-1',
    name: 'Test',
    blocks: [
      {
        type: 'text',
        data: { 
          text: '{{title}} by {{author}}' 
        }
      }
    ],
    variables: {
      title: { type: 'string' },
      author: { type: 'string' }
    }
  });
  
  const processed = template.apply({ 
    title: 'Document',
    author: 'John'
  });
  
  Assert.equal(processed.blocks[0].data.text, 'Document by John');
});

suite.test('should leave unmatched variables as is', () => {
  const template = new Template({
    id: 'test-1',
    name: 'Test',
    blocks: [
      {
        type: 'text',
        data: { text: 'Hello, {{name}}!' }
      }
    ]
  });
  
  const processed = template.apply({});
  
  Assert.equal(processed.blocks[0].data.text, 'Hello, {{name}}!');
});

suite.test('should validate required variables', () => {
  const template = new Template({
    id: 'test-1',
    name: 'Test',
    variables: {
      title: { type: 'string', required: true },
      author: { type: 'string', required: false }
    }
  });
  
  const validation1 = template.validate({ title: 'Test' });
  Assert.isTrue(validation1.valid);
  Assert.equal(validation1.errors.length, 0);
  
  const validation2 = template.validate({});
  Assert.isFalse(validation2.valid);
  Assert.isTrue(validation2.errors.length > 0);
});

suite.test('should validate variable types', () => {
  const template = new Template({
    id: 'test-1',
    name: 'Test',
    variables: {
      count: { type: 'number' }
    }
  });
  
  const validation1 = template.validate({ count: 42 });
  Assert.isTrue(validation1.valid);
  
  const validation2 = template.validate({ count: 'not a number' });
  Assert.isFalse(validation2.valid);
});

suite.test('should clone template', () => {
  const template = new Template({
    id: 'test-1',
    name: 'Test',
    blocks: [{ type: 'text', data: { text: 'Hello' } }]
  });
  
  const cloned = template.clone();
  
  Assert.equal(cloned.id, template.id);
  Assert.equal(cloned.name, template.name);
  Assert.equal(cloned.blocks.length, template.blocks.length);
  Assert.notEqual(cloned.blocks, template.blocks); // Different reference
});

suite.test('should serialize to JSON', () => {
  const template = new Template({
    id: 'test-1',
    name: 'Test',
    description: 'Test template',
    category: 'test',
    blocks: []
  });
  
  const json = template.toJSON();
  
  Assert.isDefined(json.id);
  Assert.isDefined(json.name);
  Assert.isDefined(json.description);
  Assert.isDefined(json.category);
  Assert.isDefined(json.blocks);
  Assert.isDefined(json.createdAt);
  Assert.isDefined(json.updatedAt);
});

suite.test('should create from JSON', () => {
  const json = {
    id: 'test-1',
    name: 'Test',
    blocks: [],
    variables: {},
    metadata: {}
  };
  
  const template = Template.fromJSON(json);
  
  Assert.instanceOf(template, Template);
  Assert.equal(template.id, json.id);
  Assert.equal(template.name, json.name);
});

suite.test('should process nested objects', () => {
  const template = new Template({
    id: 'test-1',
    name: 'Test',
    blocks: [
      {
        type: 'complex',
        data: {
          nested: {
            title: '{{title}}',
            items: ['{{item1}}', '{{item2}}']
          }
        }
      }
    ]
  });
  
  const processed = template.apply({ 
    title: 'Test Title',
    item1: 'First',
    item2: 'Second'
  });
  
  Assert.equal(processed.blocks[0].data.nested.title, 'Test Title');
  Assert.equal(processed.blocks[0].data.nested.items[0], 'First');
  Assert.equal(processed.blocks[0].data.nested.items[1], 'Second');
});

export default suite;

