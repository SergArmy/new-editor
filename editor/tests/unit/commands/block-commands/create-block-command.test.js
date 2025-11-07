import { TestSuite } from '../../../test-framework/TestSuite.js';
import { Assert } from '../../../test-framework/Assert.js';
import { CreateBlockCommand } from '../../../../src/commands/block-commands/CreateBlockCommand.js';

const suite = new TestSuite('Commands/BlockCommands/CreateBlockCommand');

suite.test('execute and undo create block', () => {
  let createdId = null;
  const cmd = new CreateBlockCommand(
    { id: 'b1', type: 'text' },
    (data) => { createdId = data.id; return data.id; },
    (id) => { createdId = null; }
  );
  cmd.execute({});
  Assert.strictEqual(createdId, 'b1');
  cmd.undo({});
  Assert.strictEqual(createdId, null);
});

export default suite;

