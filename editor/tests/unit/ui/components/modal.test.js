import { TestSuite } from '../../../test-framework/TestSuite.js';
import { Assert } from '../../../test-framework/Assert.js';
import { Modal } from '../../../../src/ui/components/Modal.js';

const suite = new TestSuite('UI/Components/Modal');

suite.test('render modal with title', () => {
  const modal = new Modal({ title: 'Test Modal' });
  const el = modal.render();
  Assert.isTrue(el.innerHTML.includes('Test Modal'));
});

export default suite;

