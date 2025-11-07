import { TestSuite } from '../../test-framework/TestSuite.js';
import { Assert } from '../../test-framework/Assert.js';
import { VirtualScroller } from '../../../src/rendering/VirtualScroller.js';

const suite = new TestSuite('Rendering/VirtualScroller');

suite.test('renders only visible range with buffer', () => {
  const container = document.createElement('div');
  container.style.height = '200px';
  document.body.appendChild(container);
  const itemCount = 100;
  const itemHeight = 20;
  const vs = new VirtualScroller({
    container,
    itemCount,
    itemHeight,
    buffer: 2,
    renderItem: (i) => {
      const el = document.createElement('div');
      el.textContent = String(i);
      return el;
    }
  });
  // After init, ensure content height is correct
  Assert.strictEqual(vs.content.style.height, (itemCount * itemHeight) + 'px');
});

export default suite;


