import { createContainer } from './core/di/index.js';
import { createEventBus } from './core/events/index.js';
import { StateManager } from './core/state/StateManager.js';
import { HistoryManager } from './core/history/HistoryManager.js';
import { initializeBlocks } from './blocks/initializeBlocks.js';
import { EditorCore } from './editor/EditorCore.js';
import { Document } from './document/Document.js';
import { DocumentSerializer } from './document/DocumentSerializer.js';
import { AutoSaveManager } from './persistence/AutoSaveManager.js';
import { ApiMock, DocumentApi, IconLibraryApi } from './api/index.js';
import { ExportManager } from './export/ExportManager.js';
import { JsonExporter, HtmlExporter, XmlExporter } from './export/exporters/index.js';
import { ExportDialog } from './ui/components/index.js';
import { createIconLibrary } from './ui/icon-library/index.js';

/**
 * Создает и инициализирует приложение редактора
 * @param {HTMLElement} rootEl - корневой элемент для рендеринга
 * @returns {{container: Container, eventBus: EventBus, editor: EditorCore}}
 */
export function createApp(rootEl) {
    // Инициализация DI контейнера
    const container = createContainer();
    const eventBus = createEventBus();
    container.register('eventBus', () => eventBus);

    // Mock API + Document API
    const apiClient = new ApiMock('/api/v1');
    const documentApi = new DocumentApi(apiClient);
    const iconLibraryApi = new IconLibraryApi(apiClient);
    container.register('documentApi', () => documentApi);
    const iconLibrary = createIconLibrary({ api: iconLibraryApi });
    iconLibrary.initialize().catch((error) => {
        console.warn('[App] Не удалось инициализировать библиотеку иконок:', error);
    });
    container.register('iconLibrary', () => iconLibrary);

    // Инициализация StateManager и HistoryManager
    const stateManager = new StateManager({});
    const historyManager = new HistoryManager(stateManager);
    container.register('stateManager', () => stateManager);
    container.register('historyManager', () => historyManager);

    // Инициализация системы блоков
    const { renderer: blockRenderer } = initializeBlocks();
    container.register('blockRenderer', () => blockRenderer);

    // Создаем тестовый документ и сохраняем в mock API
    const testDocument = createTestDocument();
    const serializedDocument = DocumentSerializer.serialize(testDocument);
    apiClient.createDocument(serializedDocument);

    // AutoSave Manager
    const autoSaveManager = new AutoSaveManager(async (payload) => {
        await documentApi.update(payload.id, payload);
    }, { interval: 2000 });
    autoSaveManager.markSaved(serializedDocument.updatedAt);
    container.register('autoSaveManager', () => autoSaveManager);

    // Export Manager
    const exportManager = new ExportManager();
    exportManager.registerExporter('json', new JsonExporter());
    exportManager.registerExporter('html', new HtmlExporter());
    exportManager.registerExporter('xml', new XmlExporter());
    container.register('exportManager', () => exportManager);

    // Создание контейнера для редактора
    const editorContainer = document.createElement('div');
    editorContainer.className = 'editor-container';
    // Делаем контейнер фокусируемым для работы горячих клавиш
    editorContainer.setAttribute('tabindex', '0');

    // Статус автосохранения
    const statusIndicator = document.createElement('div');
    statusIndicator.className = 'autosave-indicator';
    statusIndicator.setAttribute('role', 'status');
    statusIndicator.dataset.status = autoSaveManager.getStatus();

    const statusText = document.createElement('span');
    statusText.className = 'autosave-indicator__text';
    statusIndicator.appendChild(statusText);

    const statusMessages = {
        saved: 'Все изменения сохранены',
        pending: 'Есть несохраненные изменения',
        saving: 'Сохранение…',
        error: 'Ошибка автосохранения'
    };

    const formatSavedTime = (date) => {
        if (!date) {
            return '';
        }
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    const updateStatus = (status, error) => {
        statusIndicator.dataset.status = status;
        let message = statusMessages[status] || '';

        if (status === 'saved') {
            const savedAt = autoSaveManager.getLastSavedAt();
            const timeLabel = formatSavedTime(savedAt);
            if (timeLabel) {
                message = `${message} · ${timeLabel}`;
            }
        } else if (status === 'error' && error) {
            message = `${message}: ${error.message}`;
        }

        statusText.textContent = message;
    };

    autoSaveManager.onStatusChangeSubscribe(updateStatus);

    rootEl.appendChild(statusIndicator);
    rootEl.appendChild(editorContainer);

    // Создание EditorCore
    const editor = new EditorCore({
        stateManager,
        historyManager,
        eventBus,
        blockRenderer,
        autoSaveManager,
        exportManager
    }, editorContainer);
    editor.initialize(testDocument);

    // Кнопка экспорта
    const exportButton = document.createElement('button');
    exportButton.className = 'btn btn-export';
    exportButton.textContent = 'Экспорт';
    exportButton.addEventListener('click', () => {
        const formats = editor.getAvailableExportFormats();
        const exportDialog = new ExportDialog({
            formats: formats,
            onExport: async (format, options) => {
                return await editor.exportDocument(format, options);
            }
        });
        exportDialog.open();
    });

    rootEl.insertBefore(exportButton, statusIndicator);

    // Подписка на события для отладки
    eventBus.on('editor:initialized', () => {
        console.log('Editor initialized');
    });

    eventBus.on('document:loaded', ({ document }) => {
        console.log('Document loaded:', document.title);
    });

    eventBus.on('blocks:copied', ({ blockIds }) => {
        console.log('Blocks copied:', blockIds);
    });

    eventBus.on('blocks:pasted', ({ blockIds }) => {
        console.log('Blocks pasted:', blockIds);
    });

    return { container, eventBus, editor, autoSaveManager };
}

/**
 * Создает тестовый документ для демонстрации
 * @returns {Document}
 */
function createTestDocument() {
    return new Document({
        id: 'test-doc-1',
        title: 'Тестовый документ',
        blocks: [
            {
                id: 'block-header',
                type: 'header',
                position: 0,
                parentId: null,
                protected: false,
                data: {
                    title: 'Тестовый документ: все блоки редактора',
                    metadata: {
                        author: 'Команда Inline Editor',
                        date: '2025-11-08',
                        version: '1.5'
                    }
                }
            },
            {
                id: 'block-toc',
                type: 'toc',
                position: 1,
                parentId: null,
                protected: false,
                data: {
                    items: [
                        { id: 'section-overview', title: 'Обзор редактора', level: 1 },
                        { id: 'section-collaboration', title: 'Командная работа', level: 1 },
                        { id: 'section-tech', title: 'Технические блоки', level: 1 },
                        { id: 'section-governance', title: 'Управление знаниями', level: 1 }
                    ]
                }
            },
            {
                id: 'section-overview',
                type: 'section',
                position: 2,
                parentId: null,
                protected: false,
                data: {
                    title: 'Обзор редактора',
                    level: 1,
                    numbered: false
                }
            },
            {
                id: 'text-intro',
                type: 'text',
                position: 3,
                parentId: 'section-overview',
                protected: false,
                data: {
                    text: 'Inline-редактор поддерживает структурированные документы с богатыми блоками. Ниже собраны примеры каждого блока: от простого текста и цитат до диаграмм, таблиц и карточек действий.'
                }
            },
            {
                id: 'quote-vision',
                type: 'quote',
                position: 4,
                parentId: 'section-overview',
                protected: false,
                data: {
                    text: 'Документ — не просто набор параграфов. Это рабочее пространство команды, где каждая карточка, диаграмма и ролевая запись помогает удерживать контекст.',
                    quoteType: 'info',
                    author: 'Руководитель продукта'
                }
            },
            {
                id: 'image-overview',
                type: 'image',
                position: 5,
                parentId: 'section-overview',
                protected: false,
                data: {
                    src: 'https://placehold.co/960x420?text=Inline+Editor+Overview',
                    alt: 'Схема модулей inline-редактора',
                    caption: 'Визуализация основных зон редактора: панель инструментов, рабочая область и историю действий.',
                    align: 'center'
                }
            },
            {
                id: 'section-collaboration',
                type: 'section',
                position: 6,
                parentId: null,
                protected: false,
                data: {
                    title: 'Командная работа',
                    level: 1,
                    numbered: false
                }
            },
            {
                id: 'text-collaboration',
                type: 'text',
                position: 7,
                parentId: 'section-collaboration',
                protected: false,
                data: {
                    text: 'Структурируйте процессы релиза и распределяйте ответственность: чек-листы фиксируют готовность, шаги уточняют порядок действий, а таблицы помогают сверить контакты.'
                }
            },
            {
                id: 'checklist-release',
                type: 'checklist',
                position: 8,
                parentId: 'section-collaboration',
                protected: false,
                data: {
                    title: 'Чеклист запуска проекта',
                    showProgress: true,
                    items: [
                        { id: 'checklist-item-1', text: 'Проверить автосохранение', checked: true },
                        { id: 'checklist-item-2', text: 'Протестировать Drag & Drop', checked: false },
                        { id: 'checklist-item-3', text: 'Экспортировать в HTML', checked: false }
                    ]
                }
            },
            {
                id: 'steps-release',
                type: 'steps',
                position: 9,
                parentId: 'section-collaboration',
                protected: false,
                data: {
                    title: 'Шаги подготовки релиза',
                    steps: [
                        {
                            id: 'step-1',
                            title: 'Сбор требований',
                            description: 'Убедитесь, что все задачи попали в релиз и задокументированы.',
                            status: 'done'
                        },
                        {
                            id: 'step-2',
                            title: 'Регрессионное тестирование',
                            description: 'Запустите тест-раннер и проведите ручной прогон критичных сценариев.',
                            status: 'active'
                        },
                        {
                            id: 'step-3',
                            title: 'Деплой и проверка',
                            description: 'Выполните выкладку на стенд и подтвердите корректность работы.'
                        }
                    ]
                }
            },
            {
                id: 'table-contacts',
                type: 'table',
                position: 10,
                parentId: 'section-collaboration',
                protected: false,
                data: {
                    header: true,
                    rows: [
                        ['Роль', 'Зона ответственности', 'Основной канал'],
                        ['Release Manager', 'Координация релиза, отчёты', 'Slack #release'],
                        ['QA Lead', 'Регрессия, тест-план, дефекты', 'TestRail / Jira'],
                        ['DevOps', 'CI/CD, инфраструктура, мониторинг', 'Ops чат']
                    ]
                }
            },
            {
                id: 'comparison-process',
                type: 'comparison',
                position: 11,
                parentId: 'section-collaboration',
                protected: false,
                data: {
                    title: 'Коммуникация команды: до и после стандартизации',
                    sections: [
                        {
                            id: 'comparison-section-communication',
                            title: 'Коммуникация команды',
                            before: {
                                title: 'До стандартизации',
                                status: 'incorrect',
                                content: [
                                    'Каждый разработчик ведет собственные заметки.',
                                    'Список блокеров хранится в личных чатах.',
                                    'Неясно, кто отвечает за финальную проверку.'
                                ]
                            },
                            after: {
                                title: 'После стандартизации',
                                status: 'correct',
                                content: [
                                    'Создан общий шаблон документа релиза в редакторе.',
                                    'Все блокеры фиксируются в едином ComparisonBlock.',
                                    'Назначен ответственный за финальную проверку и деплой.'
                                ],
                                notes: [
                                    'Документ доступен всем участникам команды.',
                                    'История изменений сохраняется автоматически.'
                                ]
                            }
                        }
                    ]
                }
            },
            {
                id: 'section-tech',
                type: 'section',
                position: 12,
                parentId: null,
                protected: false,
                data: {
                    title: 'Технические блоки',
                    level: 1,
                    numbered: false
                }
            },
            {
                id: 'text-tech-intro',
                type: 'text',
                position: 13,
                parentId: 'section-tech',
                protected: false,
                data: {
                    text: 'Эти блоки демонстрируют технические возможности редактора: подсветку кода, диаграммы и сравнение JSON-ответов после доработок.'
                }
            },
            {
                id: 'code-sample',
                type: 'code',
                position: 14,
                parentId: 'section-tech',
                protected: false,
                data: {
                    language: 'bsl',
                    code: 'Процедура ОбновитьДокумент(Документ)\n    Если Документ.НуждаетсяВСохранении() Тогда\n        АвтоСохранение.Запланировать(Документ);\n    КонецЕсли;\n    История.Зафиксировать(\"document:update\", Документ.Идентификатор);\nКонецПроцедуры'
                }
            },
            {
                id: 'diagram-request-flow',
                type: 'diagram',
                position: 15,
                parentId: 'section-tech',
                protected: false,
                data: {
                    title: 'Схема обработки запроса',
                    description: 'Последовательность взаимодействия сервисов при выполнении операции сохранения документа.',
                    engine: 'plantuml',
                    theme: 'default',
                    renderUrl: '',
                    source: `@startuml
actor User
User -> UI: Создает документ
UI -> EditorCore: serialize()
EditorCore -> ApiClient: POST /documents
ApiClient -> Storage: save(document)
Storage --> ApiClient: 201 Created
ApiClient --> EditorCore: response
EditorCore --> UI: notify success
@enduml`
                }
            },
            {
                id: 'plantuml-architecture',
                type: 'plantuml',
                position: 16,
                parentId: 'section-tech',
                protected: false,
                data: {
                    title: 'Архитектура модулей',
                    description: 'Диаграмма автоматически рендерится через PlantUML сервер из исходного кода.',
                    serverUrl: 'https://www.plantuml.com/plantuml',
                    format: 'svg',
                    source: `@startuml
rectangle EditorCore {
  [SelectionManager]
  [HistoryManager]
}
[SelectionManager] --> [HistoryManager]: события undo/redo
[EditorCore] --> [ExportManager]
@enduml`
                }
            },
            {
                id: 'comparison-api',
                type: 'comparison',
                position: 17,
                parentId: 'section-tech',
                protected: false,
                data: {
                    title: 'API до/после внедрения версионирования',
                    sections: [
                        {
                            id: 'comparison-section-api',
                            title: 'Структура ответа',
                            description: 'Бэкенд расширили полями версии документа и статуса автосохранения.',
                            before: {
                                title: 'Старая версия',
                                status: 'incorrect',
                                mode: 'code',
                                content: [
                                    '{',
                                    '  "id": "doc-42",',
                                    '  "title": "Документ"',
                                    '}'
                                ],
                                notes: [
                                    'Нет версии документа',
                                    'Нет статуса последнего сохранения'
                                ]
                            },
                            after: {
                                title: 'Новая версия',
                                status: 'correct',
                                mode: 'code',
                                content: [
                                    '{',
                                    '  "id": "doc-42",',
                                    '  "title": "Документ",',
                                    '+  "version": 7,',
                                    '+  "autosave": {',
                                    '+    "status": "saved",',
                                    '+    "savedAt": "2025-11-08T15:42:00Z"',
                                    '+  }',
                                    '}'
                                ],
                                notes: [
                                    'Добавлена версия документа',
                                    'Появился статус автосохранения'
                                ]
                            }
                        }
                    ]
                }
            },
            {
                id: 'section-governance',
                type: 'section',
                position: 18,
                parentId: null,
                protected: false,
                data: {
                    title: 'Управление знаниями',
                    level: 1,
                    numbered: false
                }
            },
            {
                id: 'definition-formatter',
                type: 'definition',
                position: 19,
                parentId: 'section-governance',
                protected: false,
                data: {
                    term: 'Inline Formatter',
                    description: [
                        'Сервис применяет форматирование прямо в активном текстовом блоке, сохраняя единый поток данных редактора.',
                        'Поддерживает сочетания клавиш и markdown-сокращения; расширенные блоки пользователь добавляет самостоятельно под определением.'
                    ]
                }
            },
            {
                id: 'action-demo',
                type: 'action',
                position: 20,
                parentId: 'section-governance',
                protected: false,
                data: {
                    title: 'Подготовить демо-сессию',
                    outcome: 'Команда демонстрирует стабильный сценарий пользователю',
                    steps: [
                        {
                            title: 'Собрать сценарий',
                            description: 'Уточнить ключевые шаги, подготовить данные и тайминг показа.'
                        },
                        {
                            title: 'Проверить окружение',
                            description: 'Обновить демо-стенд, прогнать smoke-тесты перед показом.'
                        },
                        {
                            title: 'Отрепетировать презентацию',
                            description: 'Пройти сценарий командой, зафиксировать вопросы и фидбек.'
                        }
                    ]
                }
            },
            {
                id: 'roles-team',
                type: 'roles',
                position: 21,
                parentId: 'section-governance',
                protected: false,
                data: {
                    title: 'Роли команды релиза',
                    description: [
                        'Каждая роль фиксирует область ответственности и основной канал связи.',
                        'Используйте этот блок как отправную точку, дополняя деталями в отдельных секциях.'
                    ],
                    roles: [
                        {
                            title: 'Release Manager',
                            contact: 'Мария Крылова · @release-manager',
                            responsibilities: [
                                'Координация релизных задач и контроль чек-листов',
                                'Подготовка итогового отчёта после выкладки'
                            ]
                        },
                        {
                            title: 'QA Lead',
                            contact: 'Иван Сергеев · qa-lead@example.com',
                            responsibilities: [
                                'Организация регрессионного тестирования',
                                'Фиксация найденных дефектов и коммуникация с разработкой'
                            ]
                        },
                        {
                            title: 'DevOps',
                            contact: 'Дмитрий Поляков · @devops',
                            responsibilities: [
                                'Подготовка окружений и выкладка релиза',
                                'Мониторинг статуса сервисов после релиза'
                            ]
                        }
                    ]
                }
            },
            {
                id: 'block-footer',
                type: 'footer',
                position: 22,
                parentId: null,
                protected: false,
                data: {
                    content: 'Обновлено: 2025-11-08 · Inline Editor Preview'
                }
            }
        ]
    });
}


