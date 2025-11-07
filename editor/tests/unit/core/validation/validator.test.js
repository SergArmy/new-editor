import { TestSuite } from '../../../test-framework/TestSuite.js';
import { Assert } from '../../../test-framework/Assert.js';
import { Validator } from '../../../../src/core/validation/Validator.js';

const suite = new TestSuite('Core/Validation/Validator');

suite.test('validate with rules', () => {
  const { valid, errors } = Validator.validate('test', [
    Validator.required,
    Validator.length(3, 10)
  ]);
  Assert.isTrue(valid);
});

suite.test('validate fails with invalid value', () => {
  const { valid, errors } = Validator.validate('', [Validator.required]);
  Assert.isFalse(valid);
  Assert.isTrue(errors.length > 0);
});

export default suite;

