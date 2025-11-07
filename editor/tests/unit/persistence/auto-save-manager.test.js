import { TestSuite } from '../../test-framework/TestSuite.js';
import { Assert } from '../../test-framework/Assert.js';
import { AutoSaveManager } from '../../../src/persistence/AutoSaveManager.js';

const suite = new TestSuite('Persistence/AutoSaveManager');

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

suite.test('scheduleSave triggers debounced save and updates status', async () => {
  const saved = [];
  const manager = new AutoSaveManager(async (data) => {
    saved.push(data);
  }, { interval: 10 });

  const statuses = [];
  manager.onStatusChangeSubscribe((status) => {
    statuses.push(status);
  });

  manager.scheduleSave(() => 'payload-1');
  await wait(30);

  Assert.strictEqual(saved.length, 1);
  Assert.strictEqual(saved[0], 'payload-1');
  Assert.isTrue(statuses.includes('saving'));
  Assert.strictEqual(manager.getStatus(), 'saved');
});

suite.test('saveNow flushes pending debounce', async () => {
  const saved = [];
  const manager = new AutoSaveManager(async (data) => {
    saved.push(data);
  }, { interval: 50 });

  manager.scheduleSave(() => 'from-debounce');
  await manager.saveNow();

  Assert.strictEqual(saved.length, 1);
  Assert.strictEqual(saved[0], 'from-debounce');
  Assert.strictEqual(manager.getStatus(), 'saved');
});

suite.test('saveNow with payload executes immediately', async () => {
  const saved = [];
  const manager = new AutoSaveManager(async (data) => {
    saved.push(data);
  });

  await manager.saveNow(() => 'immediate');

  Assert.strictEqual(saved.length, 1);
  Assert.strictEqual(saved[0], 'immediate');
  Assert.strictEqual(manager.getStatus(), 'saved');
});

suite.test('errors update status to error', async () => {
  const manager = new AutoSaveManager(async () => {
    throw new Error('Failed');
  });

  let errorCaught = false;
  try {
    await manager.saveNow(() => ({}));
  } catch (error) {
    errorCaught = true;
  }

  Assert.isTrue(errorCaught);
  Assert.strictEqual(manager.getStatus(), 'error');
  Assert.isTrue(manager.getLastError() instanceof Error);
});

export default suite;

