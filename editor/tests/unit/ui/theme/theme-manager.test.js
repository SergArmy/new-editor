import { TestSuite } from '../../../test-framework/TestSuite.js';
import { Assert } from '../../../test-framework/Assert.js';
import { ThemeManager } from '../../../../src/ui/theme/ThemeManager.js';
import { lightTheme, darkTheme } from '../../../../src/ui/theme/themes/index.js';

const suite = new TestSuite('UI/Theme/ThemeManager');

suite.test('register and set theme', () => {
  const tm = new ThemeManager();
  tm.registerTheme('light', lightTheme);
  tm.registerTheme('dark', darkTheme);
  tm.setTheme('dark');
  Assert.strictEqual(tm.getTheme(), 'dark');
});

export default suite;

