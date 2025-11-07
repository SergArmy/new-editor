import { TestSuite } from '../../test-framework/TestSuite.js';
import { Assert } from '../../test-framework/Assert.js';
import { MetadataLinkParser } from '../../../src/integrations/metadata/MetadataLinkParser.js';

const suite = new TestSuite('MetadataLinkParser', 'Metadata link parser tests');

suite.test('should detect metadata link', () => {
  const link = '#metadata:catalog:Nomenclature';
  
  Assert.isTrue(MetadataLinkParser.isMetadataLink(link));
});

suite.test('should not detect non-metadata link', () => {
  Assert.isFalse(MetadataLinkParser.isMetadataLink('#regular-anchor'));
  Assert.isFalse(MetadataLinkParser.isMetadataLink('http://example.com'));
  Assert.isFalse(MetadataLinkParser.isMetadataLink(''));
  Assert.isFalse(MetadataLinkParser.isMetadataLink(null));
});

suite.test('should parse metadata link', () => {
  const link = '#metadata:catalog:Nomenclature';
  const parsed = MetadataLinkParser.parseLink(link);
  
  Assert.isNotNull(parsed);
  Assert.equal(parsed.type, 'catalog');
  Assert.equal(parsed.name, 'Nomenclature');
  Assert.equal(parsed.href, link);
  Assert.isDefined(parsed.displayName);
});

suite.test('should parse document metadata link', () => {
  const link = '#metadata:document:SalesInvoice';
  const parsed = MetadataLinkParser.parseLink(link);
  
  Assert.isNotNull(parsed);
  Assert.equal(parsed.type, 'document');
  Assert.equal(parsed.name, 'SalesInvoice');
});

suite.test('should return null for invalid link', () => {
  const parsed = MetadataLinkParser.parseLink('#invalid-format');
  
  Assert.isNull(parsed);
});

suite.test('should parse multiple links in text', () => {
  const text = 'См. #metadata:catalog:Products и #metadata:document:Sales';
  const links = MetadataLinkParser.parse(text);
  
  Assert.equal(links.length, 2);
  Assert.equal(links[0].type, 'catalog');
  Assert.equal(links[0].name, 'Products');
  Assert.equal(links[1].type, 'document');
  Assert.equal(links[1].name, 'Sales');
});

suite.test('should create link from type and name', () => {
  const link = MetadataLinkParser.createLink('catalog', 'Products');
  
  Assert.equal(link, '#metadata:catalog:Products');
});

suite.test('should get display name for catalog', () => {
  const displayName = MetadataLinkParser.getDisplayName('catalog', 'Products');
  
  Assert.match(displayName, /Справочник/);
  Assert.match(displayName, /Products/);
});

suite.test('should get display name for document', () => {
  const displayName = MetadataLinkParser.getDisplayName('document', 'Sales');
  
  Assert.match(displayName, /Документ/);
  Assert.match(displayName, /Sales/);
});

suite.test('should get Russian type name', () => {
  Assert.equal(MetadataLinkParser.getTypeDisplayName('catalog'), 'Справочник');
  Assert.equal(MetadataLinkParser.getTypeDisplayName('document'), 'Документ');
  Assert.equal(MetadataLinkParser.getTypeDisplayName('report'), 'Отчет');
});

suite.test('should return original type for unknown type', () => {
  const typeName = MetadataLinkParser.getTypeDisplayName('unknownType');
  
  Assert.equal(typeName, 'unknownType');
});

suite.test('should get supported types list', () => {
  const types = MetadataLinkParser.getSupportedTypes();
  
  Assert.isTrue(Array.isArray(types));
  Assert.isTrue(types.length > 0);
  Assert.isDefined(types[0].value);
  Assert.isDefined(types[0].label);
});

suite.test('should render links in text', () => {
  const text = 'См. #metadata:catalog:Products для деталей';
  const rendered = MetadataLinkParser.renderLinks(text);
  
  Assert.match(rendered, /href/);
  Assert.match(rendered, /metadata-link/);
  Assert.match(rendered, /Products/);
});

suite.test('should use custom renderer', () => {
  const text = '#metadata:catalog:Test';
  const customRenderer = (link) => `<span>${link.displayName}</span>`;
  const rendered = MetadataLinkParser.renderLinks(text, customRenderer);
  
  Assert.match(rendered, /<span>/);
  Assert.match(rendered, /Test/);
});

export default suite;

