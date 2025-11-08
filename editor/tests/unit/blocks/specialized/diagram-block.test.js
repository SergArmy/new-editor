import { TestSuite } from '../../../test-framework/TestSuite.js';
import { Assert } from '../../../test-framework/Assert.js';
import { DiagramBlock } from '../../../../src/blocks/specialized/DiagramBlock.js';

const suite = new TestSuite('Blocks/Specialized/DiagramBlock');

suite.test('renders diagram with metadata and source', () => {
  const block = new DiagramBlock({
    id: 'd1',
    type: 'diagram',
    position: 0,
    data: {
      title: 'Sequence diagram',
      description: 'Основной сценарий авторизации',
      engine: 'plantuml',
      theme: 'c4',
      renderUrl: 'https://example.com/rendered.png',
      source: '@startuml\nAlice -> Bob: Hi\n@enduml'
    }
  });

  const el = block.render();

  Assert.isTrue(el.classList.contains('diagram-block'));
  Assert.strictEqual(el.querySelector('.diagram-title').textContent, 'Sequence diagram');
  Assert.strictEqual(el.querySelector('.diagram-description').textContent, 'Основной сценарий авторизации');
  Assert.strictEqual(el.querySelector('.diagram-meta').textContent, 'PLANTUML');
  Assert.isNotNull(el.querySelector('.diagram-meta-popover'));
  Assert.isNotNull(el.querySelector('.diagram-meta-trigger'));
  const languageBtn = el.querySelector('.code-language-btn');
  Assert.isNotNull(languageBtn);
  Assert.strictEqual(languageBtn.textContent, 'PlantUML');
  Assert.isNotNull(block.codeBlock);
  Assert.strictEqual(block.codeBlock.language, 'plantuml');
});

suite.test('renders control buttons and overlay', () => {
  const block = new DiagramBlock({
    id: 'd1',
    type: 'diagram',
    position: 0,
    data: {
      title: 'Test Diagram',
      renderUrl: 'https://example.com/diagram.svg',
      source: '@startuml\nAlice -> Bob: Hi\n@enduml'
    }
  });

  const el = block.render();

  const headerActions = el.querySelector('.diagram-header-actions');
  Assert.isNotNull(headerActions);

  const overlayControls = el.querySelector('.diagram-overlay-controls');
  Assert.isNotNull(overlayControls);
  Assert.strictEqual(overlayControls.querySelectorAll('.diagram-control-btn').length, 4);

  const copyOverlay = el.querySelector('.diagram-overlay-copies');
  Assert.isNotNull(copyOverlay);
  Assert.strictEqual(copyOverlay.querySelectorAll('.diagram-copy-btn').length, 2);

  const editBtn = el.querySelector('.diagram-edit-btn');
  Assert.isNotNull(editBtn);

});

suite.test('toggles between preview and code view', () => {
  const block = new DiagramBlock({
    id: 'd1',
    type: 'diagram',
    position: 0,
    data: {
      title: 'Test',
      renderUrl: 'https://example.com/diagram.svg',
      source: '@startuml\nAlice -> Bob: Hi\n@enduml'
    }
  });

  const el = block.render();
  const previewContainer = el.querySelector('.diagram-preview');
  const codeContainer = el.querySelector('.diagram-code-editor');

  Assert.isFalse(previewContainer.classList.contains('is-hidden'));
  Assert.isTrue(codeContainer.classList.contains('is-hidden'));
  Assert.isFalse(block.isCodeView);

  block._toggleCodeView();

  Assert.isTrue(previewContainer.classList.contains('is-hidden'));
  Assert.isFalse(codeContainer.classList.contains('is-hidden'));
  Assert.isTrue(block.isCodeView);

  block._toggleCodeView();

  Assert.isFalse(previewContainer.classList.contains('is-hidden'));
  Assert.isTrue(codeContainer.classList.contains('is-hidden'));
  Assert.isFalse(block.isCodeView);
});

suite.test('zoom controls update zoom level', () => {
  const block = new DiagramBlock({
    id: 'd1',
    type: 'diagram',
    position: 0,
    data: {
      renderUrl: 'https://example.com/diagram.svg'
    }
  });

  block.render();

  Assert.strictEqual(block.zoomLevel, 1.0);

  block._zoomIn();
  Assert.strictEqual(block.zoomLevel, 1.25);

  block._zoomIn();
  Assert.strictEqual(block.zoomLevel, 1.5);

  block._zoomOut();
  Assert.strictEqual(block.zoomLevel, 1.25);

  block._zoomReset();
  Assert.strictEqual(block.zoomLevel, 1.0);
});

suite.test('zoom respects min and max limits', () => {
  const block = new DiagramBlock({
    id: 'd1',
    type: 'diagram',
    position: 0,
    data: {
      renderUrl: 'https://example.com/diagram.svg'
    }
  });

  block.render();

  for (let i = 0; i < 20; i++) {
    block._zoomIn();
  }
  Assert.strictEqual(block.zoomLevel, 3.0);

  for (let i = 0; i < 20; i++) {
    block._zoomOut();
  }
  Assert.strictEqual(block.zoomLevel, 0.25);
});

suite.test('toJSON preserves diagram data', () => {
  const block = new DiagramBlock({
    id: 'd2',
    type: 'diagram',
    position: 0,
    data: {
      engine: 'mermaid',
      source: 'graph TD; A-->B;'
    }
  });

  const json = block.toJSON();

  Assert.strictEqual(json.engine, 'mermaid');
  Assert.strictEqual(json.source, 'graph TD; A-->B;');
  Assert.strictEqual(json.title, '');
  Assert.strictEqual(json.format, '');
  Assert.isTrue(typeof json.contentHeight === 'number');
  Assert.isTrue(Array.isArray(json.links));
  Assert.strictEqual(json.links.length, 0);
});

suite.test('applies and serializes diagram links', () => {
  const block = new DiagramBlock({
    id: 'd3',
    type: 'diagram',
    position: 0,
    data: {
      renderUrl: 'https://example.com/diagram.svg',
      links: [
        { selector: '#node-1', href: '#child' }
      ]
    }
  });

  block.render();
  block._injectSvg('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect id="node-1" width="40" height="40"/></svg>');

  const svg = block._getSvgElement();
  Assert.isNotNull(svg);

  const rect = svg.querySelector('#node-1');
  Assert.isNotNull(rect);
  Assert.isTrue(rect.classList.contains('diagram-link-target'));

  const json = block.toJSON();
  Assert.strictEqual(json.links.length, 1);
  Assert.strictEqual(json.links[0].href, '#child');
});

suite.test('context menu exposes link actions', () => {
  const block = new DiagramBlock({
    id: 'd4',
    type: 'diagram',
    position: 0,
    data: {
      renderUrl: 'https://example.com/diagram.svg'
    }
  });

  block.render();
  block._injectSvg('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect id="node-ctx" width="30" height="30"/></svg>');

  const svg = block._getSvgElement();
  const rect = svg.querySelector('#node-ctx');
  Assert.isNotNull(rect);

  block._showLinkContextMenu(15, 15, rect, null);

  Assert.isNotNull(block._contextMenu);
  Assert.isTrue(block._contextMenu.classList.contains('is-visible'));

  const items = block._contextMenu.querySelectorAll('.diagram-link-context-menu__item');
  Assert.strictEqual(items.length, 1);
  Assert.strictEqual(items[0].dataset.action, 'add');

  block._hideLinkContextMenu();
});

suite.test('creates new link via context menu workflow', () => {
  const block = new DiagramBlock({
    id: 'd5',
    type: 'diagram',
    position: 0,
    data: {
      renderUrl: 'https://example.com/diagram.svg'
    }
  });

  block.render();
  block._injectSvg('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><g><rect width="20" height="20"/></g></svg>');

  const svg = block._getSvgElement();
  const rect = svg.querySelector('rect');
  Assert.isNotNull(rect);

  block._showLinkContextMenu(12, 12, rect, null);
  block._handleContextMenuAction('add');

  Assert.isNotNull(block._linkHrefInput);
  block._linkHrefInput.value = 'https://example.com/docs';
  if (block._linkNewTabInput) {
    block._linkNewTabInput.checked = false;
  }

  block._saveCurrentLink();

  Assert.strictEqual(block.links.length, 1);
  Assert.strictEqual(block.links[0].href, 'https://example.com/docs');
  Assert.isFalse(block.links[0].openInNewTab);
});

export default suite;


