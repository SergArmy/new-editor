import { TestSuite } from '../../test-framework/TestSuite.js';
import { Assert } from '../../test-framework/Assert.js';
import { TextStyler } from '../../../src/formatting/TextStyler.js';

const suite = new TestSuite('Formatting/TextStyler');

suite.test('apply color style', () => {
  const result = TextStyler.apply('text', { color: '#ff0000' });
  Assert.isTrue(result.includes('color: #ff0000'));
});

export default suite;

