import { EditorController } from './EditorController.js';
import { DocumentRenderer } from '../document/DocumentRenderer.js';
import { DocumentSerializer } from '../document/DocumentSerializer.js';
import { BlockRenderer } from '../blocks/base/BlockRenderer.js';
import { SlashCommands } from '../commands/base/SlashCommands.js';
import { MarkdownShortcuts } from '../commands/base/MarkdownShortcuts.js';
import { CreateBlockCommand } from '../commands/block-commands/CreateBlockCommand.js';
import { DeleteBlockCommand } from '../commands/block-commands/DeleteBlockCommand.js';
import { MoveBlockCommand } from '../commands/block-commands/MoveBlockCommand.js';
import { DragManager } from '../interactions/drag-drop/DragManager.js';
import { ClipboardManager } from '../interactions/clipboard/ClipboardManager.js';
import { ExportManager } from '../export/ExportManager.js';

export class EditorCore {
  /**
   * @param {Object} dependencies
   * @param {HTMLElement} container
   */
  constructor(dependencies, container) {
    this.container = container;
    this.controller = new EditorController(dependencies);
    this.stateManager = dependencies.stateManager;
    this.historyManager = dependencies.historyManager;
    this.eventBus = dependencies.eventBus;
    this.blockRenderer = dependencies.blockRenderer;
    this.autoSaveManager = dependencies.autoSaveManager || null;
    this.exportManager = dependencies.exportManager || null;
    this.document = null;
    this.documentRenderer = null;
    this.slashCommands = new SlashCommands();
    this.markdownShortcuts = new MarkdownShortcuts();
    this.dragManager = new DragManager();
    this.clipboardManager = new ClipboardManager();
    this._autoSaveCleanup = null;
  }

  /**
   * Инициализирует редактор
   * @param {Document} [document] - документ для редактирования
   */
  initialize(document = null) {
    this.container.innerHTML = '';

    // Передаем зависимости редактора в BlockRenderer
    if (this.blockRenderer && this.blockRenderer.setEditorDeps) {
      this.blockRenderer.setEditorDeps({
        slashCommands: this.slashCommands,
        markdownShortcuts: this.markdownShortcuts,
        eventBus: this.eventBus
      });
    }

    // Создаем DocumentRenderer
    if (this.blockRenderer) {
      this.documentRenderer = new DocumentRenderer(this.blockRenderer, this.container);
    }

    // Подписываемся на события от текстовых блоков
    this._setupTextBlockHandlers();

    // Настраиваем обработку клавиатуры для Clipboard
    this._setupKeyboardHandlers();

    // Включаем автосохранение
    this._setupAutoSave();

    // Если документ передан, загружаем его
    if (document) {
      this.loadDocument(document);
    }

    this.eventBus.emit('editor:initialized', { document: this.document });
  }

  /**
   * Настраивает автоcохранение при изменениях документа
   * @private
   */
  _setupAutoSave() {
    if (!this.autoSaveManager || !this.eventBus) {
      return;
    }

    if (this._autoSaveCleanup) {
      this._autoSaveCleanup();
    }

    const events = [
      'block:created',
      'block:updated',
      'block:deleted',
      'block:moved',
      'blocks:pasted',
      'history:undo',
      'history:redo'
    ];

    const scheduleSave = () => {
      if (!this.document) {
        return;
      }

      this.autoSaveManager.scheduleSave(() => DocumentSerializer.serialize(this.document));
    };

    const unsubscribeList = events.map((eventName) => this.eventBus.on(eventName, scheduleSave));

    this._autoSaveCleanup = () => {
      unsubscribeList.forEach((unsubscribe) => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      });
      this._autoSaveCleanup = null;
    };
  }

  /**
   * Настраивает обработчики событий от текстовых блоков
   * @private
   */
  _setupTextBlockHandlers() {
    // Обработка slash-команд
    this.eventBus.on('textblock:slash-command', ({ config, blockId }) => {
      this.createBlock(config);
    });

    // Обработка markdown-шорткатов
    this.eventBus.on('textblock:markdown-shortcut', ({ match, blockId }) => {
      this._handleMarkdownShortcut(match, blockId);
    });

    // Обработка изменений содержимого текстовых блоков
    this.eventBus.on('textblock:content-changed', ({ blockId, data }) => {
      this.updateBlock(blockId, data);
    });
  }

  /**
   * Настраивает обработчики клавиатуры для Clipboard
   * @private
   */
  _setupKeyboardHandlers() {
    console.log('EditorCore: setting up keyboard handlers, container:', this.container);

    if (!this.container) {
      console.error('EditorCore: cannot setup keyboard handlers - container is null');
      return;
    }

    // Обработка глобальных горячих клавиш на document (чтобы работало везде)
    this._keyboardHandler = (e) => {
      const activeElement = document.activeElement;
      const code = e.code || '';
      const isModifierPressed = e.ctrlKey || e.metaKey;

      // Логируем ВСЕ нажатия клавиш с Ctrl/Meta для отладки
      if (isModifierPressed) {
        console.log('⌨️ Keyboard event:', e.key, 'code:', code, 'activeElement:', activeElement?.tagName);
      }

      const isNativeEditingContext = this._isNativeTextEditingContext(activeElement);
      const isActiveInEditor = () => {
        return this.container.contains(activeElement) ||
          activeElement === this.container ||
          activeElement === document.body ||
          activeElement === document.documentElement ||
          activeElement === null;
      };

      // Используем e.code вместо e.key для независимости от раскладки клавиатуры
      // e.code всегда возвращает физическую клавишу (KeyC, KeyV и т.д.)
      const isCopyKey = code === 'KeyC' || code === 'Keyc';
      const isPasteKey = code === 'KeyV' || code === 'Keyv';
      const isUndoKey = code === 'KeyZ' || code === 'Keyz';
      const isRedoKey = code === 'KeyY' || code === 'Keyy';

      // Обработка Undo (Ctrl/Cmd + Z без Shift)
      if (isModifierPressed && !e.shiftKey && !e.altKey && isUndoKey) {
        if (isNativeEditingContext) {
          return; // не перехватываем, если редактируется текст
        }

        if (!isActiveInEditor()) {
          return;
        }

        e.preventDefault();
        const undone = this.undo();
        console.log('History: undo triggered', undone);
        return;
      }

      // Обработка Redo (Ctrl/Cmd + Shift + Z или Ctrl/Cmd + Y)
      const isRedoShortcut = isModifierPressed && !e.altKey && (
        (isUndoKey && e.shiftKey) ||
        (isRedoKey && !e.shiftKey)
      );

      if (isRedoShortcut) {
        if (isNativeEditingContext) {
          return; // не перехватываем, если редактируется текст
        }

        if (!isActiveInEditor()) {
          return;
        }

        e.preventDefault();
        const redone = this.redo();
        console.log('History: redo triggered', redone);
        return;
      }

      // Логируем ВСЕ нажатия Ctrl+C для отладки
      if (isModifierPressed && isCopyKey) {
        console.log('🔵 Keyboard: Ctrl+C detected!', {
          key: e.key,
          code,
          activeElement: activeElement?.tagName,
          isContentEditable: activeElement?.isContentEditable,
          containerFocused: activeElement === this.container,
          hasSelection: this.controller?.selection?.getSelected()?.length || 0
        });
      }

      // Ctrl+C или Cmd+C - копирование (используем e.code для независимости от раскладки)
      if (isModifierPressed && isCopyKey && !e.shiftKey && !e.altKey) {
        // Проверяем, не редактируется ли текстовый блок
        if (isNativeEditingContext) {
          // Если редактируется текстовый блок, не перехватываем (стандартное копирование текста)
          console.log('Clipboard: skipping - contentEditable element');
          return;
        }

        // Проверяем, что фокус в области редактора или на странице (для работы везде)
        // Разрешаем работу, если активный элемент в контейнере или это body/document
        const inEditor = isActiveInEditor();

        console.log('Clipboard: isInEditor:', inEditor);

        if (!inEditor) {
          console.log('Clipboard: skipping - not in editor');
          return;
        }

        e.preventDefault();
        console.log('Clipboard: calling _handleCopy()');
        this._handleCopy();
        return;
      }

      // Ctrl+V или Cmd+V - вставка (используем e.code для независимости от раскладки)
      if (isModifierPressed && isPasteKey && !e.shiftKey && !e.altKey) {
        // Проверяем, не редактируется ли текстовый блок
        if (isNativeEditingContext) {
          // Если редактируется текстовый блок, не перехватываем (стандартная вставка текста)
          return;
        }

        // Проверяем, что фокус в области редактора или на странице (для работы везде)
        // Разрешаем работу, если активный элемент в контейнере или это body/document
        const inEditor = isActiveInEditor();

        if (!inEditor) {
          return;
        }

        e.preventDefault();
        console.log('Clipboard: Ctrl+V pressed, activeElement:', activeElement);
        this._handlePaste();
        return;
      }

      // Esc - снятие выделения
      if (e.key === 'Escape' && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
        // Проверяем, не редактируется ли текстовый блок
        if (activeElement && this._isNativeTextEditingContext(activeElement)) {
          // Если редактируется текстовый блок, не перехватываем
          return;
        }

        // Проверяем, что фокус в области редактора
        const isInEditor = this.container.contains(activeElement) ||
          activeElement === this.container ||
          activeElement === document.body ||
          activeElement === document.documentElement;

        if (isInEditor) {
          // Снимаем выделение со всех блоков
          this.controller.selection.clear();
          this._updateBlockSelection();
          console.log('Selection cleared');
        }
      }
    };

    // Добавляем обработчик с capture=true, чтобы перехватить событие раньше
    document.addEventListener('keydown', this._keyboardHandler, true);
    console.log('EditorCore: keyboard handler attached to document');
  }

  /**
   * Обрабатывает markdown-шорткат
   * @private
   */
  _handleMarkdownShortcut(match, blockId) {
    const { action } = match;

    if (action.type === 'section') {
      // Создаем секцию
      this.createBlock({
        type: 'section',
        level: action.level || 2
      });
    } else if (action.type === 'format') {
      // TODO: Применить форматирование к тексту
      // Это будет реализовано позже с InlineFormatter
    } else if (action.type === 'block') {
      // TODO: Создать блок (например, divider)
    }
  }

  /**
   * Загружает документ в редактор
   * @param {Document} document
   */
  loadDocument(document) {
    this.document = document;

    if (this.documentRenderer) {
      this.documentRenderer.render(document);
      // Настраиваем Drag & Drop после рендеринга
      this._setupDragAndDrop();
    }

    this.eventBus.emit('document:loaded', { document });
  }

  /**
   * Получает текущий документ
   * @returns {Document|null}
   */
  getDocument() {
    return this.document;
  }

  /**
   * Получает DocumentRenderer
   * @returns {DocumentRenderer|null}
   */
  getRenderer() {
    return this.documentRenderer;
  }

  /**
   * Создает новый блок в документе
   * @param {Object} blockConfig - конфигурация блока из SlashCommands
   * @param {number} [position] - позиция для вставки
   * @returns {string|null} - ID созданного блока
   */
  createBlock(blockConfig, position = null, initialData = null) {
    if (!this.document) return null;

    // Генерируем ID блока
    const blockId = `block-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

    // Определяем позицию
    let blockPosition = position;
    if (blockPosition === null) {
      blockPosition = this.document.blocks.length > 0
        ? Math.max(...this.document.blocks.map(b => b.position)) + 1
        : 0;
    }

    // Создаем данные блока
    // Если переданы initialData, используем их, иначе используем значения по умолчанию
    const defaultData = this._getDefaultBlockData(blockConfig);
    const blockData = {
      id: blockId,
      type: blockConfig.type,
      position: blockPosition,
      parentId: null,
      protected: false,
      data: initialData ? { ...defaultData, ...initialData } : defaultData
    };

    // Создаем команду
    const command = new CreateBlockCommand(
      blockData,
      (data) => this._doCreateBlock(data),
      (id) => this._doDeleteBlock(id)
    );

    // Выполняем через HistoryManager
    if (this.historyManager) {
      this.historyManager.execute(command);
    } else {
      command.execute(this.stateManager);
    }

    return blockId;
  }

  /**
   * Внутренний метод для создания блока (без истории)
   * @private
   */
  _doCreateBlock(blockData) {
    if (!this.document) return null;

    this.document.addBlock(blockData);

    // Находим позицию для вставки в DOM
    const sortedBlocks = [...this.document.blocks].sort((a, b) => a.position - b.position);
    const insertIndex = sortedBlocks.findIndex(b => b.id === blockData.id);

    if (this.documentRenderer) {
      this.documentRenderer.renderBlock(blockData, insertIndex);
    }

    this.eventBus.emit('block:created', { block: blockData });
    return blockData.id;
  }

  /**
   * Удаляет блок из документа
   * @param {string} blockId
   */
  deleteBlock(blockId) {
    if (!this.document) return;

    const block = this.document.getBlock(blockId);
    if (!block) return;

    const command = new DeleteBlockCommand(
      blockId,
      (id) => this._doDeleteBlock(id),
      (blockData) => this._doCreateBlock(blockData)
    );

    if (this.historyManager) {
      this.historyManager.execute(command);
    } else {
      command.execute(this.stateManager);
    }
  }

  /**
   * Внутренний метод для удаления блока (без истории)
   * @private
   */
  _doDeleteBlock(blockId) {
    if (!this.document) return null;

    const block = this.document.getBlock(blockId);
    if (!block) return null;

    this.document.removeBlock(blockId);

    if (this.documentRenderer) {
      this.documentRenderer.removeBlock(blockId);
    }

    this.eventBus.emit('block:deleted', { blockId });
    return block;
  }

  /**
   * Обновляет данные блока в документе
   * @param {string} blockId
   * @param {Object} blockData - новые данные блока
   */
  updateBlock(blockId, blockData) {
    if (!this.document) return false;

    const block = this.document.getBlock(blockId);
    if (!block) return false;

    // Обновляем данные в документе
    const updated = this.document.updateBlock(blockId, { data: blockData });
    if (!updated) return false;

    // Обновляем рендеринг (опционально, если нужно перерендерить)
    // Для TextBlock мы не перерендериваем, так как он contentEditable
    // this.documentRenderer.updateBlock({ ...block, data: blockData });

    this.eventBus.emit('block:updated', { blockId, data: blockData });
    return true;
  }

  /**
   * Перемещает блок в документе
   * @param {string} blockId
   * @param {number} toPosition - новая позиция
   * @returns {boolean}
   */
  moveBlock(blockId, toPosition, toParentId = undefined) {
    if (!this.document) return false;

    const block = this.document.getBlock(blockId);
    if (!block) return false;

    const fromPosition = block.position;
    const fromParentId = block.parentId ?? null;
    const targetParentId = toParentId !== undefined ? toParentId : fromParentId;

    this._executeMoveCommand(
      blockId,
      { position: fromPosition, parentId: fromParentId },
      { position: toPosition, parentId: targetParentId }
    );
    return true;
  }

  /**
   * Настраивает Drag & Drop для блоков
   * @private
   */
  _setupDragAndDrop() {
    if (!this.documentRenderer || !this.dragManager) return;

    // Регистрируем все блоки как draggable
    this.document.blocks.forEach(blockData => {
      const blockElement = this.documentRenderer.getBlockElement(blockData.id);
      if (!blockElement) return;

      // Пропускаем защищенные блоки
      if (blockData.protected) return;

      // Регистрируем блок как draggable
      this.dragManager.registerDraggable(
        blockElement,
        {
          blockId: blockData.id,
          type: blockData.type,
          position: blockData.position
        },
        (data) => {
          blockElement.classList.add('dragging');
          console.log('🔵 Drag started:', data.blockId);
          // Сохраняем высоту перетаскиваемого блока для визуализации
          this._draggedBlockHeight = blockElement.offsetHeight;
          // Показываем все drop zones при начале перетаскивания
          this._showAllDropZones();
          // Добавляем класс для визуальной индикации возможности drop
          this._addDropIndicatorsToBlocks();
          this.eventBus.emit('block:drag-start', { blockId: data.blockId });
        }
      );

      // Добавляем обработчики для drop на блок
      this._setupBlockDropHandlers(blockElement, blockData);

      // Удаляем класс при завершении перетаскивания
      blockElement.addEventListener('dragend', (e) => {
        console.log('🟢 Drag ended:', blockData.id, 'at coordinates:', e.clientX, e.clientY);
        blockElement.classList.remove('dragging');
        // Скрываем все drop zones
        this._hideAllDropZones();
        // Убираем индикаторы drop на блоках
        this._removeDropIndicatorsFromBlocks();
        // Убираем placeholder если есть
        this._removePlaceholder();
        this._draggedBlockHeight = null;
        this.eventBus.emit('block:drag-end', { blockId: blockData.id });
      });

      // Добавляем обработчик клика для выбора блока
      // Используем флаг для отслеживания, был ли drag
      let wasDragged = false;

      blockElement.addEventListener('dragstart', () => {
        wasDragged = true;
      });

      blockElement.addEventListener('dragend', () => {
        // Сбрасываем флаг после небольшой задержки
        setTimeout(() => {
          wasDragged = false;
        }, 100);
      });

      blockElement.addEventListener('click', (e) => {
        // Если был drag, не обрабатываем клик
        if (wasDragged) {
          wasDragged = false;
          return;
        }

        if (this._shouldIgnoreBlockClick(e.target, blockElement)) {
          return;
        }

        // Если зажат Shift, делаем диапазонный выбор
        if (e.shiftKey) {
          const anchorId = this.controller.selection.getAnchor();
          if (anchorId && anchorId !== blockData.id) {
            // Выбираем диапазон от anchor до текущего блока
            this.controller.selection.selectRange(
              anchorId,
              blockData.id,
              (startId, endId) => this._getBlocksBetween(startId, endId)
            );
          } else {
            // Если нет anchor, просто выбираем блок
            this.controller.selection.select(blockData.id);
          }
        } else if (e.ctrlKey || e.metaKey) {
          // Если зажат Ctrl/Cmd, добавляем к выделению
          this.controller.selection.toggle(blockData.id);
        } else {
          // Иначе заменяем выделение
          this.controller.selection.select(blockData.id);
        }

        // Обновляем визуальное выделение
        this._updateBlockSelection();

        // Устанавливаем фокус на контейнер для работы горячих клавиш
        // ВАЖНО: делаем это после обновления выделения
        if (this.container) {
          this.container.focus();
        }

        console.log('Block clicked:', blockData.id, 'Selected:', this.controller.selection.getSelected(), 'activeElement:', document.activeElement);
      });
    });

    // Создаем drop zones между блоками
    this._createDropZones();

    // Настраиваем глобальный обработчик dragover для определения активной зоны по координатам
    this._setupGlobalDragHandler();
  }

  /**
   * Проверяет, следует ли игнорировать клик по блоку (например, если пользователь взаимодействует с вложенным редактором)
   * @param {EventTarget} target
   * @param {HTMLElement} blockElement
   * @returns {boolean}
   * @private
   */
  _shouldIgnoreBlockClick(target, blockElement) {
    if (!(target instanceof Element)) {
      return false;
    }

    if (target.isContentEditable && target !== blockElement) {
      return true;
    }

    const interactiveTags = new Set(['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'LABEL']);
    if (interactiveTags.has(target.tagName)) {
      return true;
    }

    if (target.closest('.monaco-editor')) {
      return true;
    }

    if (target.closest('.code-editor-container')) {
      return true;
    }

    if (target.closest('.diagram-code-editor')) {
      return true;
    }

    return false;
  }

  /**
   * Проверяет, находится ли фокус в нативном текстовом/кодовом редакторе, где нужно оставить системное поведение
   * @param {Element|null} element
   * @returns {boolean}
   * @private
   */
  _isNativeTextEditingContext(element) {
    if (!element || element === this.container) {
      return false;
    }

    if (element instanceof HTMLInputElement) {
      const textTypes = new Set([
        'text', 'search', 'url', 'tel', 'password', 'email', 'number'
      ]);
      return textTypes.has(element.type || 'text');
    }

    if (element instanceof HTMLTextAreaElement) {
      return true;
    }

    if (element.isContentEditable) {
      return true;
    }

    if (element.closest('.code-editor-container')) {
      return true;
    }

    if (element.closest('.diagram-code-editor')) {
      return true;
    }

    if (element.closest('.monaco-editor')) {
      return true;
    }

    return false;
  }

  /**
   * Создает drop zones между блоками
   * @private
   */
  _createDropZones() {
    if (!this.documentRenderer || !this.dragManager) return;

    const container = this.documentRenderer.container;

    // Получаем только блоки верхнего уровня (без parentId), отсортированные по позиции
    const topLevelBlocks = this.document.blocks
      .filter(b => !b.parentId)
      .sort((a, b) => a.position - b.position);

    console.log('_createDropZones: creating zones for', topLevelBlocks.length, 'top-level blocks');

    // Получаем DOM-элементы блоков в правильном порядке
    const blockElements = topLevelBlocks
      .map(b => this.documentRenderer.getBlockElement(b.id))
      .filter(el => el !== null);

    // Удаляем старые drop zones
    const oldDropZones = container.querySelectorAll('.drop-zone-indicator');
    oldDropZones.forEach(zone => zone.remove());

    // Сохраняем ссылки на drop zones для управления видимостью
    this._dropZones = [];

    // Создаем drop zones между блоками и в начале/конце
    for (let i = 0; i <= blockElements.length; i++) {
      const dropZone = document.createElement('div');
      dropZone.className = 'drop-zone-indicator';
      dropZone.setAttribute('data-drop-index', i);

      // Вставляем drop zone
      if (i === 0) {
        container.insertBefore(dropZone, blockElements[0] || null);
      } else if (i === blockElements.length) {
        container.appendChild(dropZone);
      } else {
        container.insertBefore(dropZone, blockElements[i]);
      }

      // Сохраняем ссылку
      this._dropZones.push(dropZone);

      // Регистрируем обработчики для drop zone
      // dragover нужен для разрешения drop
      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation(); // Останавливаем всплытие, чтобы глобальный обработчик не мешал
        e.dataTransfer.dropEffect = 'move';
      });

      dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Drop zone drop event, index:', dropZone.getAttribute('data-drop-index'));

        // Пытаемся получить данные из dataTransfer (более надежно)
        let dragData = null;
        try {
          const dataStr = e.dataTransfer.getData('application/json');
          if (dataStr) {
            dragData = JSON.parse(dataStr);
            console.log('Drop zone: got data from dataTransfer:', dragData);
          }
        } catch (err) {
          console.warn('Drop zone: failed to parse dataTransfer:', err);
        }

        // Fallback: используем dragData из DragManager
        if (!dragData) {
          dragData = this.dragManager.dragData;
          console.log('Drop zone: using dragData from DragManager:', dragData);
        }

        if (dragData) {
          const targetIndex = parseInt(dropZone.getAttribute('data-drop-index'));
          console.log('Handling drop at index:', targetIndex, 'dragData:', dragData);
          this._handleBlockDrop(dragData, targetIndex);
        } else {
          console.warn('Drop zone: no dragData available from both sources');
        }
      });
    }
  }

  /**
   * Добавляет визуальные индикаторы возможности drop на блоки
   * @private
   */
  _addDropIndicatorsToBlocks() {
    if (!this.documentRenderer) return;

    this.document.blocks.forEach(blockData => {
      const blockElement = this.documentRenderer.getBlockElement(blockData.id);
      if (!blockElement) return;

      // Пропускаем защищенные блоки
      if (blockData.protected) return;

      const canContain = this._canBlockContainChildren(blockData.type);
      if (canContain) {
        blockElement.classList.add('drop-target-container');
      } else {
        blockElement.classList.add('drop-target-before');
      }
    });
  }

  /**
   * Убирает визуальные индикаторы возможности drop на блоки
   * @private
   */
  _removeDropIndicatorsFromBlocks() {
    if (!this.documentRenderer) return;

    this.document.blocks.forEach(blockData => {
      const blockElement = this.documentRenderer.getBlockElement(blockData.id);
      if (!blockElement) return;

      blockElement.classList.remove('drop-target-container', 'drop-target-before', 'drop-target-active');
    });
  }

  /**
   * Настраивает обработчики drop для блока
   * @param {HTMLElement} blockElement
   * @param {Object} blockData
   * @private
   */
  _setupBlockDropHandlers(blockElement, blockData) {
    // Пропускаем защищенные блоки
    if (blockData.protected) return;

    let isOverBlock = false;
    let insertInside = false;

    blockElement.addEventListener('dragover', (e) => {
      // Проверяем, что перетаскивается блок (не текст)
      if (!this.dragManager.dragData || !this.dragManager.dragData.blockId) {
        return;
      }

      // Не обрабатываем, если перетаскивается сам блок
      if (this.dragManager.dragData.blockId === blockData.id) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'move';

      isOverBlock = true;

      // Определяем, вставлять внутрь или перед блоком
      const canContain = this._canBlockContainChildren(blockData.type);
      const rect = blockElement.getBoundingClientRect();
      const mouseY = e.clientY;
      const blockCenterY = rect.top + rect.height / 2;

      // Если блок может содержать дочерние элементы, проверяем позицию мыши
      if (canContain) {
        // Если мышь в верхней половине - вставляем перед, в нижней - внутрь
        insertInside = mouseY > blockCenterY;
      } else {
        // Если блок не может содержать дочерние элементы, всегда вставляем перед
        insertInside = false;
      }

      // Визуальная индикация
      blockElement.classList.remove('drop-target-container', 'drop-target-before', 'drop-target-active');
      if (insertInside && canContain) {
        blockElement.classList.add('drop-target-active', 'drop-target-container');
      } else {
        blockElement.classList.add('drop-target-active', 'drop-target-before');
      }

      // Показываем placeholder после задержки
      if (!this._blockHoverStart) {
        this._blockHoverStart = Date.now();
        this._blockHoverTarget = blockElement;
      } else if (this._blockHoverTarget === blockElement) {
        const hoverDuration = Date.now() - this._blockHoverStart;
        if (hoverDuration > 300) {
          this._showBlockPlaceholder(blockElement, insertInside && canContain);
        }
      }
    });

    blockElement.addEventListener('dragleave', (e) => {
      // Проверяем, что мы действительно вышли за пределы блока
      if (!blockElement.contains(e.relatedTarget)) {
        isOverBlock = false;
        blockElement.classList.remove('drop-target-active');
        // Сбрасываем отслеживание hover
        this._blockHoverStart = null;
        this._blockHoverTarget = null;
        this._removePlaceholder();
      }
    });

    blockElement.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (!isOverBlock) return;

      // Получаем данные из dataTransfer или DragManager
      let dragData = null;
      try {
        const dataStr = e.dataTransfer.getData('application/json');
        if (dataStr) {
          dragData = JSON.parse(dataStr);
        }
      } catch (err) {
        console.warn('Block drop: failed to parse dataTransfer:', err);
      }

      if (!dragData) {
        dragData = this.dragManager.dragData;
      }

      if (dragData && dragData.blockId) {
        console.log('Block drop: dropping on block', blockData.id, 'insertInside:', insertInside);
        this._handleBlockDropOnBlock(dragData, blockData.id, insertInside);
      }

      isOverBlock = false;
      blockElement.classList.remove('drop-target-active');
      this._removeDropIndicatorsFromBlocks();
      // Сбрасываем отслеживание hover
      this._blockHoverStart = null;
      this._blockHoverTarget = null;
      this._removePlaceholder();
    });
  }

  /**
   * Убирает placeholder для перетаскивания
   * @private
   */
  _removePlaceholder() {
    const existingPlaceholder = this.documentRenderer?.container?.querySelector('.drag-placeholder');
    if (existingPlaceholder) {
      existingPlaceholder.remove();
    }
  }

  /**
   * Создает и вставляет placeholder для визуализации места вставки
   * @param {HTMLElement} dropZone
   * @private
   */
  _showPlaceholder(dropZone) {
    if (!this._draggedBlockHeight) return;

    // Проверяем, не показан ли уже placeholder
    const existing = this.documentRenderer?.container?.querySelector('.drag-placeholder');
    if (existing && existing.nextSibling === dropZone.nextSibling) {
      return; // Placeholder уже на месте, не пересоздаем
    }

    // Убираем старый placeholder
    this._removePlaceholder();

    // Создаем новый placeholder
    const placeholder = document.createElement('div');
    placeholder.className = 'drag-placeholder';
    placeholder.style.height = `${this._draggedBlockHeight}px`;

    // Вставляем placeholder после drop zone
    dropZone.parentNode.insertBefore(placeholder, dropZone.nextSibling);
  }

  /**
   * Показывает placeholder при drop на блок
   * @param {HTMLElement} blockElement
   * @param {boolean} insertInside
   * @private
   */
  _showBlockPlaceholder(blockElement, insertInside) {
    if (!this._draggedBlockHeight) return;

    // Убираем старый placeholder
    this._removePlaceholder();

    // Создаем новый placeholder
    const placeholder = document.createElement('div');
    placeholder.className = 'drag-placeholder';
    placeholder.style.height = `${this._draggedBlockHeight}px`;

    if (insertInside) {
      // Вставляем внутрь блока (в конец)
      placeholder.style.marginLeft = '20px'; // Отступ для визуализации вложенности
      blockElement.appendChild(placeholder);
    } else {
      // Вставляем перед блоком
      blockElement.parentNode.insertBefore(placeholder, blockElement);
    }
  }

  /**
   * Настраивает глобальный обработчик dragover для определения активной зоны по координатам
   * @private
   */
  _setupGlobalDragHandler() {
    if (!this.documentRenderer) return;

    const container = this.documentRenderer.container;
    const tolerance = 10; // Допуск +/-10px

    // Обработчик dragover на контейнере
    container.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';

      if (!this._dropZones || this._dropZones.length === 0) return;

      // Если событие уже обработано drop zone, не обрабатываем дальше
      if (e.target.classList && e.target.classList.contains('drop-zone-indicator')) {
        return;
      }

      const mouseY = e.clientY;

      // Деактивируем все зоны
      this._dropZones.forEach(zone => {
        zone.classList.remove('drop-zone-active');
      });

      // Находим активную зону по вертикальной координате с допуском
      // Используем расширенную область вокруг зоны (верхняя граница +/- допуск)
      let activeZone = null;
      let minDistance = Infinity;

      this._dropZones.forEach(zone => {
        const rect = zone.getBoundingClientRect();
        // Используем верхнюю границу зоны как точку отсчета
        const zoneTopY = rect.top;
        const zoneBottomY = rect.bottom;

        // Проверяем, попадает ли курсор в расширенную область зоны
        // Расширяем область на tolerance пикселей вверх и вниз
        const expandedTop = zoneTopY - tolerance;
        const expandedBottom = zoneBottomY + tolerance;

        if (mouseY >= expandedTop && mouseY <= expandedBottom) {
          // Вычисляем расстояние до центра зоны для выбора ближайшей
          const zoneCenterY = (zoneTopY + zoneBottomY) / 2;
          const distance = Math.abs(mouseY - zoneCenterY);

          if (distance < minDistance) {
            minDistance = distance;
            activeZone = zone;
          }
        }
      });

      // Активируем найденную зону
      if (activeZone) {
        activeZone.classList.add('drop-zone-active');
        const dropIndex = activeZone.getAttribute('data-drop-index');
        console.log('🎯 Drop zone active:', dropIndex, 'at Y:', mouseY);

        // Отслеживаем время наведения с защитой от мерцания
        if (!this._lastActiveZone || this._lastActiveZone !== activeZone) {
          // Сменилась зона - начинаем отсчет заново
          this._lastActiveZone = activeZone;
          this._hoverStartTime = Date.now();
          // Не удаляем placeholder сразу - только если прошло достаточно времени
          const timeSinceLastChange = Date.now() - (this._lastZoneChangeTime || 0);
          if (timeSinceLastChange > 100) {
            this._removePlaceholder();
          }
          this._lastZoneChangeTime = Date.now();
        } else {
          const hoverDuration = Date.now() - this._hoverStartTime;
          // Показываем placeholder после 300ms наведения
          if (hoverDuration > 300) {
            this._showPlaceholder(activeZone);
          }
        }
      } else {
        // Сбрасываем отслеживание
        this._lastActiveZone = null;
        this._hoverStartTime = null;
        this._removePlaceholder();
      }
    });

    // Обработчик dragleave для скрытия зон при выходе за пределы контейнера
    container.addEventListener('dragleave', (e) => {
      // Проверяем, что мы действительно вышли за пределы контейнера
      if (!container.contains(e.relatedTarget)) {
        this._dropZones.forEach(zone => {
          zone.classList.remove('drop-zone-active');
        });
      }
    });
  }

  /**
   * Показывает все drop zones
   * @private
   */
  _showAllDropZones() {
    if (!this._dropZones) return;
    this._dropZones.forEach(zone => {
      zone.classList.add('drop-zone-visible');
    });
  }

  /**
   * Скрывает все drop zones
   * @private
   */
  _hideAllDropZones() {
    if (!this._dropZones) return;
    this._dropZones.forEach(zone => {
      zone.classList.remove('drop-zone-visible', 'drop-zone-active');
    });
  }

  /**
   * Определяет, может ли блок содержать дочерние элементы
   * @param {string} blockType
   * @returns {boolean}
   * @private
   */
  _canBlockContainChildren(blockType) {
    // Блоки, которые могут содержать дочерние элементы
    const containerBlocks = ['section', 'header', 'footer'];
    return containerBlocks.includes(blockType);
  }

  /**
   * Обрабатывает drop блока на другой блок
   * @param {Object} dragData
   * @param {string} targetBlockId
   * @param {boolean} insertInside - вставлять внутрь или перед блоком
   * @private
   */
  _handleBlockDropOnBlock(dragData, targetBlockId, insertInside = false) {
    if (!this.document || !dragData.blockId) {
      console.warn('_handleBlockDropOnBlock: invalid dragData or document');
      return;
    }

    const draggedBlock = this.document.getBlock(dragData.blockId);
    const targetBlock = this.document.getBlock(targetBlockId);

    if (!draggedBlock || !targetBlock) {
      console.warn('_handleBlockDropOnBlock: blocks not found');
      return;
    }

    // Нельзя вставлять блок в самого себя
    if (draggedBlock.id === targetBlock.id) {
      console.log('_handleBlockDropOnBlock: cannot drop block on itself');
      return;
    }

    // Нельзя вставлять блок в свой дочерний элемент
    if (this._isDescendant(draggedBlock.id, targetBlock.id)) {
      console.log('_handleBlockDropOnBlock: cannot drop parent into child');
      return;
    }

    const targetBlockType = targetBlock.type;
    const canContain = this._canBlockContainChildren(targetBlockType);

    if (insertInside && canContain) {
      // Вставляем внутрь блока
      console.log('_handleBlockDropOnBlock: inserting inside block', targetBlockId);

      // Получаем дочерние блоки целевого блока
      const childBlocks = this.document.blocks
        .filter(b => b.parentId === targetBlockId)
        .sort((a, b) => a.position - b.position);

      let newPosition;
      if (childBlocks.length === 0) {
        // Первый дочерний элемент
        newPosition = targetBlock.position + 0.1;
      } else {
        // После последнего дочернего элемента
        newPosition = Math.max(...childBlocks.map(b => b.position)) + 1;
      }

      const fromState = {
        position: draggedBlock.position,
        parentId: draggedBlock.parentId ?? null
      };
      const toState = {
        position: newPosition,
        parentId: targetBlockId
      };

      this._executeMoveCommand(dragData.blockId, fromState, toState);
    } else {
      // Вставляем перед блоком
      console.log('_handleBlockDropOnBlock: inserting before block', targetBlockId);

      // Получаем все блоки с тем же parentId, что и целевой блок
      const siblingBlocks = this.document.blocks
        .filter(b => b.id !== dragData.blockId && b.parentId === targetBlock.parentId)
        .sort((a, b) => a.position - b.position);

      const targetIndex = siblingBlocks.findIndex(b => b.id === targetBlockId);

      let newPosition;
      if (targetIndex === 0) {
        // Перед первым блоком
        newPosition = targetBlock.position - 1;
      } else {
        // Между блоками
        const prevBlock = siblingBlocks[targetIndex - 1];
        newPosition = (prevBlock.position + targetBlock.position) / 2;
      }

      const fromState = {
        position: draggedBlock.position,
        parentId: draggedBlock.parentId ?? null
      };
      const toState = {
        position: newPosition,
        parentId: targetBlock.parentId ?? null
      };

      this._executeMoveCommand(dragData.blockId, fromState, toState);
    }

    this.eventBus.emit('block:drop-applied', {
      blockId: dragData.blockId,
      targetBlockId,
      insertInside
    });
  }

  /**
   * Проверяет, является ли blockId потомком ancestorId
   * @param {string} blockId
   * @param {string} ancestorId
   * @returns {boolean}
   * @private
   */
  _isDescendant(blockId, ancestorId) {
    let current = this.document.getBlock(blockId);
    while (current && current.parentId) {
      if (current.parentId === ancestorId) {
        return true;
      }
      current = this.document.getBlock(current.parentId);
    }
    return false;
  }

  /**
   * Обрабатывает drop блока на drop zone
   * @private
   */
  _handleBlockDrop(dragData, targetIndex) {
    if (!this.document || !dragData.blockId) {
      console.warn('_handleBlockDrop: invalid dragData or document');
      return;
    }

    const draggedBlock = this.document.getBlock(dragData.blockId);
    if (!draggedBlock) {
      console.warn('_handleBlockDrop: dragged block not found:', dragData.blockId);
      return;
    }

    // Получаем все блоки верхнего уровня (без parentId), отсортированные по позиции
    const allTopLevelBlocks = [...this.document.blocks]
      .filter(b => !b.parentId)
      .sort((a, b) => a.position - b.position);

    // Находим текущий индекс перетаскиваемого блока
    const draggedIndex = allTopLevelBlocks.findIndex(b => b.id === dragData.blockId);

    console.log('_handleBlockDrop: draggedBlock:', dragData.blockId, 'draggedIndex:', draggedIndex, 'targetIndex:', targetIndex, 'total blocks:', allTopLevelBlocks.length);

    // Корректируем targetIndex, если перетаскиваем вниз
    // Когда мы перетаскиваем блок вниз, целевой индекс нужно уменьшить на 1,
    // потому что блок удаляется из исходной позиции перед вставкой
    let adjustedTargetIndex = targetIndex;
    if (draggedIndex !== -1 && draggedIndex < targetIndex) {
      adjustedTargetIndex = targetIndex - 1;
      console.log('_handleBlockDrop: adjusting target index for downward drag:', targetIndex, '->', adjustedTargetIndex);
    }

    // Исключаем перемещаемый блок из списка
    const topLevelBlocks = allTopLevelBlocks.filter(b => b.id !== dragData.blockId);

    let newPosition;
    if (adjustedTargetIndex === 0) {
      // В начало - перед первым блоком
      newPosition = topLevelBlocks.length > 0 ? topLevelBlocks[0].position - 1 : 0;
    } else if (adjustedTargetIndex >= topLevelBlocks.length) {
      // В конец - после последнего блока
      newPosition = topLevelBlocks.length > 0
        ? Math.max(...topLevelBlocks.map(b => b.position)) + 1
        : 0;
    } else {
      // Между блоками
      const prevBlock = topLevelBlocks[adjustedTargetIndex - 1];
      const nextBlock = topLevelBlocks[adjustedTargetIndex];
      newPosition = (prevBlock.position + nextBlock.position) / 2;
      console.log('_handleBlockDrop: inserting between', prevBlock.id, '(pos:', prevBlock.position, ') and', nextBlock.id, '(pos:', nextBlock.position, ')');
    }

    console.log('_handleBlockDrop: calculated newPosition:', newPosition, 'current position:', draggedBlock.position);

    const fromState = {
      position: draggedBlock.position,
      parentId: draggedBlock.parentId ?? null
    };

    const toState = {
      position: newPosition,
      parentId: null
    };

    this._executeMoveCommand(dragData.blockId, fromState, toState);
  }

  /**
   * Обрабатывает копирование блоков
   * @private
   */
  async _handleCopy() {
    if (!this.document || !this.clipboardManager) {
      console.log('Clipboard: document or clipboardManager not available');
      return;
    }

    // Получаем выбранные блоки
    const selectedBlockIds = this.controller.selection.getSelected();
    console.log('Clipboard: selected blocks:', selectedBlockIds);

    if (selectedBlockIds.length === 0) {
      // Если нет выбранных блоков, ничего не копируем
      console.log('Clipboard: no blocks selected');
      return;
    }

    // Получаем данные выбранных блоков
    const blocksToCopy = selectedBlockIds
      .map(id => this.document.getBlock(id))
      .filter(block => block !== undefined)
      .sort((a, b) => a.position - b.position); // Сортируем по позиции

    if (blocksToCopy.length === 0) {
      console.log('Clipboard: no valid blocks to copy');
      return;
    }

    console.log('Clipboard: copying blocks:', blocksToCopy.map(b => ({ id: b.id, type: b.type })));

    // Копируем блоки в буфер обмена
    try {
      await this.clipboardManager.copy(blocksToCopy);
      console.log('Clipboard: blocks copied successfully');
      this.eventBus.emit('blocks:copied', { blockIds: selectedBlockIds });
    } catch (error) {
      console.error('Clipboard: failed to copy blocks:', error);
    }
  }

  /**
   * Обрабатывает вставку блоков
   * @private
   */
  async _handlePaste() {
    if (!this.document || !this.clipboardManager) {
      console.log('Clipboard: document or clipboardManager not available for paste');
      return;
    }

    try {
      console.log('Clipboard: reading from clipboard...');
      // Получаем блоки из буфера обмена
      const pastedBlocks = await this.clipboardManager.paste();
      console.log('Clipboard: pasted blocks:', pastedBlocks);

      if (!pastedBlocks || pastedBlocks.length === 0) {
        // Если нет блоков для вставки, ничего не делаем
        console.log('Clipboard: no blocks to paste');
        return;
      }

      // Определяем позицию вставки
      const selectedBlockIds = this.controller.selection.getSelected();
      let insertPosition = null;

      if (selectedBlockIds.length > 0) {
        // Вставляем ПЕРЕД первым выбранным блоком (по позиции)
        // ВАЖНО: получаем актуальные блоки из документа после сортировки
        const topLevelBlocks = [...this.document.blocks]
          .filter(b => !b.parentId)
          .sort((a, b) => a.position - b.position);

        // Находим первый выбранный блок в отсортированном массиве
        let firstSelectedIndex = -1;
        let firstSelectedBlock = null;

        for (let i = 0; i < topLevelBlocks.length; i++) {
          if (selectedBlockIds.includes(topLevelBlocks[i].id)) {
            firstSelectedIndex = i;
            firstSelectedBlock = topLevelBlocks[i];
            break; // Берем первый найденный (с минимальной позицией)
          }
        }

        console.log('Clipboard: first selected block:', firstSelectedBlock?.id, 'position:', firstSelectedBlock?.position, 'index:', firstSelectedIndex);

        if (firstSelectedIndex === -1 || !firstSelectedBlock) {
          // Блок не найден, вставляем в конец
          insertPosition = this.document.blocks.length > 0
            ? Math.max(...this.document.blocks.map(b => b.position)) + 1
            : 0;
          console.log('Clipboard: selected block not found, inserting at end, position:', insertPosition);
        } else {
          // Вставляем перед выделенным блоком
          // Используем position - 1, если позиция > 0, иначе 0
          insertPosition = firstSelectedBlock.position > 0
            ? firstSelectedBlock.position - 1
            : 0;
          console.log('Clipboard: inserting before selected block', firstSelectedBlock.id, 'position:', firstSelectedBlock.position, '-> insert at:', insertPosition);
        }
      } else {
        // Если нет выбранных блоков, вставляем в конец
        insertPosition = this.document.blocks.length > 0
          ? Math.max(...this.document.blocks.map(b => b.position)) + 1
          : 0;
        console.log('Clipboard: no selection, inserting at end, position:', insertPosition);
      }

      // Вставляем блоки
      await this._pasteBlocks(pastedBlocks, insertPosition);
    } catch (error) {
      console.error('Failed to paste blocks:', error);
    }
  }

  /**
   * Вставляет блоки в документ
   * @private
   */
  async _pasteBlocks(blocksData, startPosition) {
    if (!this.document || !blocksData || blocksData.length === 0) {
      console.log('Clipboard: _pasteBlocks - invalid data');
      return;
    }

    console.log('Clipboard: _pasteBlocks - inserting', blocksData.length, 'blocks at position', startPosition);

    const insertedBlockIds = [];

    // Вычисляем позиции для всех блоков
    // Просто инкрементируем от startPosition
    let positions = [];

    if (startPosition !== null) {
      // Просто инкрементируем от startPosition
      // Если startPosition = 0, начинаем с 0, иначе с startPosition
      positions = blocksData.map((_, index) => startPosition + index);
    } else {
      // Вставка в конец
      const maxPosition = this.document.blocks.length > 0
        ? Math.max(...this.document.blocks.map(b => b.position))
        : -1;
      positions = blocksData.map((_, index) => maxPosition + 1 + index);
    }

    console.log('Clipboard: calculated positions:', positions);

    // Создаем блоки через команды (для поддержки undo/redo)
    // Используем Promise.all для последовательного создания с ожиданием рендеринга
    const createPromises = blocksData.map(async (blockData, index) => {
      const newPosition = positions[index];

      console.log('Clipboard: creating block', blockData.type, 'at position', newPosition, 'data:', blockData);

      // Создаем конфигурацию блока для createBlock
      const blockConfig = {
        type: blockData.type,
        ...(blockData.data && blockData.data.language && { language: blockData.data.language })
      };

      // Создаем блок через createBlock с начальными данными (с поддержкой undo/redo)
      const createdId = this.createBlock(blockConfig, newPosition, blockData.data);

      if (createdId) {
        console.log('Clipboard: block created with ID', createdId, 'with data:', blockData.data);
        return createdId;
      } else {
        console.error('Clipboard: failed to create block', blockData.type);
        return null;
      }
    });

    // Ждем создания всех блоков
    const createdIds = await Promise.all(createPromises);
    insertedBlockIds.push(...createdIds.filter(id => id !== null));

    // Перенастраиваем Drag & Drop для новых блоков
    if (insertedBlockIds.length > 0) {
      this._setupDragAndDrop();
    }

    // Выделяем вставленные блоки
    this.controller.selection.clear();
    insertedBlockIds.forEach(blockId => {
      this.controller.selection.toggle(blockId);
    });

    // Обновляем визуальное выделение
    this._updateBlockSelection();

    this.eventBus.emit('blocks:pasted', { blockIds: insertedBlockIds });
  }

  /**
   * Применяет перемещение блока к состоянию документа без перерисовки
   * @param {string} blockId
   * @param {{position: number, parentId: string|null}} targetState
   * @param {{position: number, parentId: string|null}} [previousState]
   * @returns {boolean}
   * @private
   */
  _applyBlockMove(blockId, targetState, previousState = null) {
    if (!this.document) return false;

    const block = this.document.getBlock(blockId);
    if (!block) return false;

    const parentId = targetState.parentId !== undefined ? targetState.parentId : block.parentId ?? null;

    this.document.updateBlock(blockId, {
      position: targetState.position,
      parentId
    });

    if (this.eventBus) {
      this.eventBus.emit('block:moved', {
        blockId,
        from: previousState,
        to: targetState
      });
    }

    return true;
  }

  /**
   * Выполняет команду перемещения блока с поддержкой истории
   * @param {string} blockId
   * @param {{position: number, parentId: string|null}} fromState
   * @param {{position: number, parentId: string|null}} toState
   * @private
   */
  _executeMoveCommand(blockId, fromState, toState) {
    if (!fromState || !toState) return;

    const samePosition = fromState.position === toState.position;
    const sameParent = (fromState.parentId ?? null) === (toState.parentId ?? null);

    if (samePosition && sameParent) {
      return;
    }

    const command = new MoveBlockCommand(
      blockId,
      fromState,
      toState,
      (id, target, previous) => this._applyBlockMove(id, target, previous)
    );

    if (this.historyManager) {
      this.historyManager.execute(command);
    } else {
      command.execute(this.stateManager);
    }

    this._renderAfterStructuralChange();
  }

  /**
   * Полностью перерисовывает документ и восстанавливает взаимодействия после структурных изменений
   * @private
   */
  _renderAfterStructuralChange() {
    if (!this.document || !this.documentRenderer) {
      return;
    }

    this.documentRenderer.render(this.document);
    this._setupDragAndDrop();
    this._updateBlockSelection();
  }

  /**
   * Обновляет визуальное выделение блоков
   * @private
   */
  _updateBlockSelection() {
    if (!this.documentRenderer) return;

    // Убираем выделение со всех блоков
    const allBlocks = this.documentRenderer.container.querySelectorAll('.document-block');
    allBlocks.forEach(block => {
      block.classList.remove('block-selected');
    });

    // Добавляем выделение к выбранным блокам
    const selectedBlockIds = this.controller.selection.getSelected();
    selectedBlockIds.forEach(blockId => {
      const blockElement = this.documentRenderer.getBlockElement(blockId);
      if (blockElement) {
        blockElement.classList.add('block-selected');
      }
    });
  }

  /**
   * Получает ID всех блоков верхнего уровня между двумя блоками (включительно)
   * @param {string} startId - ID начального блока
   * @param {string} endId - ID конечного блока
   * @returns {string[]} - массив ID блоков между start и end (включительно)
   * @private
   */
  _getBlocksBetween(startId, endId) {
    if (!this.document) return [];

    // Получаем только блоки верхнего уровня (без parentId), отсортированные по позиции
    const topLevelBlocks = this.document.blocks
      .filter(b => !b.parentId)
      .sort((a, b) => a.position - b.position);

    // Находим индексы начального и конечного блоков
    const startIndex = topLevelBlocks.findIndex(b => b.id === startId);
    const endIndex = topLevelBlocks.findIndex(b => b.id === endId);

    // Если блоки не найдены, возвращаем пустой массив
    if (startIndex === -1 || endIndex === -1) {
      return [startId, endId].filter(id => id !== undefined);
    }

    // Определяем диапазон (от меньшего индекса к большему)
    const minIndex = Math.min(startIndex, endIndex);
    const maxIndex = Math.max(startIndex, endIndex);

    // Возвращаем ID всех блоков в диапазоне (включительно)
    const result = [];
    for (let i = minIndex; i <= maxIndex; i++) {
      result.push(topLevelBlocks[i].id);
    }

    return result;
  }

  /**
   * Получает данные по умолчанию для типа блока
   * @private
   */
  _getDefaultBlockData(blockConfig) {
    const defaults = {
      text: { text: '', format: {} },
      code: { code: '', language: blockConfig.language || 'bsl', lineNumbers: true },
      quote: { text: '', type: 'default' },
      image: { url: '', caption: '', alt: '' },
      table: { rows: [], columns: [] },
      section: { title: '', level: blockConfig.level || 1 }
    };

    return defaults[blockConfig.type] || {};
  }

  /**
   * Получает SlashCommands
   * @returns {SlashCommands}
   */
  getSlashCommands() {
    return this.slashCommands;
  }

  /**
   * Получает MarkdownShortcuts
   * @returns {MarkdownShortcuts}
   */
  getMarkdownShortcuts() {
    return this.markdownShortcuts;
  }

  /**
   * Выполняет команду Undo через HistoryManager
   * @returns {boolean}
   */
  undo() {
    if (!this.historyManager || typeof this.historyManager.undo !== 'function') {
      return false;
    }

    const result = this.historyManager.undo();
    if (result) {
      this._afterHistoryChange('undo');
    }
    return result;
  }

  /**
   * Выполняет команду Redo через HistoryManager
   * @returns {boolean}
   */
  redo() {
    if (!this.historyManager || typeof this.historyManager.redo !== 'function') {
      return false;
    }

    const result = this.historyManager.redo();
    if (result) {
      this._afterHistoryChange('redo');
    }
    return result;
  }

  /**
   * Выполняет обновление UI и состояний после вызова Undo/Redo
   * @param {('undo'|'redo')} action
   * @private
   */
  _afterHistoryChange(action) {
    this._syncSelectionWithDocument();
    this._renderAfterStructuralChange();

    if (this.eventBus) {
      this.eventBus.emit(`history:${action}`, {
        document: this.document,
        action
      });
    }
  }

  /**
   * Получает текущий документ
   * @returns {Document|null}
   */
  getDocument() {
    return this.document;
  }

  /**
   * Экспортирует документ в указанном формате
   * @param {string} format - формат экспорта ('json', 'html', 'xml', 'pdf')
   * @param {Object} [options] - опции экспорта
   * @returns {Promise<any>}
   */
  async exportDocument(format, options = {}) {
    if (!this.document) {
      throw new Error('No document loaded');
    }

    if (!this.exportManager) {
      throw new Error('ExportManager not initialized');
    }

    // Сериализуем документ для экспорта
    const serializedDocument = DocumentSerializer.serialize(this.document);

    // Экспортируем
    const result = await this.exportManager.export(serializedDocument, format, options);

    // Эмитим событие экспорта
    if (this.eventBus) {
      this.eventBus.emit('document:exported', {
        format,
        options,
        document: this.document
      });
    }

    return result;
  }

  /**
   * Получает список доступных форматов экспорта
   * @returns {string[]}
   */
  getAvailableExportFormats() {
    if (!this.exportManager) {
      return [];
    }
    return this.exportManager.getAvailableFormats();
  }

  /**
   * Синхронизирует текущее выделение блоков с фактическим документом
   * @private
   */
  _syncSelectionWithDocument() {
    if (!this.document || !this.controller || !this.controller.selection) {
      return;
    }

    const selectedIds = this.controller.selection.getSelected();
    if (selectedIds.length === 0) {
      return;
    }

    const existingIds = selectedIds.filter((id) => this.document.getBlock(id));

    if (existingIds.length === selectedIds.length) {
      return;
    }

    this.controller.selection.clear();
    if (existingIds.length === 0) {
      return;
    }

    this.controller.selection.select(existingIds[0]);
    existingIds.slice(1).forEach((id) => {
      this.controller.selection.toggle(id);
    });
  }

  destroy() {
    if (this._autoSaveCleanup) {
      this._autoSaveCleanup();
    }
    if (this.documentRenderer) {
      this.documentRenderer.clear();
    }
    this.container.innerHTML = '';
    this.controller.selection.clear();
    this.controller.focus.blur();
    this.document = null;
    this.documentRenderer = null;
  }
}

