import { TestSuite } from '../../test-framework/TestSuite.js';
import { Assert } from '../../test-framework/Assert.js';
import { initializeBlocks } from '../../../src/blocks/initializeBlocks.js';
import { BlockRegistry } from '../../../src/blocks/base/BlockRegistry.js';
import { BlockFactory } from '../../../src/blocks/base/BlockFactory.js';
import { BlockRenderer } from '../../../src/blocks/base/BlockRenderer.js';

const suite = new TestSuite('Blocks/initializeBlocks');

suite.test('returns registry, factory, and renderer', () => {
  const result = initializeBlocks();
  
  Assert.isDefined(result.registry);
  Assert.isDefined(result.factory);
  Assert.isDefined(result.renderer);
  
  Assert.isTrue(result.registry instanceof BlockRegistry);
  Assert.isTrue(result.factory instanceof BlockFactory);
  Assert.isTrue(result.renderer instanceof BlockRenderer);
});

suite.test('registers all content block types', () => {
  const { registry } = initializeBlocks();
  
  Assert.isDefined(registry.get('text'));
  Assert.isDefined(registry.get('quote'));
  Assert.isDefined(registry.get('code'));
  Assert.isDefined(registry.get('image'));
  Assert.isDefined(registry.get('table'));
  Assert.isDefined(registry.get('checklist'));
  Assert.isDefined(registry.get('steps'));
  Assert.isDefined(registry.get('diagram'));
  Assert.isDefined(registry.get('plantuml'));
  Assert.isDefined(registry.get('comparison'));
  Assert.isDefined(registry.get('definition'));
  Assert.isDefined(registry.get('action'));
  Assert.isDefined(registry.get('roles'));
});

suite.test('registers all structure block types', () => {
  const { registry } = initializeBlocks();
  
  Assert.isDefined(registry.get('section'));
  Assert.isDefined(registry.get('header'));
  Assert.isDefined(registry.get('footer'));
  Assert.isDefined(registry.get('toc'));
});

suite.test('factory can create registered blocks', () => {
  const { factory } = initializeBlocks();
  
  const textBlock = factory.create({
    id: 'b1',
    type: 'text',
    position: 0,
    parentId: null,
    protected: false,
    data: { text: 'Test' }
  });
  
  Assert.isDefined(textBlock);
  Assert.strictEqual(textBlock.type, 'text');
});

suite.test('renderer can render blocks', () => {
  const { renderer } = initializeBlocks();
  
  const blockData = {
    id: 'b1',
    type: 'text',
    position: 0,
    parentId: null,
    protected: false,
    data: { text: 'Test' }
  };
  
  const element = renderer.render(blockData);
  
  Assert.isDefined(element);
  Assert.isTrue(element instanceof HTMLElement);
  Assert.strictEqual(element.dataset.blockId, 'b1');
});

suite.test('renderer can render multiple blocks', () => {
  const { renderer } = initializeBlocks();
  const container = document.createElement('div');
  
  const blocks = [
    {
      id: 'b1',
      type: 'text',
      position: 0,
      parentId: null,
      protected: false,
      data: { text: 'First' }
    },
    {
      id: 'b2',
      type: 'text',
      position: 1,
      parentId: null,
      protected: false,
      data: { text: 'Second' }
    }
  ];
  
  renderer.renderAll(blocks, container);
  
  Assert.strictEqual(container.children.length, 2);
  Assert.strictEqual(container.querySelector('[data-block-id="b1"]').dataset.blockId, 'b1');
  Assert.strictEqual(container.querySelector('[data-block-id="b2"]').dataset.blockId, 'b2');
});

suite.test('returns different instances on multiple calls', () => {
  const result1 = initializeBlocks();
  const result2 = initializeBlocks();
  
  // Каждый вызов создает новые экземпляры
  Assert.isTrue(result1.registry !== result2.registry, 'Registries should be different');
  Assert.isTrue(result1.factory !== result2.factory, 'Factories should be different');
  Assert.isTrue(result1.renderer !== result2.renderer, 'Renderers should be different');
});

export default suite;

