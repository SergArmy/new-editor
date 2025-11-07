import { TestSuite } from '../../../test-framework/TestSuite.js';
import { Assert } from '../../../test-framework/Assert.js';
import { Toolbar } from '../../../../src/ui/toolbar/Toolbar.js';
import { ToolbarGroup } from '../../../../src/ui/toolbar/ToolbarGroup.js';

const suite = new TestSuite('UI/Toolbar/Toolbar');

suite.test('render toolbar with groups', () => {
  const toolbar = new Toolbar();
  const group = new ToolbarGroup();
  toolbar.addGroup(group);
  const el = toolbar.render();
  Assert.isTrue(el.classList.contains('toolbar'));
});

export default suite;

