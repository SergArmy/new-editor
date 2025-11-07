import { TestSuite } from '../../../test-framework/TestSuite.js';
import { Assert } from '../../../test-framework/Assert.js';
import { createContainer } from '../../../../src/core/di/index.js';

const suite = new TestSuite('DI/Container');

suite.test('register and resolve value', () => {
  const c = createContainer();
  c.register('answer', () => 42);
  Assert.strictEqual(c.resolve('answer'), 42);
});

suite.test('singleton instances by default', () => {
  const c = createContainer();
  let n = 0;
  c.register('counter', () => ({ id: ++n }));
  const a = c.resolve('counter');
  const b = c.resolve('counter');
  Assert.strictEqual(a, b);
});

export default suite;


