import { TestSuite } from '../../../test-framework/TestSuite.js';
import { Assert } from '../../../test-framework/Assert.js';
import { BoldCommand } from '../../../../src/commands/format-commands/BoldCommand.js';

const suite = new TestSuite('Commands/FormatCommands/BoldCommand');

suite.test('execute bold format', () => {
  let formatted = false;
  const cmd = new BoldCommand(
    'b1',
    0,
    5,
    (id, start, end, format) => {
      formatted = format.bold === true;
      return { bold: false };
    }
  );
  cmd.execute({});
  Assert.isTrue(formatted);
});

export default suite;

