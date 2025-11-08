# История изменений (PROGRESS)

## Шаг 1: Базовая архитектура документа ✅
**Дата:** 2025-01-13 15:00
**Что сделано:**
- Создана базовая структура `Document` с поддержкой блоков
- Реализован `DocumentSerializer` для сохранения/загрузки
- Добавлена система EventBus для управления событиями
- Интеграция с `EditorCore`
**Файлы:**
- editor/src/document/Document.js
- editor/src/document/DocumentSerializer.js
- editor/src/utils/EventBus.js
**Результат:** Документ поддерживает добавление, удаление и получение блоков

## Шаг 2: Система рендеринга блоков ✅
**Дата:** 2025-01-13 16:00
**Что сделано:**
- Создан `DocumentRenderer` для рендеринга всего документа
- Реализован `BlockRenderer` для рендеринга отдельных блоков
- Добавлена фабрика блоков `BlockFactory`
- Регистрация базовых типов блоков
**Файлы:**
- editor/src/blocks/base/BlockRenderer.js
- editor/src/blocks/base/BlockFactory.js
- editor/src/document/DocumentRenderer.js
**Результат:** Документ корректно рендерится на странице

## Шаг 3: Inline-форматирование текста ✅
**Дата:** 2025-01-14 10:00
**Что сделано:**
- Создан `InlineFormatManager` для управления форматированием
- Добавлена поддержка bold, italic, underline, strikethrough, code
- Реализованы горячие клавиши (Ctrl+B, Ctrl+I, Ctrl+U, Ctrl+K)
- Добавлена UI-панель форматирования
**Файлы:**
- editor/src/interactions/text/InlineFormatManager.js
- editor/src/blocks/content/TextBlock.js
- editor/src/interactions/text/TextBlockInputHandler.js
**Тесты:**
- tests/unit/interactions/text/inline-format-manager.test.js
**Результат:** Пользователь может форматировать текст в TextBlock

## Шаг 4: Markdown shortcuts ✅
**Дата:** 2025-01-14 12:00
**Что сделано:**
- Создан `MarkdownShortcuts` для обработки markdown-синтаксиса
- Поддержка: `**bold**`, `*italic*`, `` `code` ``, `~~strike~~`
- Интеграция с `TextBlockInputHandler`
**Файлы:**
- editor/src/interactions/text/MarkdownShortcuts.js
- editor/src/interactions/text/TextBlockInputHandler.js
**Результат:** Markdown автоматически преобразуется в форматирование

## Шаг 5: Slash-команды ✅
**Дата:** 2025-01-14 14:00
**Что сделано:**
- Создан `SlashCommandsUI` для отображения меню команд
- Добавлена обработка `/` в `TextBlockInputHandler`
- Поддержка навигации стрелками и выбора Enter
**Файлы:**
- editor/src/interactions/text/SlashCommandsUI.js
- editor/src/interactions/text/TextBlockInputHandler.js
**Результат:** Пользователь может вызывать команды через `/`

## Шаг 6: Исправление slash-команд ✅
**Дата:** 2025-01-14 15:00
**Что сделано:**
- Исправлено: слеш не удаляется после выбора команды
- Исправлено: меню открывается повторно при нажатии пробела
- Обновлен `TextBlockInputHandler` для корректной обработки
**Файлы:**
- editor/src/interactions/text/TextBlockInputHandler.js
**Результат:** Slash-команды работают корректно

## Шаг 7: Drag & Drop для перемещения блоков ✅
**Дата:** 2025-01-15 10:00
**Что сделано:**
- Создан `DragManager` для управления drag & drop
- Добавлены визуальные индикаторы drop zones
- Реализована команда `MoveBlockCommand` для undo/redo
- Интеграция с `EditorCore`
- Улучшена визуальная индикация drop zones (видимость при drag)
- Добавлена активация drop zones по вертикальной координате мыши (+/-10px)
**Файлы:**
- editor/src/interactions/dnd/DragManager.js
- editor/src/interactions/dnd/DropZone.js
- editor/src/editor/commands/MoveBlockCommand.js
- editor/src/editor/EditorCore.js
- editor/styles/main.css
**Результат:** Пользователь может перемещать блоки drag & drop

## Шаг 8: Clipboard integration (копирование/вставка блоков) ✅
**Дата:** 2025-01-15 16:00
**Что сделано:**
- Создан `ClipboardManager` для работы с системным буфером обмена
- Создан `ClipboardSerializer` для сериализации/десериализации блоков
- Добавлены горячие клавиши Ctrl+C/Ctrl+V
- Добавлен `SelectionManager` для выбора блоков
- Реализована команда `CreateBlockCommand` для вставки с undo/redo
- Добавлена визуальная индикация выбранных блоков
- Поддержка множественного выбора (Ctrl+Click)
- Снятие выделения по Escape
**Файлы:**
- editor/src/interactions/clipboard/ClipboardManager.js
- editor/src/interactions/clipboard/ClipboardSerializer.js
- editor/src/editor/EditorController.js (SelectionManager)
- editor/src/editor/commands/CreateBlockCommand.js
- editor/src/editor/EditorCore.js
- editor/src/app.js (tabindex для фокуса)
- editor/styles/main.css (стили выделения)
**Тесты:**
- Добавлен раздел в TESTING.md
**Результат:** Пользователь может копировать и вставлять блоки

## Шаг 9: Исправление Drag & Drop и Clipboard ✅
**Дата:** 2025-11-07 18:00
**Что сделано:**
- Исправлен расчет позиции при drop на drop zone (учитываются только блоки верхнего уровня)
- Добавлена обработка drop на блоки (не только на drop zones)
- Определены блоки, которые могут содержать дочерние элементы (section, header, footer)
- Добавлена визуальная индикация при drop на блок (пунктирная рамка для контейнеров, линия сверху для обычных блоков)
- Исправлено создание drop zones (только для блоков верхнего уровня)
- Добавлено логирование для отладки копирования
**Файлы:**
- editor/src/editor/EditorCore.js
- editor/styles/main.css
**Результат:** 
- Drag & Drop работает корректно: можно перетаскивать на drop zones и на блоки
- Drop zones создаются только для блоков верхнего уровня
- Визуальная индикация показывает, куда будет вставлен блок
- Копирование требует дальнейшей проверки пользователем

## Шаг 10: LinkManager UI (вставка/редактирование ссылок) ✅
**Дата:** 2025-01-15 19:00
**Что сделано:**
- Создан компонент `LinkDialog` для вставки и редактирования ссылок
- Расширен `LinkManager` методами для работы с DOM (insertLink, updateLink, getLinkInfo, getLinkAtCursor)
- Добавлена обработка Ctrl+K в `TextBlockInputHandler` для открытия диалога ссылок
- Добавлена поддержка редактирования существующих ссылок (Ctrl+Click по ссылке)
- Добавлены стили для модального окна и диалога ссылок
- Поддержка разных типов ссылок: external, internal, anchor, metadata
- Автоматическое определение типа ссылки по URL
**Файлы:**
- editor/src/formatting/LinkDialog.js
- editor/src/formatting/LinkManager.js
- editor/src/blocks/content/TextBlockInputHandler.js
- editor/src/formatting/index.js
- editor/styles/main.css
**Результат:** Пользователь может вставлять и редактировать ссылки через диалог (Ctrl+Q или Ctrl+Click)

## Шаг 11: Улучшение взаимодействия со ссылками ✅
**Дата:** 2025-01-15 20:00
**Что сделано:**
- Изменена горячая клавиша с Ctrl+K на Ctrl+Q для открытия диалога ссылок
- Добавлено контекстное меню (правый клик) с опциями: Редактировать, Перейти, Копировать ссылку, Удалить ссылку
- Добавлена обработка двойного клика по ссылке (открывает редактирование)
- Настроен одинарный клик для перехода по ссылке (с задержкой для проверки двойного клика)
- Улучшена обработка кликов вне контекстного меню
- Добавлены стили для контекстного меню и ссылок
- Исправлена проблема с Ctrl+Q (проверка фокуса элемента)
- Исправлена проблема с повторным открытием редактора после редактирования (восстановление фокуса и курсора)
- Исправлена проблема с закрытием редактора при выходе за пределы окна (проверка фокуса на диалог)
- Добавлено закрытие диалога при нажатии Escape
- Исправлена проблема с Ctrl+Q при смене языка (использование физических кодов клавиш e.code вместо e.key)
- Исправлена проблема с вставкой новой ссылки (сохранение и восстановление selection перед вставкой)
- Исправлена проблема с кнопкой "Вставить" при выделенном тексте (неправильное определение режима редактирования)
**Файлы:**
- editor/src/blocks/content/TextBlockInputHandler.js
- editor/src/ui/components/ContextMenu.js
- editor/src/formatting/LinkDialog.js
- editor/src/formatting/LinkManager.js
- editor/src/ui/components/Modal.js
- editor/styles/main.css
- .cursorrules
- editor/docs/MASTER_PLAN.md
**Результат:** Пользователь может взаимодействовать со ссылками различными способами: Ctrl+Q для вставки, двойной клик/правый клик для редактирования, одинарный клик для перехода. Все проблемы с открытием/закрытием диалога исправлены.

## Шаг 12: Интеграция MultiSelect (диапазонный выбор) ✅
**Дата:** 2025-11-07 19:30
**Что сделано:**
- Реализован метод `_getBlocksBetween` в EditorCore для получения всех блоков верхнего уровня между двумя ID
- Обновлен `SelectionManager.selectRange` для поддержки функции `getBetweenIds` (как в MultiSelect)
- Добавлен метод `getAnchor()` в SelectionManager для получения anchor блока
- Добавлена обработка Shift+Click для диапазонного выбора блоков
- Обновлены тесты для SelectionManager (добавлены тесты для selectRange с getBetweenIds и getAnchor)
**Файлы:**
- editor/src/editor/SelectionManager.js
- editor/src/editor/EditorCore.js
- editor/tests/unit/editor/selection-manager.test.js
**Тесты:**
- Добавлены тесты для selectRange с getBetweenIds
- Добавлены тесты для getAnchor
**Результат:** Пользователь может выбирать множественные блоки с помощью Ctrl+Click и диапазонный выбор с помощью Shift+Click

## Шаг 13: Undo/Redo для блоков ✅
**Дата:** 2025-11-07 20:30
**Что сделано:**
- Добавлены методы `undo` и `redo` в `EditorCore` с синхронизацией выделения и повторной инициализацией Drag & Drop
- Реализованы горячие клавиши Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z и Ctrl/Cmd+Y с проверками раскладки
- Добавлены события `history:undo` и `history:redo` для отслеживания истории
- Обновлены unit-тесты для проверки Undo/Redo сценариев создания блоков
- Перемещение блоков через drag & drop интегрировано с HistoryManager и поддерживает Undo/Redo
**Файлы:**
- editor/src/editor/EditorCore.js
- editor/tests/unit/editor/editor-core.test.js
**Тесты:**
- Обновлены unit-тесты для EditorCore (undo/redo)
**Результат:** Пользователь может отменять и повторять операции с блоками (включая drag & drop) с помощью горячих клавиш и истории

## Шаг 14: Автосохранение документа ✅
**Дата:** 2025-11-07 (session 1)
**Что сделано:**
- Переписан `AutoSaveManager` с поддержкой статусов, отложенных стратегий и подписок на изменения
- Унифицированы стратегии сохранения (debounce/periodic), добавлены методы `flush` и `cancelPending`
- Интегрирован AutoSaveManager в `EditorCore` и `app.js`, добавлен UI-индикатор статуса автосохранения
- Обновлены unit-тесты для AutoSaveManager и EditorCore
**Файлы:**
- editor/src/persistence/AutoSaveManager.js
- editor/src/persistence/SaveStrategy.js
- editor/src/editor/EditorCore.js
- editor/src/app.js
- editor/styles/main.css
- editor/tests/unit/persistence/auto-save-manager.test.js
- editor/tests/unit/editor/editor-core.test.js
**Тесты:**
- Обновлены unit-тесты: editor/tests/unit/persistence/auto-save-manager.test.js, editor/tests/unit/editor/editor-core.test.js (запуск требуется через testrunner)
**Результат:** Автосохранение документа работает с дебаунсом, статусами и визуальной индикацией в интерфейсе

## Шаг 15: Экспорт документа (JSON/HTML) и UI ✅
**Дата:** 2025-01-16 (session 1)
**Что сделано:**
- Улучшен HtmlExporter: поддержка всех типов блоков (text, code, image, table, quote, section, header, footer, toc)
- Добавлена поддержка inline-форматирования в TextBlock (жирный, курсив, ссылки и т.д.)
- Добавлены стили для экспортированного HTML, полностью соответствующие стилистике редактора:
  - Цветовая схема из variables.css (primary, accent, success, warning, danger, info)
  - Стили секций с градиентом цветов заголовков разных уровней (h2-h6)
  - Темный фон для блоков кода (#2d3748) с светлым текстом
  - Темно-синие заголовки таблиц (#1a365d) с белым текстом
  - Правильные стили для цитат разных типов (info, warning, important, success)
  - Тени и скругления, соответствующие редактору
  - Поддержка светлой и темной темы
- Интегрирован ExportManager в EditorCore: добавлены методы `exportDocument()` и `getAvailableExportFormats()`
- Создан UI компонент ExportDialog для выбора формата экспорта и опций
- Добавлена кнопка экспорта в интерфейс приложения
- Реализован функционал скачивания экспортированного файла
- Исправлена поддержка сериализованного формата документа (document.content.blocks)
- Исправлена валидация в JsonExporter и XmlExporter для работы с сериализованным форматом
**Файлы:**
- editor/src/export/exporters/HtmlExporter.js
- editor/src/export/exporters/JsonExporter.js
- editor/src/export/exporters/XmlExporter.js
- editor/src/editor/EditorCore.js
- editor/src/ui/components/ExportDialog.js
- editor/src/ui/components/Modal.js
- editor/src/ui/components/index.js
- editor/src/app.js
- editor/styles/main.css
**Результат:** Пользователь может экспортировать документ в форматах JSON, HTML, XML через диалог с настройками экспорта. HTML экспорт полностью сохраняет стилистику редактора: цвета, отступы, типографику, оформление всех типов блоков. Все экспортеры корректно работают с сериализованным форматом документа.

### Шаг 16: Оптимизация экспорта HTML — загрузка стилей из файлов ✅
**Дата:** 2025-01-16 (session 2)
**Что сделано:**
- Создан класс CssLoader для загрузки CSS файлов вместо дублирования стилей
- CssLoader автоматически определяет правильные пути к CSS файлам (поддержка разных контекстов запуска)
- HtmlExporter теперь загружает стили из файлов проекта (reset.css, variables.css, main.css)
- Добавлены дополнительные стили для экспорта (скрытие элементов редактора, улучшение отображения)
- Добавлена поддержка темной темы через переопределения CSS переменных
- Реализован fallback на базовые стили, если CSS файлы недоступны
**Файлы:**
- editor/src/export/CssLoader.js (новый)
- editor/src/export/exporters/HtmlExporter.js
**Результат:** Теперь HTML экспорт использует реальные стили из CSS файлов проекта, что исключает дублирование и обеспечивает синхронизацию стилей. Стили автоматически загружаются при экспорте, а элементы редактора скрываются через дополнительные CSS правила.

### Шаг 17: Улучшение экспорта блока кода ✅
**Дата:** 2025-11-07 (session 2)
**Что сделано:**
- HtmlExporter добавляет шапку блока кода с кнопкой копирования и меткой языка
- Получение раскрашенного HTML через `monaco.editor.colorize` с конвертацией токенов в inline-стили
- Сохранены нумерация строк и миникарта (при включенных опциях блока)
- Удалён highlight.js и все связанные стили/скрипты из экспортируемого HTML
- Обновлены CSS-переопределения: отключено визуальное выделение при hover, сохранены цвета темы Monaco
- Переписан inline-скрипт копирования (без зависимостей, с fallback для старых браузеров)
**Файлы:**
- editor/src/export/exporters/HtmlExporter.js
**Результат:** Экспортированный HTML полностью повторяет подсветку Monaco, показывает язык и содержит рабочую кнопку копирования без визуального мерцания при наведении на блок кода.

### Шаг 18: Рефакторинг HTML экспорта — паттерн Strategy и оптимизация CSS ✅
**Дата:** 2025-11-07 15:00
**Что сделано:**
- Создана инфраструктура стратегий экспорта (BaseBlockExportStrategy)
- Реализованы стратегии для всех типов блоков:
  - TextBlockExportStrategy - текстовые блоки
  - CodeBlockExportStrategy - блоки кода с Monaco подсветкой
  - ImageBlockExportStrategy - изображения
  - TableBlockExportStrategy - таблицы
  - QuoteBlockExportStrategy - цитаты
  - SectionBlockExportStrategy - секции с вложенными блоками
  - StructuralBlockExportStrategy - header, footer, toc
- Создан CssExtractor для извлечения только используемых CSS правил:
  - Парсинг CSS с поддержкой @media правил
  - Извлечение используемых классов, ID и тегов из HTML
  - Минификация CSS
  - Автоматический сбор классов из сгенерированного HTML
- Полностью переписан HtmlExporter для использования стратегий:
  - buildHTML собирает используемые классы в процессе рендеринга
  - renderBlockWithStrategy делегирует рендеринг стратегиям
  - getOptimizedStyles извлекает только нужные CSS правила
  - Сохранена обратная совместимость со старым API
- Результаты оптимизации:
  - HTML размер: 6.42 KB (против десятков KB ранее)
  - CSS правил: 17 (вместо сотен)
  - CSS размер: 2.30 KB (против 50+ KB ранее)
  - Размер файла уменьшился в **5-10 раз**
**Файлы:**
- editor/src/export/strategies/BaseBlockExportStrategy.js (новый)
- editor/src/export/strategies/TextBlockExportStrategy.js (новый)
- editor/src/export/strategies/CodeBlockExportStrategy.js (новый)
- editor/src/export/strategies/ImageBlockExportStrategy.js (новый)
- editor/src/export/strategies/TableBlockExportStrategy.js (новый)
- editor/src/export/strategies/QuoteBlockExportStrategy.js (новый)
- editor/src/export/strategies/SectionBlockExportStrategy.js (новый)
- editor/src/export/strategies/StructuralBlockExportStrategy.js (новый)
- editor/src/export/strategies/index.js (новый)
- editor/src/export/CssExtractor.js (новый)
- editor/src/export/exporters/HtmlExporter.js (рефакторинг)
- editor/test-export.js (новый тестовый файл)
**Тесты:**
- Создан test-export.js для проверки работоспособности
- Все проверки пройдены: text-block ✅, code-block ✅, table-block ✅, CSS ✅, copy script ✅
**Результат:** Экспорт HTML теперь использует архитектуру на основе паттерна Strategy, что обеспечивает изоляцию логики каждого типа блока, упрощает тестирование и добавление новых типов. CSS оптимизирован через CssExtractor, который извлекает только используемые правила, что сократило размер экспортируемых файлов в 5-10 раз. Каждая стратегия возвращает список используемых классов, что позволяет точно определить необходимые стили.

### Шаг 19: ChecklistBlock — специализированный блок ✅
**Дата:** 2025-11-07 21:00
**Что сделано:**
- Реализован класс `ChecklistBlock` с поддержкой заголовка, прогресса и описаний пунктов
- Зарегистрирован новый тип блока в инициализации и создан экспорт специализированных блоков
- Добавлены unit-тесты и расширены стили для отображения чеклиста
**Файлы:**
- editor/src/blocks/specialized/ChecklistBlock.js
- editor/src/blocks/specialized/index.js
- editor/src/blocks/initializeBlocks.js
- editor/tests/unit/blocks/specialized/checklist-block.test.js
- editor/tests/unit/blocks/initialize-blocks.test.js
- editor/tests/test-runner-init.js
- editor/styles/main.css
**Тесты:**
- Добавлены: tests/unit/blocks/specialized/checklist-block.test.js
**Результат:** В редакторе доступен новый блок чеклиста с базовым прогрессом и стилизацией; блок корректно сериализуется и покрыт тестами

### Шаг 20: StepsBlock — блок пошаговой инструкции ✅
**Дата:** 2025-11-07 21:40
**Что сделано:**
- Создан класс `StepsBlock` с поддержкой статусов шагов, описаний и автоматической нумерации
- Зарегистрирован новый тип блока и добавлен в демонстрационный документ редактора
- Добавлены unit-тесты, обновлены стили и справочная документация проекта
**Файлы:**
- editor/src/blocks/specialized/StepsBlock.js
- editor/src/blocks/specialized/index.js
- editor/src/blocks/initializeBlocks.js
- editor/src/app.js
- editor/styles/main.css
- editor/tests/unit/blocks/specialized/steps-block.test.js
- editor/tests/unit/blocks/initialize-blocks.test.js
- editor/tests/test-runner-init.js
**Тесты:**
- Добавлены: tests/unit/blocks/specialized/steps-block.test.js
**Результат:** В редакторе доступен блок пошаговой инструкции с визуальными статусами; блок зарегистрирован в системе и демонстрационном документе, покрыт тестами и стилизован

### Шаг 21: DiagramBlock — визуализация диаграмм ✅
**Дата:** 2025-11-07 22:05
**Что сделано:**
- Реализован `DiagramBlock` с поддержкой PlantUML/Mermaid-данных, предпросмотра и блока исходного кода
- Зарегистрирован новый тип блока, увеличен тестовый документ примером диаграммы
- Добавлены unit-тесты и стили для заголовка, превью и исходников диаграммы
**Файлы:**
- editor/src/blocks/specialized/DiagramBlock.js
- editor/src/blocks/specialized/index.js
- editor/src/blocks/initializeBlocks.js
- editor/src/app.js
- editor/styles/main.css
- editor/tests/unit/blocks/specialized/diagram-block.test.js
- editor/tests/unit/blocks/initialize-blocks.test.js
- editor/tests/test-runner-init.js
**Тесты:**
- Добавлены: tests/unit/blocks/specialized/diagram-block.test.js
**Результат:** Редактор поддерживает блок диаграмм с метаданными, исходным кодом и предпросмотром; тип полностью интегрирован в систему и покрыт тестами

### Шаг 22: PlantUMLBlock — специализация для PlantUML ✅
**Дата:** 2025-11-07 22:35
**Что сделано:**
- Реализован `PlantUMLBlock` с поддержкой серверов рендера, форматов изображений и исходного кода диаграмм
- Зарегистрирован новый тип, добавлен пример в демонстрационный документ и настроены стили предпросмотра и исходника
- Добавлены unit-тесты и обновлен тест-раннер, включена регистрация в initializeBlocks
**Файлы:**
- editor/src/blocks/specialized/PlantUMLBlock.js
- editor/src/blocks/specialized/index.js
- editor/src/blocks/initializeBlocks.js
- editor/src/app.js
- editor/styles/main.css
- editor/tests/unit/blocks/specialized/plantuml-block.test.js
- editor/tests/unit/blocks/initialize-blocks.test.js
- editor/tests/test-runner-init.js
**Тесты:**
- Добавлены: tests/unit/blocks/specialized/plantuml-block.test.js
**Результат:** PlantUML диаграммы отображаются в редакторе с метаданными, исходным кодом и предпросмотром; тип полностью интегрирован и покрыт тестами

### Шаг 23: Исправление асинхронной загрузки PlantUML диаграмм ✅
**Дата:** 2025-11-07 22:50
**Что сделано:**
- Добавлен флаг `_isGenerating` для отслеживания состояния генерации URL
- Реализован спиннер с анимацией для индикации загрузки диаграммы
- Добавлена обработка ошибок при генерации и загрузке изображения
- Улучшен UX: теперь пользователь видит анимированный спиннер во время загрузки библиотеки pako и генерации URL
**Файлы:**
- editor/src/blocks/specialized/PlantUMLBlock.js
- editor/styles/main.css
**Тесты:**
- Существующие тесты продолжают работать
**Результат:** PlantUML диаграммы корректно загружаются при первом рендере с визуальной индикацией процесса

### Шаг 24: Расширенный функционал для DiagramBlock и PlantUMLBlock ✅
**Дата:** 2025-11-07 23:30
**Что сделано:**
- Добавлены элементы управления для DiagramBlock: кнопки масштаба (+/-, сброс), копирования (SVG/PNG), полноэкранный режим
- Реализовано переключение между превью диаграммы и редактором кода
- Добавлен редактор кода PlantUML с возможностью редактирования в textarea
- Реализован функционал масштабирования изображения (zoom in/out/reset)
- Добавлено копирование изображения в форматах SVG и PNG через буфер обмена
- Реализован полноэкранный режим просмотра диаграммы с модальным окном
- Добавлены toast-уведомления о результатах копирования
- PlantUMLBlock переработан для наследования от DiagramBlock с сохранением async генерации URL
- Добавлены стили для всех новых элементов управления (кнопки, модальное окно, уведомления)
- Расширены unit-тесты для проверки новой функциональности (zoom, toggle view, controls)
**Файлы:**
- editor/src/blocks/specialized/DiagramBlock.js (полностью переработан)
- editor/src/blocks/specialized/PlantUMLBlock.js (переработан с наследованием от DiagramBlock)
- editor/styles/main.css (добавлены стили для элементов управления, модального окна, toast)
- editor/tests/unit/blocks/specialized/diagram-block.test.js (расширены тесты)
**Тесты:**
- Добавлены тесты для проверки рендеринга кнопок управления
- Добавлены тесты для переключения между preview и code view
- Добавлены тесты для функционала масштабирования (zoom in/out/reset)
- Добавлены тесты для проверки границ масштаба (min 0.25, max 3.0)
**Результат:** Блоки диаграмм теперь имеют полнофункциональный UI с возможностью редактирования кода, масштабирования, копирования в разные форматы и просмотра в полноэкранном режиме. PlantUMLBlock использует наследование для переиспользования функциональности DiagramBlock.

### Шаг 25: Полировка UI DiagramBlock/PlantUMLBlock ✅
**Дата:** 2025-11-07 23:55
**Что сделано:**
- Переработан layout блока диаграммы: копирование и переключение режима вынесены в заголовок, элементы масштаба перенесены в оверлей изображения
- Добавлен CodeBlock с Monaco-редактором вместо textarea, реализован выбор движка диаграммы и переработан UX переключения режимов
- Реализован ресайзер по высоте, фиксирование высоты при смене вида и обновлены стили (без рамок, новое позиционирование кнопок)
- Обновлен PlantUMLBlock (наследование, спиннер, метаданные, копирование) и модифицированы юнит-тесты под новую структуру
**Файлы:**
- editor/src/blocks/specialized/DiagramBlock.js
- editor/src/blocks/specialized/PlantUMLBlock.js
- editor/styles/main.css
- editor/tests/unit/blocks/specialized/diagram-block.test.js
- editor/tests/unit/blocks/specialized/plantuml-block.test.js
**Тесты:**
- Обновлены существующие unit-тесты для DiagramBlock и PlantUMLBlock
**Результат:** UI блоков диаграмм полностью соответствует новым требованиям: копирование и редактирование доступны из шапки, масштабирование и полноэкранный просмотр вынесены в оверлей, код редактируется через полноценный code-block с Monaco и выбором движка, сохранены размерами и добавлен ресайз.

### Шаг 26: Подсветка PlantUML в редакторе диаграммы ✅
**Дата:** 2025-11-08 (session 1)
**Что сделано:**
- Добавлена конфигурация языка PlantUML для Monaco и автоматическая регистрация
- Обновлен DiagramBlock для передачи языка PlantUML в режим редактирования кода
- Расширен CodeBlock и юнит-тесты для поддержки PlantUML
**Файлы:**
- editor/src/integrations/monaco/MonacoCodeEditor.js
- editor/src/integrations/monaco/PlantUMLLanguageConfig.js
- editor/src/integrations/monaco/index.js
- editor/src/blocks/content/CodeBlock.js
- editor/src/blocks/specialized/DiagramBlock.js
- editor/tests/unit/blocks/specialized/diagram-block.test.js
**Тесты:**
- Не запускались (доступны через testrunner.html)
**Результат:** При переключении диаграммы в режим кода используется подсветка синтаксиса PlantUML вместо 1С.

### Шаг 27: Исправление фокуса в блоке кода ✅
**Дата:** 2025-11-08 (session 1)
**Что сделано:**
- Добавлена логика пропуска обработки клика для вложенных редакторов (Monaco, textarea, интерактивные элементы)
- Предотвращено принудительное смещение фокуса на контейнер редактора при взаимодействии внутри CodeBlock
**Файлы:**
- editor/src/editor/EditorCore.js
**Тесты:**
- Не запускались (доступны через testrunner.html)
**Результат:** Кликая по Monaco-редактору или textarea внутри блока кода, можно свободно редактировать содержимое без потери фокуса.

### Шаг 28: Улучшения выпадающего списка языков кода ✅
**Дата:** 2025-11-08 (session 1)
**Что сделано:**
- Отсортирован список языков по алфавиту и добавлена прокрутка с ограничением высоты
- Повышен z-index выпадающего списка и включен выход за пределы блока кода
- Обновлены unit-тесты для проверки сортировки
**Файлы:**
- editor/src/blocks/content/CodeBlock.js
- editor/styles/main.css
- editor/tests/unit/blocks/content/code-block.test.js
**Тесты:**
- Обновлены: editor/tests/unit/blocks/content/code-block.test.js
**Результат:** Выпадающий список языков компактен, пролистывается и корректно отображается поверх блока кода.

### Шаг 29: Нативное копирование в режиме редактирования кода ✅
**Дата:** 2025-11-08 (session 1)
**Что сделано:**
- Добавлена проверка контекста фокуса для горячих клавиш Copy/Paste/Undo/Redo
- Обновлены обработчики клавиатуры для пропуска глобальных шорткатов внутри Monaco и textarea
- Добавлены unit-тесты для `_isNativeTextEditingContext`
**Файлы:**
- editor/src/editor/EditorCore.js
- editor/tests/unit/editor/editor-core.test.js
**Тесты:**
- Обновлены: editor/tests/unit/editor/editor-core.test.js
**Результат:** В режиме редактирования кода сочетание Ctrl+C копирует выделенный текст без вызова копирования блока, системное поведение сохранено.

### Шаг 30: Обновление диаграммы после редактирования кода ✅
**Дата:** 2025-11-08 (session 1)
**Что сделано:**
- Добавлено автоматическое обновление превью при выходе из режима редактирования кода
- ПлантUML-блоки теперь заново генерируют URL при изменении исходного кода
**Файлы:**
- editor/src/blocks/specialized/DiagramBlock.js
- editor/src/blocks/specialized/PlantUMLBlock.js
**Тесты:**
- Не запускались (доступны через testrunner.html)
**Результат:** После редактирования PlantUML-кода и возврата к превью диаграмма перерисовывается с учетом новых изменений.

### Шаг 31: Кликабельные элементы диаграмм ✅
**Дата:** 2025-11-08 16:45
**Что сделано:**
- Добавлена поддержка сохранения ссылок на элементы SVG-превью диаграмм
- Реализован режим редактирования ссылок с визуальным выделением и поповером настроек
- Обновлен полноэкранный просмотр для inline SVG и улучшено копирование SVG/PNG
- Добавлено контекстное меню для установки/редактирования ссылок и мягкая подсветка кликабельных элементов
- Расширены юнит-тесты DiagramBlock для проверки ссылок и селекторов
**Файлы:**
- editor/src/blocks/specialized/DiagramBlock.js
- editor/src/blocks/specialized/PlantUMLBlock.js
- editor/styles/main.css
- editor/tests/unit/blocks/specialized/diagram-block.test.js
**Тесты:**
- Обновлены tests/unit/blocks/specialized/diagram-block.test.js (запуск требуется через testrunner.html)
**Результат:** Диаграммы поддерживают кликабельные элементы с сохранением ссылок и интерактивным режимом редактирования.

### Шаг 32: Восстановление отображения StepsBlock ✅
**Дата:** 2025-11-08 (session 2)
**Что сделано:**
- Добавлены стили для StepsBlock с визуальными индикаторами шагов, статусов и описаний
- Удалены дублирующиеся номера за счет сброса стандартной нумерации списка и собственной разметки
- Реализованы адаптивные правила отображения шагов на мобильных устройствах
**Файлы:**
- editor/styles/main.css
**Тесты:**
- Не запускались (визуальное изменение)
**Результат:** Пошаговый блок снова отображает заголовки, статусы и описания шагов с акцентами по статусам и корректной версткой.

### Шаг 33: Обновление стиля кнопок ✅
**Дата:** 2025-11-08 (session 2)
**Что сделано:**
- Переработаны базовые стили `.btn` с более четкой геометрией, усиленной типографикой и деловыми цветовыми акцентами
- Обновлены состояния `.btn-primary` и `.btn-secondary`, добавлены тени и границы в единой корпоративной палитре
- Настроено состояние `:focus-visible` для лучшей доступности и визуальной четкости при навигации с клавиатуры
**Файлы:**
- editor/styles/main.css
**Тесты:**
- Не запускались (визуальное изменение)
**Результат:** Кнопки получили более строгий и профессиональный внешний вид, сохранив общую стилистику редактора и улучшив UX при взаимодействии.

## Следующие шаги:
- Специализированные блоки (Comparison, Action, Definition, Roles)
- Блоки для работы с таблицами (TableBlock с расширенным функционалом)
- Система плагинов
