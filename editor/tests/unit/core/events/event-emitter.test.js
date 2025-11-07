import { TestSuite } from '../../../test-framework/TestSuite.js';
import { Assert } from '../../../test-framework/Assert.js';
import { EventEmitter } from '../../../../src/core/events/EventEmitter.js';

const suite = new TestSuite('Events/EventEmitter');

suite.test('subscribe and emit', () => {
  const ee = new EventEmitter();
  let called = 0;
  ee.on('ping', (d) => { if (d === 1) called++; });
  const n = ee.emit('ping', 1);
  Assert.strictEqual(n, 1);
  Assert.strictEqual(called, 1);
});

suite.test('unsubscribe', () => {
  const ee = new EventEmitter();
  let called = 0;
  const off = ee.on('ping', () => { called++; });
  off();
  ee.emit('ping');
  Assert.strictEqual(called, 0);
});

export default suite;


