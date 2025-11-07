import { TestSuite } from '../../test-framework/TestSuite.js';
import { Assert } from '../../test-framework/Assert.js';
import { EditorCore } from '../../../src/editor/EditorCore.js';
import { Document } from '../../../src/document/Document.js';
import { StateManager } from '../../../src/core/state/StateManager.js';
import { HistoryManager } from '../../../src/core/history/HistoryManager.js';
import { createEventBus } from '../../../src/core/events/index.js';
import { BlockRenderer } from '../../../src/blocks/base/BlockRenderer.js';
import { BlockFactory } from '../../../src/blocks/base/BlockFactory.js';
import { BlockRegistry } from '../../../src/blocks/base/BlockRegistry.js';
import { Block } from '../../../src/blocks/base/Block.js';

const suite = new TestSuite('Editor/EditorCore');

let container, dependencies, blockRenderer;

suite.beforeEach(() => {
  container = document.createElement('div');
  
  // Создаем минимальную инфраструктуру
  const registry = new BlockRegistry();
  registry.register('text', Block);
  const factory = new BlockFactory(registry);
  blockRenderer = new BlockRenderer(factory);
  
  const stateManager = new StateManager({});
  const historyManager = new HistoryManager(stateManager);
  const eventBus = createEventBus();
  
  dependencies = {
    stateManager,
    historyManager,
    eventBus,
    blockRenderer
  };
});

suite.test('initialize clears container', () => {
  container.innerHTML = '<div>test</div>';
  const editor = new EditorCore(dependencies, container);
  
  editor.initialize();
  
  Assert.strictEqual(container.innerHTML, '');
});

suite.test('initialize emits editor:initialized event', () => {
  let eventEmitted = false;
  let eventData = null;
  
  dependencies.eventBus.on('editor:initialized', (data) => {
    eventEmitted = true;
    eventData = data;
  });
  
  const editor = new EditorCore(dependencies, container);
  editor.initialize();
  
  Assert.isTrue(eventEmitted);
  Assert.isDefined(eventData);
});

suite.test('initialize with document loads document', () => {
  const doc = new Document({
    id: '1',
    title: 'Test',
    blocks: [
      { id: 'b1', type: 'text', position: 0, parentId: null, protected: false, data: {} }
    ]
  });
  
  const editor = new EditorCore(dependencies, container);
  editor.initialize(doc);
  
  Assert.strictEqual(editor.getDocument(), doc);
  Assert.isDefined(editor.getRenderer());
});

suite.test('loadDocument renders document', () => {
  const doc = new Document({
    id: '1',
    title: 'Test',
    blocks: [
      { id: 'b1', type: 'text', position: 0, parentId: null, protected: false, data: {} }
    ]
  });
  
  const editor = new EditorCore(dependencies, container);
  editor.initialize();
  
  editor.loadDocument(doc);
  
  Assert.strictEqual(editor.getDocument(), doc);
  Assert.isTrue(container.querySelector('[data-block-id="b1"]') !== null);
});

suite.test('loadDocument emits document:loaded event', () => {
  let eventEmitted = false;
  let loadedDoc = null;
  
  dependencies.eventBus.on('document:loaded', ({ document }) => {
    eventEmitted = true;
    loadedDoc = document;
  });
  
  const doc = new Document({
    id: '1',
    title: 'Test',
    blocks: []
  });
  
  const editor = new EditorCore(dependencies, container);
  editor.initialize();
  editor.loadDocument(doc);
  
  Assert.isTrue(eventEmitted);
  Assert.strictEqual(loadedDoc, doc);
});

suite.test('getDocument returns null when no document loaded', () => {
  const editor = new EditorCore(dependencies, container);
  editor.initialize();
  
  Assert.isNull(editor.getDocument());
});

suite.test('getRenderer returns null when not initialized', () => {
  const editor = new EditorCore(dependencies, container);
  
  Assert.isNull(editor.getRenderer());
});

suite.test('getRenderer returns renderer after initialization', () => {
  const doc = new Document({
    id: '1',
    title: 'Test',
    blocks: []
  });
  
  const editor = new EditorCore(dependencies, container);
  editor.initialize(doc);
  
  const renderer = editor.getRenderer();
  Assert.isDefined(renderer);
  Assert.isTrue(renderer instanceof Object);
});

suite.test('destroy clears container and resets state', () => {
  const doc = new Document({
    id: '1',
    title: 'Test',
    blocks: [
      { id: 'b1', type: 'text', position: 0, parentId: null, protected: false, data: {} }
    ]
  });
  
  const editor = new EditorCore(dependencies, container);
  editor.initialize(doc);
  
  Assert.isDefined(editor.getDocument());
  Assert.isDefined(editor.getRenderer());
  
  editor.destroy();
  
  Assert.isNull(editor.getDocument());
  Assert.isNull(editor.getRenderer());
  Assert.strictEqual(container.innerHTML, '');
});

suite.test('initialize without blockRenderer still works', () => {
  const depsWithoutRenderer = {
    ...dependencies,
    blockRenderer: null
  };
  
  const editor = new EditorCore(depsWithoutRenderer, container);
  
  // Не должно выбрасывать ошибку
  editor.initialize();
  
  Assert.isNull(editor.getRenderer());
});

suite.test('loadDocument without blockRenderer does not crash', () => {
  const depsWithoutRenderer = {
    ...dependencies,
    blockRenderer: null
  };
  
  const doc = new Document({
    id: '1',
    title: 'Test',
    blocks: []
  });
  
  const editor = new EditorCore(depsWithoutRenderer, container);
  editor.initialize();
  
  // Не должно выбрасывать ошибку
  editor.loadDocument(doc);
  
  Assert.strictEqual(editor.getDocument(), doc);
});

suite.test('autoSaveManager schedules save on block events', () => {
  const autoSaveCalls = [];
  const autoSaveManager = {
    scheduleSave(provider) {
      autoSaveCalls.push(provider);
    }
  };

  const depsWithAutoSave = {
    ...dependencies,
    autoSaveManager
  };

  const doc = new Document({
    id: 'doc-auto-1',
    title: 'AutoSave',
    blocks: [
      { id: 'block-1', type: 'text', position: 0, parentId: null, protected: false, data: { text: 'initial' } }
    ]
  });

  const editor = new EditorCore(depsWithAutoSave, container);
  editor.initialize(doc);

  dependencies.eventBus.emit('block:updated', { blockId: 'block-1', data: { text: 'changed' } });

  Assert.strictEqual(autoSaveCalls.length, 1);
  const payload = autoSaveCalls[0]();
  Assert.strictEqual(payload.id, doc.id);
  Assert.strictEqual(payload.content.blocks.length, doc.blocks.length);
});

suite.test('undo removes newly created block', () => {
  const doc = new Document({
    id: '1',
    title: 'Test',
    blocks: []
  });

  const editor = new EditorCore(dependencies, container);
  editor.initialize(doc);

  const initialCount = doc.blocks.length;
  editor.createBlock({ type: 'text' });

  Assert.strictEqual(doc.blocks.length, initialCount + 1);

  const undoResult = editor.undo();
  Assert.isTrue(undoResult);
  Assert.strictEqual(doc.blocks.length, initialCount);
});

suite.test('redo re-applies last undone command', () => {
  const doc = new Document({
    id: '1',
    title: 'Test',
    blocks: []
  });

  const editor = new EditorCore(dependencies, container);
  editor.initialize(doc);

  const createdBlockId = editor.createBlock({ type: 'text' });
  Assert.isDefined(doc.getBlock(createdBlockId));

  editor.undo();
  Assert.strictEqual(doc.getBlock(createdBlockId), undefined);

  const redoResult = editor.redo();
  Assert.isTrue(redoResult);
  Assert.isDefined(doc.getBlock(createdBlockId));
});

suite.test('undo and redo emit history events', () => {
  const doc = new Document({
    id: '1',
    title: 'Test',
    blocks: []
  });

  let undoEmitted = false;
  let redoEmitted = false;

  dependencies.eventBus.on('history:undo', () => {
    undoEmitted = true;
  });
  dependencies.eventBus.on('history:redo', () => {
    redoEmitted = true;
  });

  const editor = new EditorCore(dependencies, container);
  editor.initialize(doc);

  editor.createBlock({ type: 'text' });
  editor.undo();
  Assert.isTrue(undoEmitted);

  editor.redo();
  Assert.isTrue(redoEmitted);
});

suite.test('moveBlock updates position and supports undo/redo', () => {
  const doc = new Document({
    id: '1',
    title: 'Test',
    blocks: [
      { id: 'b1', type: 'text', position: 0, parentId: null, protected: false, data: {} },
      { id: 'b2', type: 'text', position: 1, parentId: null, protected: false, data: {} }
    ]
  });

  const editor = new EditorCore(dependencies, container);
  editor.initialize(doc);

  editor.moveBlock('b1', 2);
  Assert.strictEqual(doc.getBlock('b1').position, 2);

  editor.undo();
  Assert.strictEqual(doc.getBlock('b1').position, 0);

  editor.redo();
  Assert.strictEqual(doc.getBlock('b1').position, 2);
});

suite.test('moveBlock updates parentId and restores on undo', () => {
  const doc = new Document({
    id: '1',
    title: 'Test',
    blocks: [
      { id: 'section-1', type: 'section', position: 0, parentId: null, protected: false, data: {} },
      { id: 'b1', type: 'text', position: 1, parentId: null, protected: false, data: {} }
    ]
  });

  const editor = new EditorCore(dependencies, container);
  editor.initialize(doc);

  editor.moveBlock('b1', 0.5, 'section-1');
  Assert.strictEqual(doc.getBlock('b1').parentId, 'section-1');

  editor.undo();
  Assert.strictEqual(doc.getBlock('b1').parentId, null);
});

export default suite;

