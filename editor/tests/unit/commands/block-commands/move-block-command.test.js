import { TestSuite } from '../../../test-framework/TestSuite.js';
import { Assert } from '../../../test-framework/Assert.js';
import { MoveBlockCommand } from '../../../../src/commands/block-commands/MoveBlockCommand.js';

const suite = new TestSuite('Commands/BlockCommands/MoveBlockCommand');

suite.test('execute and undo move block', () => {
  const calls = [];
  const fromState = { position: 0, parentId: null };
  const toState = { position: 5, parentId: 'section-1' };

  const cmd = new MoveBlockCommand(
    'b1',
    fromState,
    toState,
    (id, targetState, previousState) => {
      calls.push({ id, targetState, previousState });
    }
  );

  cmd.execute({});
  Assert.strictEqual(calls.length, 1);
  Assert.strictEqual(calls[0].id, 'b1');
  Assert.strictEqual(calls[0].targetState.position, toState.position);
  Assert.strictEqual(calls[0].targetState.parentId, toState.parentId);
  Assert.strictEqual(calls[0].previousState.position, fromState.position);
  Assert.strictEqual(calls[0].previousState.parentId, fromState.parentId);

  cmd.undo({});
  Assert.strictEqual(calls.length, 2);
  Assert.strictEqual(calls[1].id, 'b1');
  Assert.strictEqual(calls[1].targetState.position, fromState.position);
  Assert.strictEqual(calls[1].targetState.parentId, fromState.parentId);
  Assert.strictEqual(calls[1].previousState.position, toState.position);
  Assert.strictEqual(calls[1].previousState.parentId, toState.parentId);
});

export default suite;

