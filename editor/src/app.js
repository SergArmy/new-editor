import { createContainer } from './core/di/index.js';
import { createEventBus } from './core/events/index.js';
import { StateManager } from './core/state/StateManager.js';
import { HistoryManager } from './core/history/HistoryManager.js';
import { initializeBlocks } from './blocks/initializeBlocks.js';
import { EditorCore } from './editor/EditorCore.js';
import { Document } from './document/Document.js';
import { DocumentSerializer } from './document/DocumentSerializer.js';
import { AutoSaveManager } from './persistence/AutoSaveManager.js';
import { ApiMock, DocumentApi } from './api/index.js';
import { ExportManager } from './export/ExportManager.js';
import { JsonExporter, HtmlExporter, XmlExporter } from './export/exporters/index.js';
import { ExportDialog } from './ui/components/index.js';

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
    container.register('documentApi', () => documentApi);

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
                id: 'block-1',
                type: 'text',
                position: 0,
                parentId: null,
                protected: false,
                data: {
                    text: 'Блок 1: Добро пожаловать в редактор документации! Это первый блок текста. Попробуйте перетащить его.'
                }
            },
            {
                id: 'block-2',
                type: 'text',
                position: 1,
                parentId: null,
                protected: false,
                data: {
                    text: 'Блок 2: Редактор поддерживает различные типы блоков: текст, код, таблицы, изображения и многое другое.'
                }
            },
            {
                id: 'block-3',
                type: 'code',
                position: 2,
                parentId: null,
                protected: false,
                data: {
                    language: 'bsl',
                    code: 'Процедура Тест()\n    Сообщить("Привет, мир!");\nКонецПроцедуры'
                }
            },
            {
                id: 'block-4',
                type: 'text',
                position: 3,
                parentId: null,
                protected: false,
                data: {
                    text: 'Блок 4: Вы можете перетаскивать блоки для изменения их порядка. Просто зажмите блок и перетащите его в нужное место.'
                }
            },
            {
                id: 'block-5',
                type: 'text',
                position: 4,
                parentId: null,
                protected: false,
                data: {
                    text: 'Блок 5: При перетаскивании вы увидите визуальные индикаторы зон вставки между блоками.'
                }
            },
            {
                id: 'block-6',
                type: 'checklist',
                position: 5,
                parentId: null,
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
                id: 'block-7',
                type: 'steps',
                position: 6,
                parentId: null,
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
                id: 'block-8',
                type: 'diagram',
                position: 7,
                parentId: null,
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
                id: 'block-9',
                type: 'plantuml',
                position: 8,
                parentId: null,
                protected: false,
                data: {
                    title: 'Архитектура модулей',
                    description: 'Диаграмма автоматически рендерится через PlantUML сервер из исходного кода.',
                    serverUrl: 'https://www.plantuml.com/plantuml',
                    format: 'svg',
                    // renderUrl генерируется автоматически из source
                    source: `@startuml
rectangle EditorCore {
  [SelectionManager]
  [HistoryManager]
}
[SelectionManager] --> [HistoryManager]: события undo/redo
[EditorCore] --> [ExportManager]
@enduml`
                }
            }
        ]
    });
}


