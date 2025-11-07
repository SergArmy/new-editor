import { TestSuite } from '../../../test-framework/TestSuite.js';
import { Assert } from '../../../test-framework/Assert.js';
import { StateError } from '../../../../src/core/errors/StateError.js';

const suite = new TestSuite('Core/Errors/StateError');

suite.test('create state error with state', () => {
  const err = new StateError('State error', { count: 0 });
  Assert.strictEqual(err.code, 'STATE_ERROR');
  Assert.strictEqual(err.state.count, 0);
});

export default suite;

