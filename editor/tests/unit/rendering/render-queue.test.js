import { TestSuite } from '../../test-framework/TestSuite.js';
import { Assert } from '../../test-framework/Assert.js';
import { RenderQueue } from '../../../src/rendering/RenderQueue.js';

const suite = new TestSuite('Rendering/RenderQueue');

suite.test('tasks run in priority order', async () => {
  const rq = new RenderQueue();
  const order = [];
  rq.add(() => order.push('normal'), 'normal');
  rq.add(() => order.push('high'), 'high');
  rq.add(() => order.push('critical'), 'critical');
  await new Promise(r => setTimeout(r, 30));
  Assert.strictEqual(order[0], 'critical');
  Assert.strictEqual(order[1], 'high');
});

export default suite;


