# Интеграция с 1С

## Обзор

Редактор включает специализированную поддержку для документирования проектов 1С:Предприятие:

1. **Monaco Editor с подсветкой BSL** - полноценный редактор кода с поддержкой языка 1С
2. **Ссылки на метаданные** - специальный формат ссылок на объекты конфигурации
3. **Шаблоны документов** - готовые шаблоны для ТЗ, инструкций, стандартов

---

## 1. Monaco Editor и язык BSL

### Создание блока кода с BSL

```javascript
import { CodeBlock } from './blocks/content/CodeBlock.js';

const codeBlock = new CodeBlock({
  code: `
Процедура ОбработкаДанных()
  Для Каждого Элемент Из Коллекция Цикл
    Сообщить(Элемент.Наименование);
  КонецЦикла;
КонецПроцедуры
  `,
  language: 'bsl', // или '1c' - автоматически нормализуется к 'bsl'
  lineNumbers: true,
  readOnly: false
});

// Рендеринг
const element = codeBlock.render();
document.getElementById('container').appendChild(element);
```

### Возможности Monaco Editor для BSL

- ✅ Подсветка синтаксиса (русские и английские ключевые слова)
- ✅ Автодополнение встроенных функций 1С
- ✅ Нумерация строк
- ✅ Поддержка тем (светлая/темная)
- ✅ Folding для процедур и функций
- ✅ Комментарии (`//`)
- ✅ Строки (`"..."` и `'...'`)
- ✅ Даты

### Поддерживаемые функции (автодополнение)

**Общие:**
- `Сообщить()`, `Предупреждение()`, `ВопросДаНет()`

**Строки:**
- `СтрДлина()`, `СтрНайти()`, `СтрЗаменить()`, `ВРег()`, `НРег()`, `СокрЛП()`

**Даты:**
- `ТекущаяДата()`, `Год()`, `Месяц()`, `День()`, `НачалоГода()`, `КонецГода()`

**Типы:**
- `ТипЗнч()`, `Число()`, `Строка()`, `ЗначениеЗаполнено()`

### Программное управление редактором

```javascript
// Получение/установка кода
codeBlock.setCode('Новый код');
const code = codeBlock.getValue();

// Смена языка
await codeBlock.setLanguage('javascript');

// Смена темы
codeBlock.setTheme('dark');
```

---

## 2. Ссылки на метаданные 1С

### Формат ссылок

```
#metadata:type:name
```

Где:
- `type` - тип объекта (catalog, document, report и т.д.)
- `name` - имя объекта (латиницей)

### Примеры

```markdown
Справочник: #metadata:catalog:Nomenclature
Документ: #metadata:document:SalesInvoice
Отчет: #metadata:report:SalesReport
Обработка: #metadata:dataProcessor:DataImport
Регистр сведений: #metadata:informationRegister:Prices
```

### Поддерживаемые типы объектов

| Тип (type) | Русское название |
|------------|------------------|
| `catalog` | Справочник |
| `document` | Документ |
| `dataProcessor` | Обработка |
| `report` | Отчет |
| `informationRegister` | РегистрСведений |
| `accumulationRegister` | РегистрНакопления |
| `chartOfAccounts` | ПланСчетов |
| `businessProcess` | БизнесПроцесс |
| `constant` | Константа |
| `enum` | Перечисление |
| `commonModule` | ОбщийМодуль |

...и [еще 20+ типов](../src/integrations/metadata/MetadataLinkParser.js)

### Использование в коде

#### Парсинг ссылок

```javascript
import { MetadataLinkParser } from './integrations/metadata/MetadataLinkParser.js';

const text = 'Используется справочник #metadata:catalog:Products';
const links = MetadataLinkParser.parse(text);

console.log(links);
// [{
//   type: 'catalog',
//   name: 'Products',
//   displayName: 'Справочник.Products',
//   href: '#metadata:catalog:Products'
// }]
```

#### Создание ссылки

```javascript
const link = MetadataLinkParser.createLink('document', 'SalesInvoice');
// "#metadata:document:SalesInvoice"
```

#### Рендеринг ссылок в HTML

```javascript
import { MetadataLinkRenderer } from './integrations/metadata/MetadataLinkRenderer.js';

const renderer = new MetadataLinkRenderer();
const container = document.getElementById('content');

renderer.render(container, 'Используется #metadata:catalog:Products');
// Создаст интерактивную ссылку с tooltip
```

### Работа с реестром метаданных

```javascript
import { metadataRegistry } from './integrations/metadata/MetadataRegistry.js';

// Загрузка тестовых данных
metadataRegistry.loadMockData();

// Получение объекта
const obj = metadataRegistry.get('catalog', 'Nomenclature');

// Поиск
const results = metadataRegistry.search('product');

// Автодополнение
const suggestions = metadataRegistry.autocomplete('catalog', 'nom');
```

---

## 3. Шаблоны документов

### Встроенные шаблоны

1. **tech-spec** - Техническое задание
2. **user-manual** - Руководство пользователя
3. **coding-standard** - Стандарт кодирования
4. **business-process** - Описание бизнес-процесса

### Использование шаблонов

```javascript
import { templateManager } from './templates/TemplateManager.js';

// Инициализация (загружает встроенные шаблоны)
templateManager.initialize();

// Получение шаблона
const template = templateManager.get('tech-spec');

// Создание документа из шаблона
const doc = templateManager.createDocument('tech-spec', {
  documentTitle: 'Доработка модуля продаж',
  projectName: 'CRM 2.0',
  authorName: 'Иванов И.И.',
  date: '2025-11-04'
});

// doc содержит готовую структуру блоков с подставленными значениями
```

### Переменные в шаблонах

Формат: `{{variableName}}`

```javascript
{
  type: 'text',
  data: {
    text: 'Автор: {{authorName}}, Дата: {{date}}'
  }
}
```

### Создание кастомного шаблона

```javascript
const customTemplate = templateManager.saveCustomTemplate({
  name: 'Инструкция по настройке',
  category: 'instructions',
  description: 'Шаблон для инструкций по настройке',
  blocks: [
    {
      type: 'header',
      data: {
        title: '{{title}}',
        subtitle: 'Инструкция'
      }
    },
    {
      type: 'section',
      data: {
        title: '1. Описание',
        level: 1
      }
    },
    {
      type: 'text',
      data: {
        text: '{{description}}'
      }
    },
    {
      type: 'code',
      data: {
        code: '{{codeExample}}',
        language: 'bsl'
      }
    }
  ],
  variables: {
    title: { 
      type: 'string', 
      required: true,
      label: 'Заголовок' 
    },
    description: { 
      type: 'string', 
      required: true,
      label: 'Описание'
    },
    codeExample: { 
      type: 'string', 
      required: false,
      label: 'Пример кода'
    }
  }
});

// Использование
const doc = templateManager.createDocument(customTemplate.id, {
  title: 'Настройка обмена данными',
  description: 'Инструкция по настройке обмена с внешней системой',
  codeExample: 'Процедура ОбменДанными()\n  // Код\nКонецПроцедуры'
});
```

### Галерея шаблонов

```javascript
// Получить все шаблоны
const allTemplates = templateManager.getAll();

// Получить по категории
const specs = templateManager.getByCategory('specifications');
const docs = templateManager.getByCategory('documentation');

// Поиск
const found = templateManager.search('техническое');
```

---

## 4. Полный пример интеграции

```javascript
import { CodeBlock } from './blocks/content/CodeBlock.js';
import { MetadataLinkParser } from './integrations/metadata/MetadataLinkParser.js';
import { metadataRegistry } from './integrations/metadata/MetadataRegistry.js';
import { templateManager } from './templates/TemplateManager.js';

// 1. Инициализация
metadataRegistry.loadMockData();
templateManager.initialize();

// 2. Создание документа из шаблона
const doc = templateManager.createDocument('tech-spec', {
  documentTitle: 'Доработка справочника Номенклатура',
  projectName: 'Управление складом',
  authorName: 'Петров П.П.',
  date: new Date().toISOString().split('T')[0]
});

// 3. Добавление блока с ссылкой на метаданные
doc.blocks.push({
  type: 'text',
  data: {
    text: `Изменения касаются объекта #metadata:catalog:Nomenclature`
  }
});

// 4. Добавление блока кода
const codeBlock = new CodeBlock({
  code: `
Процедура ПриЗаписи(Отказ)
  Если НЕ ЗначениеЗаполнено(Наименование) Тогда
    Сообщить("Не заполнено наименование!");
    Отказ = Истина;
  КонецЕсли;
КонецПроцедуры
  `,
  language: 'bsl',
  lineNumbers: true
});

doc.blocks.push(codeBlock.toJSON());

// 5. Парсинг всех ссылок на метаданные
const allLinks = [];
doc.blocks.forEach(block => {
  if (block.data && block.data.text) {
    const links = MetadataLinkParser.parse(block.data.text);
    allLinks.push(...links);
  }
});

console.log('Найдено ссылок на метаданные:', allLinks.length);

// 6. Рендеринг документа
// ... (используйте BlockRenderer или DocumentRenderer)
```

---

## 5. API Reference

### MonacoCodeEditor

```typescript
class MonacoCodeEditor {
  constructor(container: HTMLElement, options: {
    value?: string;
    language?: string;
    theme?: 'vs' | 'vs-dark';
    readOnly?: boolean;
    lineNumbers?: boolean;
    minimap?: boolean;
  });
  
  async initialize(): Promise<void>;
  getValue(): string;
  setValue(value: string): void;
  async setLanguage(language: string): Promise<void>;
  setTheme(theme: string): void;
  focus(): void;
  dispose(): void;
  onDidChangeContent(callback: Function): void;
}
```

### MetadataLinkParser

```typescript
class MetadataLinkParser {
  static isMetadataLink(href: string): boolean;
  static parseLink(href: string): MetadataLink | null;
  static parse(text: string): MetadataLink[];
  static createLink(type: string, name: string): string;
  static getDisplayName(type: string, name: string): string;
  static renderLinks(text: string, renderer?: Function): string;
}
```

### TemplateManager

```typescript
class TemplateManager {
  initialize(): void;
  get(id: string): Template | null;
  getAll(): Template[];
  getByCategory(category: string): Template[];
  search(query: string): Template[];
  createDocument(templateId: string, variables: Object): Object;
  saveCustomTemplate(data: Object): Template;
  delete(id: string): boolean;
}
```

---

## 6. Расширение функционала

### Добавление новых типов метаданных

```javascript
// В MetadataLinkParser.js
MetadataLinkParser.METADATA_TYPES['customType'] = 'Кастомный тип';
```

### Регистрация дополнительных функций BSL

```javascript
// В OneCLanguageConfig.js
oneCLanguageConfig.completionItems.push({
  label: 'МояФункция',
  kind: 'Function',
  insertText: 'МояФункция(${1:Параметр})',
  documentation: 'Описание функции'
});
```

### Создание собственных шаблонов программно

```javascript
const myTemplate = new Template({
  id: 'my-template',
  name: 'Мой шаблон',
  category: 'custom',
  blocks: [/* ... */],
  variables: {/* ... */}
});

templateManager.register(myTemplate);
```

---

## Тестирование

Все компоненты покрыты unit и integration тестами:

- `tests/unit/integrations/monaco-loader.test.js`
- `tests/unit/integrations/metadata-link-parser.test.js`
- `tests/unit/integrations/metadata-registry.test.js`
- `tests/unit/templates/template.test.js`
- `tests/unit/templates/template-manager.test.js`
- `tests/integration/1c-integration.test.js`

Запуск тестов: откройте `testrunner.html` в браузере.

