import { TestSuite } from '../../../test-framework/TestSuite.js';
import { Assert } from '../../../test-framework/Assert.js';
import { Button } from '../../../../src/ui/components/Button.js';

const suite = new TestSuite('UI/Components/Button');

suite.test('render button with text', () => {
  const btn = new Button({ text: 'Click me' });
  const el = btn.render();
  Assert.isTrue(el.textContent.includes('Click me'));
});

suite.test('button click handler', () => {
  let clicked = false;
  const btn = new Button({ text: 'Test', onClick: () => { clicked = true; } });
  const el = btn.render();
  el.click();
  Assert.isTrue(clicked);
});

export default suite;

