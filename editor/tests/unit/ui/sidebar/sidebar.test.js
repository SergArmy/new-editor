import { TestSuite } from '../../../test-framework/TestSuite.js';
import { Assert } from '../../../test-framework/Assert.js';
import { Sidebar } from '../../../../src/ui/sidebar/Sidebar.js';

const suite = new TestSuite('UI/Sidebar/Sidebar');

suite.test('render sidebar', () => {
  const sidebar = new Sidebar();
  const el = sidebar.render();
  Assert.isTrue(el.classList.contains('sidebar'));
});

export default suite;

