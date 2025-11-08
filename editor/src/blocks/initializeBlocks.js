import { BlockRegistry } from './base/BlockRegistry.js';
import { BlockFactory } from './base/BlockFactory.js';
import { BlockRenderer } from './base/BlockRenderer.js';

// Импортируем все типы блоков
import { TextBlock } from './content/TextBlock.js';
import { QuoteBlock } from './content/QuoteBlock.js';
import { CodeBlock } from './content/CodeBlock.js';
import { ImageBlock } from './content/ImageBlock.js';
import { TableBlock } from './content/TableBlock.js';
import { ChecklistBlock } from './specialized/ChecklistBlock.js';
import { StepsBlock } from './specialized/StepsBlock.js';
import { DiagramBlock } from './specialized/DiagramBlock.js';
import { PlantUMLBlock } from './specialized/PlantUMLBlock.js';
import { ComparisonBlock } from './specialized/ComparisonBlock.js';
import { DefinitionBlock } from './specialized/DefinitionBlock.js';

import { SectionBlock } from './structure/SectionBlock.js';
import { HeaderBlock } from './structure/HeaderBlock.js';
import { FooterBlock } from './structure/FooterBlock.js';
import { TocBlock } from './structure/TocBlock.js';

/**
 * Инициализирует систему блоков:
 * - Создает BlockRegistry
 * - Регистрирует все типы блоков
 * - Создает BlockFactory
 * - Создает BlockRenderer
 * @returns {{registry: BlockRegistry, factory: BlockFactory, renderer: BlockRenderer}}
 */
export function initializeBlocks() {
  const registry = new BlockRegistry();

  // Регистрируем контентные блоки
  registry.register('text', TextBlock);
  registry.register('quote', QuoteBlock);
  registry.register('code', CodeBlock);
  registry.register('image', ImageBlock);
  registry.register('table', TableBlock);
  registry.register('checklist', ChecklistBlock);
  registry.register('steps', StepsBlock);
  registry.register('diagram', DiagramBlock);
  registry.register('plantuml', PlantUMLBlock);
  registry.register('comparison', ComparisonBlock);
  registry.register('definition', DefinitionBlock);

  // Регистрируем структурные блоки
  registry.register('section', SectionBlock);
  registry.register('header', HeaderBlock);
  registry.register('footer', FooterBlock);
  registry.register('toc', TocBlock);

  const factory = new BlockFactory(registry);
  const renderer = new BlockRenderer(factory);

  return { registry, factory, renderer };
}

