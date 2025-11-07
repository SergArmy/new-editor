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
  Assert.strictEqual(el.querySelector('.plantuml-title').textContent, 'Компонентная диаграмма');
  Assert.strictEqual(el.querySelector('.plantuml-meta').textContent.includes('plantuml.example.com'), true);
  Assert.strictEqual(el.querySelector('.plantuml-source code').textContent.includes('Alice -> Bob'), true);
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
  Assert.strictEqual(json.source.includes('@startuml'), true);
  Assert.strictEqual(json.title, '');
});

export default suite;


