import { TestSuite } from '../../../test-framework/TestSuite.js';
import { Assert } from '../../../test-framework/Assert.js';
import { PlantUMLBlock } from '../../../../src/blocks/specialized/PlantUMLBlock.js';

const suite = new TestSuite('Blocks/Specialized/PlantUMLBlock');

suite.test('renders PlantUML block with metadata and source', () => {
  const block = new PlantUMLBlock({
    id: 'p1',
    type: 'plantuml',
    position: 0,
    data: {
      title: 'Компонентная диаграмма',
      description: 'Взаимодействие подсистем при запуске',
      serverUrl: 'https://plantuml.example.com',
      format: 'svg',
      renderUrl: 'https://plantuml.example.com/svg/xyz',
      source: '@startuml\nAlice -> Bob: ping\n@enduml'
    }
  });

  const el = block.render();

  Assert.isTrue(el.classList.contains('plantuml-block'));
  const titleEl = el.querySelector('.diagram-title');
  Assert.isNotNull(titleEl);
  Assert.strictEqual(titleEl.textContent, 'Компонентная диаграмма');

  const metaEl = el.querySelector('.diagram-meta');
  Assert.isNotNull(metaEl);
  Assert.strictEqual(metaEl.textContent, 'PLANTUML · SVG');

  const codeBlockEl = el.querySelector('.code-block');
  Assert.isNotNull(codeBlockEl);
  const textarea = codeBlockEl.querySelector('textarea');
  if (textarea) {
    Assert.isTrue(textarea.value.includes('Alice -> Bob'));
  } else {
    Assert.isTrue(codeBlockEl.textContent.includes('Alice -> Bob'));
  }
});

suite.test('toJSON returns PlantUML metadata', () => {
  const block = new PlantUMLBlock({
    id: 'p2',
    type: 'plantuml',
    position: 0,
    data: {
      format: 'png',
      source: '@startuml\n@enduml'
    }
  });

  const json = block.toJSON();

  Assert.strictEqual(json.format, 'png');
  Assert.isTrue(json.source.includes('@startuml'));
  Assert.strictEqual(json.title, '');
});

export default suite;


