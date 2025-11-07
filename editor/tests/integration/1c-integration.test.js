import { TestSuite } from '../test-framework/TestSuite.js';
import { Assert } from '../test-framework/Assert.js';
import { CodeBlock } from '../../src/blocks/content/CodeBlock.js';
import { MetadataLinkParser } from '../../src/integrations/metadata/MetadataLinkParser.js';
import { metadataRegistry } from '../../src/integrations/metadata/MetadataRegistry.js';
import { templateManager } from '../../src/templates/TemplateManager.js';

const suite = new TestSuite('1C Integration', 'Integration tests for 1C features');

suite.beforeAll(() => {
  // Загружаем тестовые данные
  metadataRegistry.loadMockData();
  templateManager.initialize();
});

suite.test('CodeBlock should support BSL language', () => {
  const codeBlock = new CodeBlock({
    code: 'Процедура Тест()\n  Сообщить("Привет");\nКонецПроцедуры',
    language: 'bsl'
  });
  
  Assert.equal(codeBlock.language, 'bsl');
  Assert.isTrue(codeBlock.useMonaco);
});

suite.test('CodeBlock should normalize 1c to bsl', () => {
  const codeBlock = new CodeBlock({
    code: 'Функция Тест()',
    language: '1c'
  });
  
  Assert.equal(codeBlock.language, 'bsl');
});

suite.test('CodeBlock should serialize with BSL language', () => {
  const codeBlock = new CodeBlock({
    code: 'Сообщить("Test");',
    language: 'bsl'
  });
  
  const json = codeBlock.toJSON();
  
  Assert.equal(json.language, 'bsl');
  Assert.equal(json.code, 'Сообщить("Test");');
});

suite.test('MetadataLinkParser should parse 1C links in text', () => {
  const text = `
    Для работы используется справочник #metadata:catalog:Nomenclature
    и документ #metadata:document:SalesInvoice
  `;
  
  const links = MetadataLinkParser.parse(text);
  
  Assert.equal(links.length, 2);
  Assert.equal(links[0].type, 'catalog');
  Assert.equal(links[1].type, 'document');
});

suite.test('MetadataRegistry should find registered objects', () => {
  const obj = metadataRegistry.get('catalog', 'Nomenclature');
  
  Assert.isNotNull(obj);
  Assert.equal(obj.type, 'catalog');
  Assert.equal(obj.name, 'Nomenclature');
});

suite.test('MetadataRegistry should provide autocomplete', () => {
  const results = metadataRegistry.autocomplete('catalog', 'nom');
  
  Assert.isTrue(results.length > 0);
  Assert.equal(results[0].type, 'catalog');
});

suite.test('TemplateManager should have tech spec template', () => {
  const template = templateManager.get('tech-spec');
  
  Assert.isNotNull(template);
  Assert.equal(template.name, 'Техническое задание');
  Assert.isTrue(template.hasVariables());
});

suite.test('TemplateManager should create document from tech spec', () => {
  const doc = templateManager.createDocument('tech-spec', {
    documentTitle: 'Новая доработка',
    projectName: 'Проект 1',
    authorName: 'Иванов И.И.',
    date: '2025-01-01'
  });
  
  Assert.isDefined(doc);
  Assert.isTrue(doc.blocks.length > 0);
  Assert.match(doc.title, /Новая доработка/);
  Assert.equal(doc.metadata.templateId, 'tech-spec');
});

suite.test('TemplateManager should create document from user manual template', () => {
  const doc = templateManager.createDocument('user-manual', {
    documentTitle: 'Руководство пользователя',
    systemName: '1С:Предприятие'
  });
  
  Assert.isDefined(doc);
  Assert.isTrue(doc.blocks.length > 0);
});

suite.test('Template should support metadata links in blocks', () => {
  const doc = templateManager.createDocument('tech-spec', {
    documentTitle: 'Доработка справочника #metadata:catalog:Products',
    projectName: 'Проект',
    authorName: 'Автор',
    date: '2025-01-01'
  });
  
  const links = MetadataLinkParser.parse(doc.title);
  
  Assert.equal(links.length, 1);
  Assert.equal(links[0].type, 'catalog');
  Assert.equal(links[0].name, 'Products');
});

suite.test('Integration: CodeBlock with BSL + metadata links in comments', () => {
  const code = `
    // Работа со справочником #metadata:catalog:Nomenclature
    Процедура ОбработатьНоменклатуру()
      // Используем документ #metadata:document:SalesInvoice
      Сообщить("Обработка");
    КонецПроцедуры
  `;
  
  const codeBlock = new CodeBlock({
    code,
    language: 'bsl'
  });
  
  const links = MetadataLinkParser.parse(code);
  
  Assert.equal(codeBlock.language, 'bsl');
  Assert.equal(links.length, 2);
});

suite.test('Integration: Template with BSL code blocks', () => {
  const customTemplate = templateManager.saveCustomTemplate({
    name: 'Код 1С',
    blocks: [
      {
        type: 'code',
        data: {
          code: '{{codeSnippet}}',
          language: 'bsl'
        }
      }
    ],
    variables: {
      codeSnippet: { type: 'string', required: true }
    }
  });
  
  const doc = templateManager.createDocument(customTemplate.id, {
    codeSnippet: 'Сообщить("Hello");'
  });
  
  Assert.equal(doc.blocks[0].type, 'code');
  Assert.equal(doc.blocks[0].data.language, 'bsl');
  Assert.equal(doc.blocks[0].data.code, 'Сообщить("Hello");');
});

suite.test('Integration: Search metadata and use in template', () => {
  const searchResults = metadataRegistry.search('sales');
  Assert.isTrue(searchResults.length > 0);
  
  const metadataObj = searchResults[0];
  const link = MetadataLinkParser.createLink(metadataObj.type, metadataObj.name);
  
  const customTemplate = templateManager.saveCustomTemplate({
    name: 'Doc with metadata',
    blocks: [
      {
        type: 'text',
        data: {
          text: `Используется: ${link}`
        }
      }
    ]
  });
  
  const doc = templateManager.createDocument(customTemplate.id, {});
  
  Assert.match(doc.blocks[0].data.text, /#metadata:/);
});

suite.test('Integration: Full workflow - template, variables, metadata, BSL', () => {
  // 1. Создаем шаблон с переменными
  const template = templateManager.saveCustomTemplate({
    name: 'Полный шаблон',
    category: 'custom',
    blocks: [
      {
        type: 'header',
        data: { title: '{{title}}' }
      },
      {
        type: 'text',
        data: { text: 'Объект: {{metadataLink}}' }
      },
      {
        type: 'code',
        data: {
          code: '{{code}}',
          language: 'bsl'
        }
      }
    ],
    variables: {
      title: { type: 'string', required: true },
      metadataLink: { type: 'string', required: true },
      code: { type: 'string', required: true }
    }
  });
  
  // 2. Ищем объект метаданных
  const metadataObj = metadataRegistry.get('catalog', 'Nomenclature');
  Assert.isNotNull(metadataObj);
  
  // 3. Создаем ссылку на метаданные
  const link = MetadataLinkParser.createLink(metadataObj.type, metadataObj.name);
  
  // 4. Создаем документ из шаблона
  const doc = templateManager.createDocument(template.id, {
    title: 'Доработка справочника',
    metadataLink: link,
    code: 'Процедура Обработка()\n  Сообщить("OK");\nКонецПроцедуры'
  });
  
  // 5. Проверяем результат
  Assert.equal(doc.blocks.length, 3);
  Assert.equal(doc.blocks[0].data.title, 'Доработка справочника');
  Assert.match(doc.blocks[1].data.text, /#metadata:catalog:Nomenclature/);
  Assert.equal(doc.blocks[2].data.language, 'bsl');
  Assert.match(doc.blocks[2].data.code, /Процедура/);
  
  // 6. Парсим ссылки в документе
  const links = MetadataLinkParser.parse(doc.blocks[1].data.text);
  Assert.equal(links.length, 1);
  Assert.equal(links[0].name, 'Nomenclature');
});

export default suite;

