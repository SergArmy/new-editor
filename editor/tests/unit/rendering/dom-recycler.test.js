import { TestSuite } from '../../test-framework/TestSuite.js';
import { Assert } from '../../test-framework/Assert.js';
import { DOMRecycler } from '../../../src/rendering/DOMRecycler.js';

const suite = new TestSuite('Rendering/DOMRecycler');

suite.test('acquire and release reuse elements', () => {
  const r = new DOMRecycler();
  const el1 = r.acquire('div', 'x');
  r.release(el1);
  const el2 = r.acquire('div', 'x');
  Assert.strictEqual(el1, el2);
});

export default suite;


