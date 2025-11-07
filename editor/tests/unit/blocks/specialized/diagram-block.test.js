import { TestSuite } from '../../../test-framework/TestSuite.js';
import { Assert } from '../../../test-framework/Assert.js';
import { DiagramBlock } from '../../../../src/blocks/specialized/DiagramBlock.js';

const suite = new TestSuite('Blocks/Specialized/DiagramBlock');

suite.test('renders diagram with metadata and source', () => {
  const block = new DiagramBlock({
    id: 'd1',
    type: 'diagram',
    position: 0,
    data: {
      title: 'Sequence diagram',
      description: 'Основной сценарий авторизации',
      engine: 'plantuml',
      theme: 'c4',
      renderUrl: 'https://example.com/rendered.png',
      source: '@startuml\nAlice -> Bob: Hi\n@enduml'
    }
  });

  const el = block.render();

  Assert.isTrue(el.classList.contains('diagram-block'));
  Assert.strictEqual(el.querySelector('.diagram-title').textContent, 'Sequence diagram');
  Assert.strictEqual(el.querySelector('.diagram-meta').textContent, 'PLANTUML · Тема: c4');
  Assert.strictEqual(el.querySelector('.diagram-source code').textContent.includes('Alice -> Bob'), true);
});

suite.test('toJSON preserves diagram data', () => {
  const block = new DiagramBlock({
    id: 'd2',
    type: 'diagram',
    position: 0,
    data: {
      engine: 'mermaid',
      source: 'graph TD; A-->B;'
    }
  });

  const json = block.toJSON();

  Assert.strictEqual(json.engine, 'mermaid');
  Assert.strictEqual(json.source, 'graph TD; A-->B;');
  Assert.strictEqual(json.title, '');
});

export default suite;


