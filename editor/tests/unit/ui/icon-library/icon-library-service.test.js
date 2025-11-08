import { TestSuite } from '../../../test-framework/TestSuite.js';
import { Assert } from '../../../test-framework/Assert.js';
import { IconLibraryService, normalizeIconValue } from '../../../../src/ui/icon-library/IconLibraryService.js';

class StubIconApi {
  constructor() {
    this.customIcons = [];
    this.additional = [
      {
        id: 'extra-actions',
        label: 'Экстра действия',
        icons: [
          { id: 'extra-flag', label: 'Флажок', value: 'fa-light fa-flag' }
        ]
      }
    ];
  }

  async getCustomIcons() {
    return this.customIcons;
  }

  async addCustomIcon(icon) {
    const saved = {
      id: `stub-${Date.now()}`,
      label: icon.label,
      value: icon.value
    };
    this.customIcons.push(saved);
    return saved;
  }

  async getAdditionalIconGroups() {
    return this.additional;
  }
}

const suite = new TestSuite('UI/IconLibrary/IconLibraryService');

suite.test('возвращает базовые группы иконок', async () => {
  const service = new IconLibraryService();
  await service.ensureInitialized();

  const groups = await service.getGroups();

  Assert.isTrue(Array.isArray(groups));
  Assert.isTrue(groups.length >= 4);
  const hasActions = groups.some(group => group.id === 'actions');
  Assert.isTrue(hasActions);
});

suite.test('добавляет пользовательские иконки и не дублирует существующие', async () => {
  const api = new StubIconApi();
  const service = new IconLibraryService({ api });
  await service.ensureInitialized();

  await service.addCustomIcon({ label: 'Маркер', value: 'fa-light fa-thumbtack' });
  // повторное добавление того же класса не создает дубликат
  await service.addCustomIcon({ label: 'Маркер', value: 'fa-light fa-thumbtack' });

  const groups = await service.getGroups();
  const customGroup = groups.find(group => group.id === 'custom');
  Assert.isDefined(customGroup);
  Assert.strictEqual(customGroup.icons.length, 1);
  Assert.strictEqual(customGroup.icons[0].value, 'fa-light fa-thumbtack');
});

suite.test('подгружает дополнительные иконки из бэкенда', async () => {
  const api = new StubIconApi();
  const service = new IconLibraryService({ api });
  await service.ensureInitialized();

  const additional = await service.fetchAdditionalGroups();
  Assert.isTrue(additional.length > 0);

  const groups = await service.getGroups();
  const extraGroup = groups.find(group => group.id === 'extra-actions');
  Assert.isDefined(extraGroup);
  const containsFlag = extraGroup.icons.some(icon => icon.value === 'fa-light fa-flag');
  Assert.isTrue(containsFlag);
});

suite.test('findIcon возвращает встроенные и пользовательские значения', async () => {
  const api = new StubIconApi();
  const service = new IconLibraryService({ api });
  await service.ensureInitialized();

  const builtin = service.findIcon('fa-light fa-gear');
  Assert.isDefined(builtin);
  Assert.strictEqual(builtin.source, 'builtin');

  await service.addCustomIcon({ label: 'Метка', value: 'fa-light fa-circle-up' });
  const custom = service.findIcon('fa-light fa-circle-up');
  Assert.isDefined(custom);
  Assert.strictEqual(custom.source, 'custom');
});

suite.test('normalizeIconValue приводит класс к fa-light и убирает конфликтующие веса', () => {
  Assert.strictEqual(normalizeIconValue('fa-solid fa-arrow-trend-up'), 'fa-light fa-arrow-trend-up');
  Assert.strictEqual(normalizeIconValue('fa-regular fa-flag fa-fw'), 'fa-light fa-flag fa-fw');
  Assert.strictEqual(normalizeIconValue('fa-light fa-gauge-high'), 'fa-light fa-gauge-high');
  Assert.strictEqual(normalizeIconValue('   '), '');
});

export default suite;


