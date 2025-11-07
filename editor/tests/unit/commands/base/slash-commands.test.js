import { TestSuite } from '../../../test-framework/TestSuite.js';
import { Assert } from '../../../test-framework/Assert.js';
import { SlashCommands } from '../../../../src/commands/base/SlashCommands.js';

const suite = new TestSuite('Commands/Base/SlashCommands');

suite.test('search commands by query', () => {
  const sc = new SlashCommands();
  const results = sc.search('code');
  Assert.isTrue(results.length > 0);
  Assert.strictEqual(results[0].command, '/code');
});

suite.test('get command config', () => {
  const sc = new SlashCommands();
  const config = sc.get('/code');
  Assert.isDefined(config);
  Assert.strictEqual(config.type, 'code');
});

export default suite;

