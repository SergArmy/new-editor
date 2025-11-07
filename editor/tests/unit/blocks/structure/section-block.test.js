import { TestSuite } from '../../../test-framework/TestSuite.js';
import { Assert } from '../../../test-framework/Assert.js';
import { SectionBlock } from '../../../../src/blocks/structure/SectionBlock.js';

const suite = new TestSuite('Blocks/Structure/SectionBlock');

suite.test('render section with level and title', () => {
  const block = new SectionBlock({ id: 's1', type: 'section', position: 0, level: 2, title: 'Test Section', data: {} });
  const el = block.render();
  Assert.isTrue(el.classList.contains('section-block'));
  Assert.isTrue(el.classList.contains('section-level-2'));
  Assert.isTrue(el.innerHTML.includes('Test Section'));
});

export default suite;

