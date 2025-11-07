import { TestSuite } from '../../../test-framework/TestSuite.js';
import { Assert } from '../../../test-framework/Assert.js';
import { Signal } from '../../../../src/core/signals/Signal.js';

const suite = new TestSuite('Core/Signals/Signal');

suite.test('initial value exposed via getter', () => {
  const s = new Signal(5);
  Assert.strictEqual(s.value, 5);
});

suite.test('notify subscribers on change', () => {
  const s = new Signal(0);
  let notified = 0;
  s.subscribe(v => { if (v === 1) notified++; });
  s.value = 1;
  Assert.strictEqual(notified, 1);
});

suite.test('no notify when value is same (Object.is)', () => {
  const s = new Signal(NaN);
  let notified = 0;
  s.subscribe(() => { notified++; });
  s.value = NaN; // Object.is(NaN, NaN) === true
  Assert.strictEqual(notified, 0);
});

export default suite;


