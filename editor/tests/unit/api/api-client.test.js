import { TestSuite } from '../../test-framework/TestSuite.js';
import { Assert } from '../../test-framework/Assert.js';
import { ApiClient } from '../../../src/api/ApiClient.js';

const suite = new TestSuite('API/ApiClient');

suite.test('create client with base URL', () => {
  const client = new ApiClient('/api/v1');
  Assert.isDefined(client.baseUrl);
  Assert.strictEqual(client.baseUrl, '/api/v1');
});

export default suite;

