import { TestSuite } from '../../test-framework/TestSuite.js';
import { Assert } from '../../test-framework/Assert.js';
import { DocumentRenderer } from '../../../src/document/DocumentRenderer.js';
import { BlockRenderer } from '../../../src/blocks/base/BlockRenderer.js';
import { BlockFactory } from '../../../src/blocks/base/BlockFactory.js';
import { BlockRegistry } from '../../../src/blocks/base/BlockRegistry.js';
import { Block } from '../../../src/blocks/base/Block.js';
import { Document } from '../../../src/document/Document.js';

const suite = new TestSuite('Document/DocumentRenderer');

suite.beforeEach(() => {
  // Создаем минимальную инфраструктуру для рендеринга
  const registry = new BlockRegistry();
  registry.register('text', Block);
  const factory = new BlockFactory(registry);
  const blockRenderer = new BlockRenderer(factory);
  
  suite.blockRenderer = blockRenderer;
});

suite.test('render empty document', () => {
  const container = document.createElement('div');
  const renderer = new DocumentRenderer(suite.blockRenderer, container);
  const doc = new Document({ id: '1', title: 'Test', blocks: [] });
  
  renderer.render(doc);
  
  Assert.strictEqual(container.children.length, 0);
  Assert.strictEqual(container.innerHTML, '');
});

suite.test('render document with blocks', () => {
  const container = document.createElement('div');
  const renderer = new DocumentRenderer(suite.blockRenderer, container);
  const doc = new Document({
    id: '1',
    title: 'Test',
    blocks: [
      { id: 'b1', type: 'text', position: 0, parentId: null, protected: false, data: {} },
      { id: 'b2', type: 'text', position: 1, parentId: null, protected: false, data: {} }
    ]
  });
  
  renderer.render(doc);
  
  Assert.strictEqual(container.children.length, 2);
  Assert.strictEqual(container.querySelector('[data-block-id="b1"]').dataset.blockId, 'b1');
  Assert.strictEqual(container.querySelector('[data-block-id="b2"]').dataset.blockId, 'b2');
});

suite.test('render blocks in correct order by position', () => {
  const container = document.createElement('div');
  const renderer = new DocumentRenderer(suite.blockRenderer, container);
  const doc = new Document({
    id: '1',
    title: 'Test',
    blocks: [
      { id: 'b2', type: 'text', position: 2, parentId: null, protected: false, data: {} },
      { id: 'b1', type: 'text', position: 0, parentId: null, protected: false, data: {} },
      { id: 'b3', type: 'text', position: 1, parentId: null, protected: false, data: {} }
    ]
  });
  
  renderer.render(doc);
  
  const children = Array.from(container.children);
  Assert.strictEqual(children[0].dataset.blockId, 'b1');
  Assert.strictEqual(children[1].dataset.blockId, 'b3');
  Assert.strictEqual(children[2].dataset.blockId, 'b2');
});

suite.test('renderBlock adds block to container', () => {
  const container = document.createElement('div');
  const renderer = new DocumentRenderer(suite.blockRenderer, container);
  
  const blockData = { id: 'b1', type: 'text', position: 0, parentId: null, protected: false, data: {} };
  renderer.renderBlock(blockData);
  
  Assert.strictEqual(container.children.length, 1);
  const element = container.querySelector('[data-block-id="b1"]');
  Assert.isDefined(element);
  Assert.isTrue(element.classList.contains('document-block'));
});

suite.test('removeBlock removes block from DOM', () => {
  const container = document.createElement('div');
  const renderer = new DocumentRenderer(suite.blockRenderer, container);
  const doc = new Document({
    id: '1',
    title: 'Test',
    blocks: [
      { id: 'b1', type: 'text', position: 0, parentId: null, protected: false, data: {} }
    ]
  });
  
  renderer.render(doc);
  Assert.strictEqual(container.children.length, 1);
  
  renderer.removeBlock('b1');
  Assert.strictEqual(container.children.length, 0);
});

suite.test('updateBlock replaces existing block element', () => {
  const container = document.createElement('div');
  const renderer = new DocumentRenderer(suite.blockRenderer, container);
  const doc = new Document({
    id: '1',
    title: 'Test',
    blocks: [
      { id: 'b1', type: 'text', position: 0, parentId: null, protected: false, data: {} }
    ]
  });
  
  renderer.render(doc);
  const oldElement = container.querySelector('[data-block-id="b1"]');
  
  renderer.updateBlock({ id: 'b1', type: 'text', position: 0, parentId: null, protected: false, data: {} });
  const newElement = container.querySelector('[data-block-id="b1"]');
  
  Assert.isDefined(newElement);
  Assert.isTrue(oldElement !== newElement, 'Elements should be different');
});

suite.test('getBlockElement returns correct element', () => {
  const container = document.createElement('div');
  const renderer = new DocumentRenderer(suite.blockRenderer, container);
  const doc = new Document({
    id: '1',
    title: 'Test',
    blocks: [
      { id: 'b1', type: 'text', position: 0, parentId: null, protected: false, data: {} }
    ]
  });
  
  renderer.render(doc);
  const element = renderer.getBlockElement('b1');
  
  Assert.isDefined(element);
  Assert.strictEqual(element.dataset.blockId, 'b1');
});

suite.test('clear removes all blocks', () => {
  const container = document.createElement('div');
  const renderer = new DocumentRenderer(suite.blockRenderer, container);
  const doc = new Document({
    id: '1',
    title: 'Test',
    blocks: [
      { id: 'b1', type: 'text', position: 0, parentId: null, protected: false, data: {} },
      { id: 'b2', type: 'text', position: 1, parentId: null, protected: false, data: {} }
    ]
  });
  
  renderer.render(doc);
  Assert.strictEqual(container.children.length, 2);
  Assert.isDefined(renderer.getBlockElement('b1'));
  Assert.isDefined(renderer.getBlockElement('b2'));
  
  renderer.clear();
  Assert.strictEqual(container.children.length, 0);
  Assert.isTrue(renderer.getBlockElement('b1') === undefined, 'Block element should be undefined');
  Assert.isTrue(renderer.getBlockElement('b2') === undefined, 'Block element should be undefined');
});

suite.test('render null document clears container', () => {
  const container = document.createElement('div');
  const renderer = new DocumentRenderer(suite.blockRenderer, container);
  const doc = new Document({
    id: '1',
    title: 'Test',
    blocks: [
      { id: 'b1', type: 'text', position: 0, parentId: null, protected: false, data: {} }
    ]
  });
  
  renderer.render(doc);
  Assert.strictEqual(container.children.length, 1);
  
  renderer.render(null);
  Assert.strictEqual(container.children.length, 0);
});

export default suite;

