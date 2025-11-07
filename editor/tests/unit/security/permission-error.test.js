import { TestSuite } from '../../../test-framework/TestSuite.js';
import { Assert } from '../../../test-framework/Assert.js';
import { PermissionError } from '../../../../src/security/PermissionError.js';

const suite = new TestSuite('Security/PermissionError');

suite.test('should create permission error with default code', () => {
  const error = new PermissionError('Access denied');
  Assert.strictEqual(error.message, 'Access denied');
  Assert.strictEqual(error.code, 'PERMISSION_DENIED');
  Assert.strictEqual(error.name, 'PermissionError');
});

suite.test('should create permission error with custom code', () => {
  const error = new PermissionError('Block protected', 'BLOCK_PROTECTED', { blockId: 'block1' });
  Assert.strictEqual(error.message, 'Block protected');
  Assert.strictEqual(error.code, 'BLOCK_PROTECTED');
  Assert.strictEqual(error.details.blockId, 'block1');
});

suite.test('should be instance of Error', () => {
  const error = new PermissionError('Test');
  Assert.isTrue(error instanceof Error);
});

export default suite;

