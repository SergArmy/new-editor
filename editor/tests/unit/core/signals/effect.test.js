import { TestSuite } from '../../../test-framework/TestSuite.js';
import { Assert } from '../../../test-framework/Assert.js';
import { Signal } from '../../../../src/core/signals/Signal.js';
import { effect } from '../../../../src/core/signals/Effect.js';

const suite = new TestSuite('Core/Signals/Effect');

suite.test('runs once and on deps change', () => {
  const a = new Signal(1);
  let runs = 0;
  const stop = effect(() => { runs++; }, [a]);
  a.value = 2;
  a.value = 3;
  Assert.strictEqual(runs, 3); // initial + two changes
  stop();
});

suite.test('cleanup function is called before next run', () => {
  const a = new Signal(0);
  let cleaned = 0;
  const stop = effect(() => {
    return () => { cleaned++; };
  }, [a]);
  a.value = 1;
  a.value = 2;
  Assert.strictEqual(cleaned, 2);
  stop();
});

export default suite;


