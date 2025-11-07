## Мастер‑план проекта Inline‑редактора документации для 1С

Этот файл — единый источник истины по плану работ, статусам и фиксации дат/времени выполнения. Для актуального журнала хода работ см. также `docs/PROGRESS.md`.

Legend: [x] — выполнено, [ ] — в работе/запланировано

### 0) Высокоуровневые цели (MVP)
- [x] Инфраструктура тестирования и базовые утилиты — Completed At: 2025-01-XX (см. PROGRESS)
- [x] EditorCore ↔ Document ↔ BlockRenderer (базовая интеграция) — Completed At: 2025-01-XX (см. PROGRESS)
- [x] Рендеринг базовых блоков (Text, Code, Image, Table, Quote) — Completed At: 2025-01-XX (см. PROGRESS)
- [x] SlashCommands и MarkdownShortcuts (базовые) — Completed At: 2025-01-XX (см. PROGRESS)
- [x] Inline‑форматирование (жирный, курсив, ссылки, underline, strike, code) — Completed At: 2025-01-15 20:00
- [x] Interactions: Drag & Drop, Clipboard, MultiSelect
- [x] Undo/Redo интеграция команд форматирования/редактирования — Completed At: 2025-11-07 20:30
- [x] Экспорт (JSON/HTML) и автосохранение — Completed At: 2025-01-16 (session 1); Refactored: 2025-11-07 15:00 (Strategy pattern + CSS optimization)
- [ ] Стили и UX‑полировка

### 1) Этапы и вехи
1. Инфраструктура (Группа 0)
   - [x] Test Framework (TestRunner, TestSuite, Assert) — Completed At: 2025-01-XX
   - [x] DI Container, EventBus — Completed At: 2025-01-XX
   - [x] Базовые утилиты (logger, helpers) — Completed At: 2025-01-XX

2. Ядро и документ (Группы 1–2)
   - [x] Reactive Signals, State, History — Completed At: 2025-01-XX
   - [x] Document/Serializer/Validator — Completed At: 2025-01-XX

3. Рендеринг (Группа 3)
   - [x] VirtualScroller/RenderQueue/DOMRecycler (базовая реализация) — Completed At: 2025-01-XX
   - [x] DocumentRenderer и интеграция в EditorCore — Completed At: 2025-01-XX
   - [ ] Оптимизация и подключение к реальному потоку рендеринга

4. Блоки (Группы 4–5)
   - [x] Section/Header/Footer/ToC — Completed At: 2025-01-XX
   - [x] Text/Code/Image/Table/Quote — Completed At: 2025-01-XX
   - [~] Специализированные блоки (Checklist, Steps, Diagram, PlantUML, Comparison, Definition, Roles, Action) — In Progress: 2025-11-07 21:00
     - [x] ChecklistBlock — Completed At: 2025-11-07 21:00
     - [x] StepsBlock — Completed At: 2025-11-07 21:40
     - [x] DiagramBlock — Completed At: 2025-11-07 22:05
     - [ ] PlantUMLBlock
     - [ ] ComparisonBlock
     - [ ] DefinitionBlock
     - [ ] RolesBlock
     - [ ] ActionBlock

5. Команды (Группа 9)
   - [x] SlashCommands: меню, поиск, навигация, исполнение — Completed At: 2025-01-XX
   - [x] MarkdownShortcuts: базовые паттерны, триггеры — Completed At: 2025-01-XX
   - [ ] Расширение шорткатов (заголовки, списки, линии, чекбоксы)

6. Inline‑форматирование (Группа 7: formatting)
   - [x] Интеграция InlineFormatter/InlineFormatManager в TextBlock — Completed At: 2025-01-15 19:00
   - [x] Горячие клавиши: Bold/Italic/Underline — Completed At: 2025-01-XX
   - [x] Горячие клавиши: Strike/Code — Completed At: 2025-01-XX
   - [x] Сохранение изменений в Document — Completed At: 2025-01-XX
   - [x] LinkManager: вставка/редактирование ссылок (внешние/внутренние/метаданные) — Completed At: 2025-01-15 19:00
   - [x] Авто‑линкинг URL с дебаунсом — Completed At: 2025-01-XX
   - [x] Markdown shortcuts (**bold**, *italic*) — Completed At: 2025-01-XX

7. Взаимодействия (Группа 8)
   - [x] Drag & Drop: перемещение блоков с визуальными индикаторами — Completed At: 2025-11-07 18:30
   - [x] Drag & Drop: drop на блоки (не только на drop zones) — Completed At: 2025-11-07 18:30
   - [x] Clipboard: копирование/вставка блоков (внутр. JSON/HTML/Text) — Completed At: 2025-11-07 18:00
   - [x] MultiSelect: диапазон/множественный выбор, групповые операции — Completed At: 2025-11-07 19:30

8. История/Автосохранение/Экспорт (Группы 10, 12)
- [x] История команд форматирования и редактирования (Undo/Redo) — Completed At: 2025-11-07 20:30
   - [x] AutoSaveManager: индикаторы, дебаунс — Completed At: 2025-11-07 (session 1)
   - [x] Export: JSON/HTML; UI для экспорта — Completed At: 2025-01-16 (session 1); Updated: 2025-11-07 15:10 (Monaco-based code export)

9. UI‑интеграция и стили (Группа 11)
   - [ ] Toolbar/Sidebar: действия форматирования/создания блоков
   - [ ] Темы (light/dark), базовый layout/typography
   - [ ] Полировка UX, доступность (WCAG AA)

10. Производительность и качество
   - [ ] Performance tests (1000+ блоков)
   - [ ] Integration tests: редакторский поток, Drag & Drop, Clipboard
   - [ ] Полезные метрики (TTI, FPS, память), стабилизация

### 2) Детализация Must/Should/Could (из ТЗ)
- Must Have (MVP)
  - [x] Создание/редактирование/удаление документов — Completed At: 2025-01-XX
  - [x] Базовые блоки — Completed At: 2025-01-XX
  - [ ] Inline‑форматирование (полный спектр)
  - [ ] Undo/Redo для действий пользователя
  - [ ] Drag & Drop блоков
  - [x] Автосохранение — Completed At: 2025-11-07 (session 1)
  - [x] Экспорт JSON/HTML — Completed At: 2025-01-16 (session 1); Refactored: 2025-11-07 15:00 (размер файлов уменьшен в 5-10 раз)
  - [ ] Подсветка 1С в CodeBlock (интеграция есть, требуется полировка)
  - [ ] Производительность: 1000 блоков без лагов

- Should Have
  - [x] Slash‑команды и Markdown‑шорткаты (база) — Completed At: 2025-01-XX
  - [ ] Специализированные блоки (минимальный набор)
  - [ ] MultiSelect
  - [ ] Защита блоков
  - [ ] Тёмная тема
  - [ ] Шаблоны документов

- Could Have
  - [ ] Collaboration, комментарии, уведомления, offline

### 3) Текущие приоритеты (из PROGRESS.md)
1. [x] Интеграция InlineFormatter с TextBlock (жирный/курсив/ссылки) — Completed At: 2025-01-15 19:00
   - [x] Горячие клавиши Bold/Italic/Underline/Strike/Code
   - [x] Автолинкинг URL
   - [x] Markdown shortcuts
   - [x] Сохранение изменений в Document
   - [x] LinkManager UI (вставка/редактирование ссылок) — Completed At: 2025-01-15 19:00
2. [x] Подключение Drag & Drop к EditorCore — Completed At: 2025-11-07 18:30
3. [x] Drop на блоки (поддержка вложенности) — Completed At: 2025-11-07 18:30
4. [x] Интеграция Clipboard с блоками — Completed At: 2025-11-07 18:00
5. [x] Подключение MultiSelect — Completed At: 2025-11-07 19:30
6. [x] Интеграция AutoSaveManager — Completed At: 2025-11-07 (session 1)
7. [x] Экспорт JSON/HTML — Completed At: 2025-01-16 (session 1); Refactored: 2025-11-07 15:00 (Strategy pattern + CSS optimization)

### 4) Правила фиксации статусов
- Каждую завершённую задачу отмечать [x] и добавлять строку `Completed At: YYYY-MM-DD HH:mm` (локальное время разработчика).
- Обязательно дублировать запись в `docs/PROGRESS.md` с коротким описанием шага, что сделано, и ссылками на изменённые файлы.
- Использовать единый формат времени `YYYY-MM-DD HH:mm`.

### 4.1) Правила обработки горячих клавиш
**КРИТИЧНО**: При реализации горячих клавиш всегда использовать физические коды клавиш (`e.code`) вместо символов (`e.key`) для обеспечения работы независимо от раскладки клавиатуры/языка.

**Почему**: `e.key` возвращает символ в зависимости от текущей раскладки (например, 'q' в английской, 'й' в русской), а `e.code` возвращает физическую позицию клавиши (например, 'KeyQ' для клавиши Q независимо от раскладки).

**Пример**:
```javascript
// ❌ ПЛОХО - не работает с разными раскладками
if (e.key === 'q' || e.key === 'Q') { ... }

// ✅ ХОРОШО - работает с любой раскладкой
if (e.code === 'KeyQ' || e.key === 'q' || e.key === 'Q') { ... }
// Примечание: Оставляем e.key как fallback для старых браузеров
```

**Рекомендация**: Использовать `e.code` как основной проверку, с `e.key` как fallback для совместимости.

### 5) Definition of Done (DoD)
- Реализованная функциональность покрыта юнит‑тестами; интеграционные тесты при необходимости.
- Нет регрессий по тестам.
- Нет ошибок линтера.
- Обновлена документация (`MASTER_PLAN.md`, `PROGRESS.md`).
- UX/перфоманс соответствует целям этапа.

### 6) Источник статуса «выполнено»
- Источники истины: `docs/PROGRESS.md` и история коммитов.
- Этот файл агрегирует статусы и отражает «итоговую» картину; при расхождениях ориентироваться на последний коммит и актуальный `PROGRESS.md`.


