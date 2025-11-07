import { TestSuite } from '../../../test-framework/TestSuite.js';
import { Assert } from '../../../test-framework/Assert.js';
import { SchemaValidator } from '../../../../src/core/validation/SchemaValidator.js';
import { Validator } from '../../../../src/core/validation/Validator.js';

const suite = new TestSuite('Core/Validation/SchemaValidator');

suite.test('validate object with schema', () => {
  const schema = {
    name: [Validator.required, Validator.length(2, 50)],
    email: [Validator.required]
  };
  const validator = new SchemaValidator(schema);
  const { valid } = validator.validate({ name: 'John', email: 'test@test.com' });
  Assert.isTrue(valid);
});

suite.test('validate fails with invalid schema', () => {
  const schema = { name: [Validator.required] };
  const validator = new SchemaValidator(schema);
  const { valid, errors } = validator.validate({});
  Assert.isFalse(valid);
  Assert.isTrue(errors.length > 0);
});

export default suite;

