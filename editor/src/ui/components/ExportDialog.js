import { Modal } from './Modal.js';
import { Button } from './Button.js';

/**
 * Компонент диалога экспорта документа
 */
export class ExportDialog {
  /**
   * @param {Object} options
   * @param {Array<string>} options.formats - доступные форматы экспорта
   * @param {Function} options.onExport - callback для экспорта (format, options) => Promise
   * @param {Function} [options.onCancel] - callback для отмены
   */
  constructor(options = {}) {
    this.formats = options.formats || [];
    this.onExport = options.onExport || null;
    this.onCancel = options.onCancel || null;
    this.modal = null;
    this.selectedFormat = this.formats[0] || 'json';
    this.options = {
      includeTOC: true,
      includeNumbers: true,
      theme: 'light',
      pretty: true
    };
  }

  /**
   * Открывает диалог экспорта
   */
  open() {
    if (this.modal) {
      this.modal.show();
      // Обновляем обработчики, так как элементы могут быть пересозданы
      setTimeout(() => this._attachHandlers(), 0);
      return;
    }

    const content = this._renderContent();
    this.modal = new Modal({
      title: 'Экспорт документа',
      content: content,
      onClose: () => {
        if (this.onCancel) {
          this.onCancel();
        }
      }
    });

    this.modal.show();
    // Привязываем обработчики после того, как модальное окно отрендерилось
    setTimeout(() => this._attachHandlers(), 0);
  }

  /**
   * Закрывает диалог экспорта
   */
  close() {
    if (this.modal) {
      this.modal.hide();
    }
  }

  /**
   * Рендерит содержимое диалога
   * @private
   */
  _renderContent() {
    const container = document.createElement('div');
    container.className = 'export-dialog';

    // Выбор формата
    const formatGroup = document.createElement('div');
    formatGroup.className = 'export-dialog__group';
    
    const formatLabel = document.createElement('label');
    formatLabel.className = 'export-dialog__label';
    formatLabel.textContent = 'Формат экспорта:';
    
    const formatSelect = document.createElement('select');
    formatSelect.className = 'export-dialog__select';
    formatSelect.id = 'export-format';
    
    const formatLabels = {
      json: 'JSON',
      html: 'HTML',
      xml: 'XML',
      pdf: 'PDF'
    };
    
    this.formats.forEach(format => {
      const option = document.createElement('option');
      option.value = format;
      option.textContent = formatLabels[format] || format.toUpperCase();
      if (format === this.selectedFormat) {
        option.selected = true;
      }
      formatSelect.appendChild(option);
    });

    formatGroup.appendChild(formatLabel);
    formatGroup.appendChild(formatSelect);

    // Опции экспорта (для HTML)
    const optionsGroup = document.createElement('div');
    optionsGroup.className = 'export-dialog__group';
    optionsGroup.id = 'export-options';

    this._renderOptions(optionsGroup, this.selectedFormat);

    container.appendChild(formatGroup);
    container.appendChild(optionsGroup);

    // Кнопки
    const buttonsGroup = document.createElement('div');
    buttonsGroup.className = 'export-dialog__buttons';

    const exportButton = new Button({
      text: 'Экспортировать',
      className: 'btn-primary',
      onClick: () => this._handleExport()
    });

    const cancelButton = new Button({
      text: 'Отмена',
      onClick: () => this.close()
    });

    buttonsGroup.appendChild(exportButton.render());
    buttonsGroup.appendChild(cancelButton.render());

    container.appendChild(buttonsGroup);

    return container;
  }

  /**
   * Рендерит опции экспорта для указанного формата
   * @param {HTMLElement} container
   * @param {string} format
   * @private
   */
  _renderOptions(container, format) {
    container.innerHTML = '';

    if (format === 'html') {
      // Включить оглавление
      const tocCheckbox = document.createElement('div');
      tocCheckbox.className = 'export-dialog__option';
      
      const tocInput = document.createElement('input');
      tocInput.type = 'checkbox';
      tocInput.id = 'export-option-toc';
      tocInput.checked = this.options.includeTOC;
      tocInput.addEventListener('change', (e) => {
        this.options.includeTOC = e.target.checked;
      });
      
      const tocLabel = document.createElement('label');
      tocLabel.htmlFor = 'export-option-toc';
      tocLabel.textContent = 'Включить оглавление';
      
      tocCheckbox.appendChild(tocInput);
      tocCheckbox.appendChild(tocLabel);

      // Включить нумерацию
      const numbersCheckbox = document.createElement('div');
      numbersCheckbox.className = 'export-dialog__option';
      
      const numbersInput = document.createElement('input');
      numbersInput.type = 'checkbox';
      numbersInput.id = 'export-option-numbers';
      numbersInput.checked = this.options.includeNumbers;
      numbersInput.addEventListener('change', (e) => {
        this.options.includeNumbers = e.target.checked;
      });
      
      const numbersLabel = document.createElement('label');
      numbersLabel.htmlFor = 'export-option-numbers';
      numbersLabel.textContent = 'Включить нумерацию';
      
      numbersCheckbox.appendChild(numbersInput);
      numbersCheckbox.appendChild(numbersLabel);

      // Тема
      const themeGroup = document.createElement('div');
      themeGroup.className = 'export-dialog__option';
      
      const themeLabel = document.createElement('label');
      themeLabel.className = 'export-dialog__label';
      themeLabel.textContent = 'Тема:';
      
      const themeSelect = document.createElement('select');
      themeSelect.className = 'export-dialog__select';
      themeSelect.id = 'export-option-theme';
      
      const lightOption = document.createElement('option');
      lightOption.value = 'light';
      lightOption.textContent = 'Светлая';
      if (this.options.theme === 'light') {
        lightOption.selected = true;
      }
      
      const darkOption = document.createElement('option');
      darkOption.value = 'dark';
      darkOption.textContent = 'Темная';
      if (this.options.theme === 'dark') {
        darkOption.selected = true;
      }
      
      themeSelect.appendChild(lightOption);
      themeSelect.appendChild(darkOption);
      themeSelect.addEventListener('change', (e) => {
        this.options.theme = e.target.value;
      });
      
      themeGroup.appendChild(themeLabel);
      themeGroup.appendChild(themeSelect);

      container.appendChild(tocCheckbox);
      container.appendChild(numbersCheckbox);
      container.appendChild(themeGroup);
    } else if (format === 'json') {
      // Форматировать JSON
      const prettyCheckbox = document.createElement('div');
      prettyCheckbox.className = 'export-dialog__option';
      
      const prettyInput = document.createElement('input');
      prettyInput.type = 'checkbox';
      prettyInput.id = 'export-option-pretty';
      prettyInput.checked = this.options.pretty;
      prettyInput.addEventListener('change', (e) => {
        this.options.pretty = e.target.checked;
      });
      
      const prettyLabel = document.createElement('label');
      prettyLabel.htmlFor = 'export-option-pretty';
      prettyLabel.textContent = 'Форматировать JSON (с отступами)';
      
      prettyCheckbox.appendChild(prettyInput);
      prettyCheckbox.appendChild(prettyLabel);

      container.appendChild(prettyCheckbox);
    }
  }

  /**
   * Привязывает обработчики событий
   * @private
   */
  _attachHandlers() {
    const formatSelect = document.getElementById('export-format');
    if (formatSelect) {
    formatSelect.addEventListener('change', (e) => {
      this.selectedFormat = e.target.value;
      const optionsGroup = document.getElementById('export-options');
      if (optionsGroup) {
        this._renderOptions(optionsGroup, this.selectedFormat);
      }
      
      // Обновляем опции при смене формата
      if (this.selectedFormat === 'json') {
        this.options.pretty = true;
      } else if (this.selectedFormat === 'html') {
        this.options.includeTOC = true;
        this.options.includeNumbers = true;
        this.options.theme = 'light';
      }
    });
    }
  }

  /**
   * Обрабатывает экспорт
   * @private
   */
  async _handleExport() {
    if (!this.onExport) {
      return;
    }

    try {
      const exportOptions = this._getExportOptions(this.selectedFormat);
      const result = await this.onExport(this.selectedFormat, exportOptions);
      
      // Скачиваем файл
      this._downloadFile(result, this.selectedFormat);
      
      this.close();
    } catch (error) {
      console.error('Export error:', error);
      alert(`Ошибка при экспорте: ${error.message}`);
    }
  }

  /**
   * Получает опции экспорта для указанного формата
   * @param {string} format
   * @returns {Object}
   * @private
   */
  _getExportOptions(format) {
    const baseOptions = {};
    
    if (format === 'html') {
      baseOptions.includeTOC = this.options.includeTOC;
      baseOptions.includeNumbers = this.options.includeNumbers;
      baseOptions.theme = this.options.theme;
    } else if (format === 'json') {
      baseOptions.pretty = this.options.pretty;
    }
    
    return baseOptions;
  }

  /**
   * Скачивает файл
   * @param {string|Blob} content
   * @param {string} format
   * @private
   */
  _downloadFile(content, format) {
    const mimeTypes = {
      json: 'application/json',
      html: 'text/html',
      xml: 'application/xml',
      pdf: 'application/pdf'
    };
    
    const extensions = {
      json: 'json',
      html: 'html',
      xml: 'xml',
      pdf: 'pdf'
    };

    const mimeType = mimeTypes[format] || 'application/octet-stream';
    const extension = extensions[format] || 'txt';
    
    let blob;
    if (content instanceof Blob) {
      blob = content;
    } else {
      blob = new Blob([content], { type: mimeType });
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `document.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

