import { Modal } from '../ui/components/Modal.js';
import { LinkManager } from './LinkManager.js';

/**
 * LinkDialog - диалог для вставки и редактирования ссылок
 */
export class LinkDialog {
  /**
   * @param {Object} options
   * @param {Function} options.onInsert - callback при вставке ссылки (text, href, type)
   * @param {Function} options.onUpdate - callback при обновлении ссылки (linkElement, text, href, type)
   * @param {Object} [options.initialData] - начальные данные (text, href, type) для редактирования
   */
  constructor(options = {}) {
    this.onInsert = options.onInsert || null;
    this.onUpdate = options.onUpdate || null;
    this.initialData = options.initialData || null;
    this.modal = null;
    this.overlay = null;
    // Режим редактирования только если есть linkElement (существующая ссылка)
    this.isEditMode = !!(this.initialData && this.initialData.linkElement);
    this.escapeHandler = null;
  }

  /**
   * Показывает диалог
   */
  show() {
    const content = this._createDialogContent();
    this.modal = new Modal({
      title: this.isEditMode ? 'Редактировать ссылку' : 'Вставить ссылку',
      content: content,
      onClose: () => {
        this.modal = null;
        this.overlay = null;
        // Удаляем обработчик Escape при закрытии
        if (this.escapeHandler) {
          document.removeEventListener('keydown', this.escapeHandler);
          this.escapeHandler = null;
        }
      }
    });
    this.overlay = this.modal.render();
    document.body.appendChild(this.overlay);
    
    // Фокус на первом поле
    const firstInput = content.querySelector('input');
    if (firstInput) {
      setTimeout(() => {
        firstInput.focus();
        firstInput.select();
      }, 100);
    }

    // Предотвращаем закрытие диалога при клике на overlay (только при клике на сам overlay)
    const modalElement = this.overlay.querySelector('.modal');
    if (modalElement) {
      modalElement.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }

    // Обработка Escape для закрытия диалога
    this.escapeHandler = (e) => {
      if (e.key === 'Escape' && this.overlay && document.body.contains(this.overlay)) {
        e.preventDefault();
        e.stopPropagation();
        this.close();
      }
    };
    document.addEventListener('keydown', this.escapeHandler);
  }

  /**
   * Создает содержимое диалога
   * @private
   * @returns {HTMLElement}
   */
  _createDialogContent() {
    const container = document.createElement('div');
    container.className = 'link-dialog';

    // Текст ссылки
    const textGroup = document.createElement('div');
    textGroup.className = 'form-group';
    const textLabel = document.createElement('label');
    textLabel.textContent = 'Текст ссылки:';
    textLabel.setAttribute('for', 'link-text');
    const textInput = document.createElement('input');
    textInput.type = 'text';
    textInput.id = 'link-text';
    textInput.className = 'form-input';
    textInput.placeholder = 'Введите текст ссылки';
    if (this.initialData && this.initialData.text) {
      textInput.value = this.initialData.text;
    }
    textGroup.appendChild(textLabel);
    textGroup.appendChild(textInput);

    // URL
    const urlGroup = document.createElement('div');
    urlGroup.className = 'form-group';
    const urlLabel = document.createElement('label');
    urlLabel.textContent = 'URL:';
    urlLabel.setAttribute('for', 'link-url');
    const urlInput = document.createElement('input');
    urlInput.type = 'text';
    urlInput.id = 'link-url';
    urlInput.className = 'form-input';
    urlInput.placeholder = 'https://example.com или #anchor или metadata:type:name';
    if (this.initialData && this.initialData.href) {
      urlInput.value = this.initialData.href;
    }
    urlGroup.appendChild(urlLabel);
    urlGroup.appendChild(urlInput);

    // Тип ссылки
    const typeGroup = document.createElement('div');
    typeGroup.className = 'form-group';
    const typeLabel = document.createElement('label');
    typeLabel.textContent = 'Тип ссылки:';
    typeLabel.setAttribute('for', 'link-type');
    const typeSelect = document.createElement('select');
    typeSelect.id = 'link-type';
    typeSelect.className = 'form-select';
    
    const types = [
      { value: 'external', label: 'Внешняя ссылка' },
      { value: 'internal', label: 'Внутренняя ссылка' },
      { value: 'anchor', label: 'Якорь' },
      { value: 'metadata', label: 'Метаданные 1С' }
    ];
    
    types.forEach(type => {
      const option = document.createElement('option');
      option.value = type.value;
      option.textContent = type.label;
      typeSelect.appendChild(option);
    });
    
    if (this.initialData && this.initialData.type) {
      typeSelect.value = this.initialData.type;
    }
    
    // Автоматическое определение типа по URL
    urlInput.addEventListener('input', () => {
      const url = urlInput.value.trim();
      if (url.startsWith('#')) {
        typeSelect.value = 'anchor';
      } else if (url.startsWith('metadata:')) {
        typeSelect.value = 'metadata';
      } else if (url.startsWith('http://') || url.startsWith('https://')) {
        typeSelect.value = 'external';
      } else if (url.length > 0 && !url.startsWith('#')) {
        typeSelect.value = 'internal';
      }
    });
    
    typeGroup.appendChild(typeLabel);
    typeGroup.appendChild(typeSelect);

    // Кнопки
    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'form-actions';
    
    const insertBtn = document.createElement('button');
    insertBtn.className = 'btn btn-primary';
    insertBtn.textContent = this.isEditMode ? 'Обновить' : 'Вставить';
    insertBtn.addEventListener('click', () => this._handleInsert(textInput, urlInput, typeSelect));
    
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-secondary';
    cancelBtn.textContent = 'Отмена';
    cancelBtn.addEventListener('click', () => this.close());
    
    buttonGroup.appendChild(insertBtn);
    buttonGroup.appendChild(cancelBtn);

    // Обработка Enter
    const handleEnter = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        insertBtn.click();
      }
    };
    textInput.addEventListener('keydown', handleEnter);
    urlInput.addEventListener('keydown', handleEnter);

    container.appendChild(textGroup);
    container.appendChild(urlGroup);
    container.appendChild(typeGroup);
    container.appendChild(buttonGroup);

    return container;
  }

  /**
   * Обрабатывает вставку ссылки
   * @private
   */
  _handleInsert(textInput, urlInput, typeSelect) {
    const text = textInput.value.trim();
    const href = urlInput.value.trim();
    const type = typeSelect.value;

    if (!text || !href) {
      alert('Пожалуйста, заполните все поля');
      return;
    }

    // Валидация URL
    if (type === 'external' && !href.match(/^https?:\/\//)) {
      alert('Внешняя ссылка должна начинаться с http:// или https://');
      return;
    }

    // Проверяем, есть ли linkElement для определения режима редактирования
    const isEdit = this.initialData && this.initialData.linkElement;
    
    if (isEdit && this.onUpdate) {
      this.onUpdate(this.initialData.linkElement, text, href, type);
    } else if (this.onInsert) {
      this.onInsert(text, href, type);
    } else {
      console.warn('LinkDialog: No handler available for insert/update');
    }

    this.close();
  }

  /**
   * Закрывает диалог
   */
  close() {
    // Удаляем обработчик Escape
    if (this.escapeHandler) {
      document.removeEventListener('keydown', this.escapeHandler);
      this.escapeHandler = null;
    }

    if (this.overlay && this.modal) {
      this.modal.close(this.overlay);
      this.modal = null;
      this.overlay = null;
    }
  }
}

