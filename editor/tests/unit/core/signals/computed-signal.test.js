import { TestSuite } from '../../../test-framework/TestSuite.js';
import { Assert } from '../../../test-framework/Assert.js';
import { Signal } from '../../../../src/core/signals/Signal.js';
import { ComputedSignal } from '../../../../src/core/signals/ComputedSignal.js';

const suite = new TestSuite('Core/Signals/ComputedSignal');

suite.test('computes from dependencies and updates on change', () => {
  const a = new Signal(2);
  const b = new Signal(3);
  const sum = new ComputedSignal(() => a.value + b.value, [a, b]);
  Assert.strictEqual(sum.value, 5);
  b.value = 5;
  Assert.strictEqual(sum.value, 7);
});

suite.test('notifies subscribers on recompute', () => {
  const a = new Signal(1);
  const double = new ComputedSignal(() => a.value * 2, [a]);
  let notified = 0;
  double.subscribe(v => { if (v === 4) notified++; });
  a.value = 2;
  Assert.strictEqual(notified, 1);
});

export default suite;


