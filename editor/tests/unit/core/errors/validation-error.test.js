import { TestSuite } from '../../../test-framework/TestSuite.js';
import { Assert } from '../../../test-framework/Assert.js';
import { ValidationError } from '../../../../src/core/errors/ValidationError.js';

const suite = new TestSuite('Core/Errors/ValidationError');

suite.test('create validation error with errors array', () => {
  const err = new ValidationError('Validation failed', ['field1: required', 'field2: invalid']);
  Assert.strictEqual(err.code, 'VALIDATION_ERROR');
  Assert.strictEqual(err.errors.length, 2);
});

export default suite;

