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

## Следующие шаги:
- Специализированные блоки (Comparison, Diagram, PlantUML, Checklist, Action, Steps, Definition, Roles)
- Блоки для работы с таблицами (TableBlock с расширенным функционалом)
- Система плагинов
