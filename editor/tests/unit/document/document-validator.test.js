import { TestSuite } from '../../test-framework/TestSuite.js';
import { Assert } from '../../test-framework/Assert.js';
import { DocumentValidator } from '../../../src/document/DocumentValidator.js';

const suite = new TestSuite('Document/DocumentValidator');

suite.test('valid document passes', () => {
  const data = {
    id: '1',
    title: 'Test',
    version: 1,
    content: { blocks: [{ id: 'b1', type: 'text', position: 0, data: {} }] }
  };
  const { valid } = DocumentValidator.validate(data);
  Assert.isTrue(valid);
});

suite.test('invalid document fails', () => {
  const { valid, errors } = DocumentValidator.validate({});
  Assert.isFalse(valid);
  Assert.isTrue(errors.length > 0);
});

export default suite;

