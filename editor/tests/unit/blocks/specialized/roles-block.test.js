import { TestSuite } from '../../../test-framework/TestSuite.js';
import { Assert } from '../../../test-framework/Assert.js';
import { RolesBlock } from '../../../../src/blocks/specialized/RolesBlock.js';
import { getRolesRegistry } from '../../../../src/registry/RolesRegistry.js';

const suite = new TestSuite('Blocks/Specialized/RolesBlock');

suite.beforeEach(() => {
  getRolesRegistry().clear();
});

suite.test('renders roles with colored badges and contact info', () => {
  const block = new RolesBlock({
    id: 'roles-1',
    type: 'roles',
    position: 0,
    parentId: null,
    protected: false,
    data: {
      title: 'Команда проекта',
      description: [
        'Список ключевых ролей и зон ответственности.'
      ],
      roles: [
        {
          title: 'Product Owner',
          contact: 'po@example.com',
          responsibilities: [
            'Формирует бэклог и приоритеты',
            'Согласовывает требования с заказчиком'
          ]
        },
        {
          title: 'Tech Lead',
          responsibilities: 'Контролирует техническое качество\nПроводит код-ревью'
        }
      ]
    }
  });

  const el = block.render();

  Assert.isTrue(el.classList.contains('roles-block'));
  Assert.strictEqual(el.querySelector('.roles-title').textContent, 'Команда проекта');
  Assert.strictEqual(el.querySelectorAll('.roles-description p').length, 1);
  Assert.strictEqual(el.querySelectorAll('.roles-item').length, 2);
  Assert.strictEqual(el.querySelectorAll('.roles-item-badge').length, 2);

  const badge = /** @type {HTMLSpanElement} */(el.querySelector('.roles-item-badge'));
  Assert.isDefined(badge.dataset.roleColor);
  Assert.notStrictEqual(badge.dataset.roleColor, '');

  const responsibilities = el.querySelectorAll('.roles-item-responsibilities li');
  Assert.strictEqual(responsibilities.length, 4);
});

suite.test('toJSON normalizes missing data and generates colors', () => {
  const block = new RolesBlock({
    id: 'roles-2',
    type: 'roles',
    position: 1,
    parentId: null,
    protected: false,
    data: {
      roles: [
        { contact: 'telegram:@owner', responsibilities: ['Ответственный за релиз'] },
        { title: ' ', description: ' ' },
        { title: 'Support Lead', responsibilities: 'Обработка обращений' }
      ]
    }
  });

  const json = block.toJSON();

  Assert.strictEqual(json.title, 'Роли команды');
  Assert.strictEqual(json.description.length, 0);
  Assert.strictEqual(json.roles.length, 2);
  Assert.strictEqual(json.roles[0].title, 'Роль 1');
  Assert.strictEqual(json.roles[0].contact, 'telegram:@owner');
  Assert.isTrue(json.roles[0].color.length > 0);
  Assert.strictEqual(json.roles[1].responsibilities[0], 'Обработка обращений');
});

suite.test('registry collects roles for later usage', () => {
  const block = new RolesBlock({
    id: 'roles-3',
    type: 'roles',
    position: 2,
    parentId: null,
    protected: false,
    data: {
      roles: [
        { title: 'Release Manager', color: '#123456' }
      ]
    }
  });

  const el = block.render();
  Assert.isDefined(el);

  const registry = getRolesRegistry();
  const roles = registry.getAll();
  Assert.strictEqual(roles.length, 1);
  Assert.strictEqual(roles[0].title, 'Release Manager');
  Assert.strictEqual(roles[0].color, '#123456');
});

suite.test('renders empty state when no roles provided', () => {
  const block = new RolesBlock({
    id: 'roles-4',
    type: 'roles',
    position: 3,
    parentId: null,
    protected: false,
    data: {}
  });

  const el = block.render();
  const empty = el.querySelector('.roles-empty');

  Assert.isTrue(Boolean(empty));
  Assert.strictEqual(empty.textContent, 'Роли пока не определены');
});

export default suite;


