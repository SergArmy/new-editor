import { TestSuite } from '../../../test-framework/TestSuite.js';
import { Assert } from '../../../test-framework/Assert.js';
import { DeleteBlockCommand } from '../../../../src/commands/block-commands/DeleteBlockCommand.js';

const suite = new TestSuite('Commands/BlockCommands/DeleteBlockCommand');

suite.test('execute and undo delete block', () => {
  const block = { id: 'b1', type: 'text' };
  let deleted = null;
  const cmd = new DeleteBlockCommand(
    'b1',
    () => { deleted = block; return block; },
    (b) => { deleted = null; }
  );
  cmd.execute({});
  Assert.strictEqual(deleted, block);
  cmd.undo({});
  Assert.strictEqual(deleted, null);
});

export default suite;

