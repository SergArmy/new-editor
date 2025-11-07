import { TestSuite } from '../../../test-framework/TestSuite.js';
import { Assert } from '../../../test-framework/Assert.js';
import { EditorError } from '../../../../src/core/errors/EditorError.js';

const suite = new TestSuite('Core/Errors/EditorError');

suite.test('create error with code and details', () => {
  const err = new EditorError('Test error', 'TEST_CODE', { key: 'value' });
  Assert.strictEqual(err.message, 'Test error');
  Assert.strictEqual(err.code, 'TEST_CODE');
  Assert.strictEqual(err.details.key, 'value');
});

export default suite;

