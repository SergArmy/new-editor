import { getIconLibraryInstance } from '../icon-library/index.js';

const ICON_PICKER_EVENT = 'icon-picker:open';
let activeMenu = null;

/**
 * Открывает меню выбора иконок.
 * @param {{
 *   anchor?: HTMLElement,
 *   position?: { x: number, y: number },
 *   triggerEvent?: MouseEvent | PointerEvent | KeyboardEvent,
 *   currentIcon?: string | { value: string, label?: string },
 *   onSelect?: (icon: { value: string, label: string, source: string }) => void,
 *   onRemove?: () => void,
 *   onClose?: () => void,
 *   title?: string
 * }} options
 */
export async function openIconPicker(options = {}) {
  const iconLibrary = getIconLibraryInstance();

  if (activeMenu) {
    closeIconPicker();
  }

  activeMenu = new IconPickerMenu(iconLibrary, options);
  await activeMenu.open();
  return activeMenu;
}

/**
 * Закрывает активное меню выбора иконок.
 */
export function closeIconPicker() {
  if (!activeMenu) {
    return;
  }
  const menu = activeMenu;
  activeMenu = null;
  menu.destroy();
}

/**
 * Позволяет открыть меню через CustomEvent:
 * document.dispatchEvent(new CustomEvent('icon-picker:open', { detail: options }))
 */
document.addEventListener(ICON_PICKER_EVENT, (event) => {
  const detail = event.detail || {};
  openIconPicker(detail);
});

class IconPickerMenu {
  /**
   * @param {import('../icon-library/IconLibraryService.js').IconLibraryService} library
   * @param {ReturnType<typeof normalizeOptions>} options
   */
  constructor(library, options) {
    this.library = library;
    this.options = normalizeOptions(options);
    this.root = null;
    this.groupsContainer = null;
    this.currentIconPreview = null;
    this.currentIconLabel = null;
    this.messageContainer = null;
    this.loadMoreButton = null;
    this.unsubscribe = null;
    this.abortController = null;
    this.disposers = [];
    this.currentIcon = null;
    this._customDialog = null;
    this._customDialogAbortController = null;
  }

  async open() {
    await this.library.ensureInitialized();
    this.currentIcon = this._resolveCurrentIcon(this.options.currentIcon);
    this.root = this._createRoot();
    document.body.appendChild(this.root);

    await this._renderGroups();
    this._updateCurrentIconSection();
    this._position();

    requestAnimationFrame(() => {
      this.root.classList.add('is-visible');
    });

    this.unsubscribe = this.library.subscribe(() => {
      this._renderGroups();
    });

    this._bindGlobalListeners();
  }

  destroy() {
    this._closeCustomIconDialog();
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.disposers.forEach(dispose => dispose());
    this.disposers = [];

    if (this.root) {
      this.root.classList.remove('is-visible');
      this.root.remove();
      this.root = null;
    }

    if (typeof this.options.onClose === 'function') {
      this.options.onClose();
    }
  }

  _createRoot() {
    const container = document.createElement('div');
    container.className = 'diagram-link-editor icon-picker-menu is-visible';
    container.setAttribute('role', 'dialog');
    container.setAttribute('aria-label', this.options.title || 'Выбор иконки');

    const header = this._createHeader();
    const controls = this._createControls();
    const actionsPanel = this._createActionsPanel();
    const topWrapper = document.createElement('div');
    topWrapper.className = 'icon-picker-top';
    topWrapper.appendChild(controls);
    topWrapper.appendChild(actionsPanel);

    const groups = document.createElement('div');
    groups.className = 'icon-picker-groups';

    const message = document.createElement('div');
    message.className = 'icon-picker-message';
    message.setAttribute('role', 'status');
    message.setAttribute('aria-live', 'polite');
    this.messageContainer = message;

    container.appendChild(header);
    container.appendChild(topWrapper);
    container.appendChild(groups);
    container.appendChild(message);

    this.groupsContainer = groups;

    return container;
  }

  _createHeader() {
    const header = document.createElement('div');
    header.className = 'icon-picker-header';

    const title = document.createElement('div');
    title.className = 'icon-picker-title';
    title.textContent = this.options.title || 'Выбор иконки';

    const subtitle = document.createElement('div');
    subtitle.className = 'icon-picker-subtitle';
    subtitle.textContent = 'Кликните по иконке, чтобы применить её.';

    header.appendChild(title);
    header.appendChild(subtitle);
    return header;
  }

  _createControls() {
    const wrapper = document.createElement('div');
    wrapper.className = 'icon-picker-active';

    const preview = document.createElement('div');
    preview.className = 'icon-picker-active__preview';
    this.currentIconPreview = preview;

    const info = document.createElement('div');
    info.className = 'icon-picker-active__info';

    const label = document.createElement('div');
    label.className = 'icon-picker-active__label';
    label.textContent = 'Текущая иконка';
    info.appendChild(label);

    const valueLabel = document.createElement('div');
    valueLabel.className = 'icon-picker-active__value';
    this.currentIconLabel = valueLabel;
    info.appendChild(valueLabel);

    const actionGroup = document.createElement('div');
    actionGroup.className = 'icon-picker-active__actions';

    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'diagram-link-editor__btn danger';
    clearBtn.textContent = 'Удалить';
    clearBtn.disabled = !this.currentIcon;
    clearBtn.addEventListener('click', () => {
      if (typeof this.options.onRemove === 'function') {
        this.options.onRemove();
      }
      closeIconPicker();
    });

    actionGroup.appendChild(clearBtn);

    wrapper.appendChild(preview);
    wrapper.appendChild(info);
    wrapper.appendChild(actionGroup);

    return wrapper;
  }

  _createActionsPanel() {
    const panel = document.createElement('div');
    panel.className = 'icon-picker-actions';

    const buttons = document.createElement('div');
    buttons.className = 'icon-picker-actions__buttons';

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'diagram-link-editor__btn primary icon-picker-actions__btn';
    addBtn.innerHTML = '<i class="fa-light fa-plus"></i><span>Добавить иконку</span>';
    addBtn.addEventListener('click', () => this._openCustomIconDialog());
    buttons.appendChild(addBtn);

    const loadMoreBtn = document.createElement('button');
    loadMoreBtn.type = 'button';
    loadMoreBtn.className = 'diagram-link-editor__btn secondary icon-picker-actions__btn';
    loadMoreBtn.innerHTML = '<i class="fa-light fa-cloud-arrow-down"></i><span>Загрузить дополнительные</span>';
    loadMoreBtn.addEventListener('click', async () => {
      loadMoreBtn.disabled = true;
      const original = loadMoreBtn.innerHTML;
      loadMoreBtn.innerHTML = '<span>Загрузка…</span>';
      await this.library.fetchAdditionalGroups();
      loadMoreBtn.innerHTML = '<span>Дополнительные иконки загружены</span>';
      loadMoreBtn.classList.add('is-success');
      this._renderGroups();
      setTimeout(() => {
        loadMoreBtn.disabled = false;
        loadMoreBtn.classList.remove('is-success');
        loadMoreBtn.innerHTML = original;
      }, 1600);
    });
    this.loadMoreButton = loadMoreBtn;
    buttons.appendChild(loadMoreBtn);

    panel.appendChild(buttons);

    const hint = document.createElement('div');
    hint.className = 'icon-picker-actions__hint';
    hint.textContent = 'Используйте иконки Font Awesome Light. Добавленная иконка появится в разделе «Пользовательские».';
    panel.appendChild(hint);

    return panel;
  }

  _openCustomIconDialog() {
    this._closeCustomIconDialog();

    const dialog = document.createElement('form');
    dialog.className = 'diagram-link-editor icon-picker-custom-dialog is-visible';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-label', 'Добавить пользовательскую иконку');

    const title = document.createElement('div');
    title.className = 'diagram-link-editor__title';
    title.textContent = 'Добавление иконки';
    dialog.appendChild(title);

    const previewWrapper = document.createElement('div');
    previewWrapper.className = 'icon-picker-custom-dialog__preview';
    const previewIcon = document.createElement('i');
    previewIcon.className = 'fa-light fa-icons';
    previewWrapper.appendChild(previewIcon);
    dialog.appendChild(previewWrapper);

    const fields = document.createElement('div');
    fields.className = 'icon-picker-custom-dialog__fields';

    const nameLabel = document.createElement('label');
    nameLabel.className = 'diagram-link-editor__label';
    nameLabel.textContent = 'Отображаемое имя';
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'diagram-link-editor__input';
    nameInput.placeholder = 'Например, «Approval»';
    nameLabel.appendChild(nameInput);

    const valueLabel = document.createElement('label');
    valueLabel.className = 'diagram-link-editor__label';
    valueLabel.textContent = 'Класс Font Awesome';
    const valueInput = document.createElement('input');
    valueInput.type = 'text';
    valueInput.className = 'diagram-link-editor__input';
    valueInput.placeholder = 'fa-circle-check';
    valueLabel.appendChild(valueInput);

    fields.appendChild(nameLabel);
    fields.appendChild(valueLabel);
    dialog.appendChild(fields);

    const dialogMessage = document.createElement('div');
    dialogMessage.className = 'icon-picker-custom-dialog__message';
    dialog.appendChild(dialogMessage);

    const actions = document.createElement('div');
    actions.className = 'icon-picker-custom-dialog__actions';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'diagram-link-editor__btn secondary';
    cancelBtn.textContent = 'Отмена';
    cancelBtn.addEventListener('click', () => this._closeCustomIconDialog());

    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.className = 'diagram-link-editor__btn primary';
    submitBtn.textContent = 'Добавить';

    actions.appendChild(cancelBtn);
    actions.appendChild(submitBtn);
    dialog.appendChild(actions);

    const updatePreview = () => {
      const normalized = normalizeIconValue(valueInput.value);
      if (normalized) {
        previewIcon.className = normalized;
      } else {
        previewIcon.className = 'fa-light fa-icons icon-picker-custom-dialog__preview-placeholder';
      }
      dialogMessage.textContent = '';
      dialogMessage.classList.remove('is-error', 'is-success');
    };
    valueInput.addEventListener('input', updatePreview);

    dialog.addEventListener('submit', async (event) => {
      event.preventDefault();
      const normalizedValue = normalizeIconValue(valueInput.value);
      if (!normalizedValue) {
        dialogMessage.textContent = 'Укажите класс иконки (например, fa-circle-check)';
        dialogMessage.classList.add('is-error');
        updatePreview();
        return;
      }
      const label = nameInput.value.trim() || normalizedValue;
      try {
        const icon = await this.library.addCustomIcon({
          label,
          value: normalizedValue
        });
        showMessage(this.messageContainer, `Иконка «${icon.label}» добавлена`, 'success');
        this.currentIcon = icon;
        this._updateCurrentIconSection();
        await this._renderGroups();
        this._closeCustomIconDialog();
      } catch (error) {
        dialogMessage.textContent = error.message || 'Не удалось добавить иконку';
        dialogMessage.classList.add('is-error');
      }
    });

    document.body.appendChild(dialog);
    this._customDialog = dialog;
    this._customDialogAbortController = new AbortController();
    const { signal } = this._customDialogAbortController;

    setTimeout(() => valueInput.focus(), 0);
    updatePreview();

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        this._closeCustomIconDialog();
      }
    }, { signal, capture: true });

    document.addEventListener('click', (event) => {
      if (!this._customDialog) {
        return;
      }
      const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
      if (path.includes(this._customDialog) || this._customDialog.contains(event.target)) {
        return;
      }
      this._closeCustomIconDialog();
    }, { signal, capture: true });
  }

  _closeCustomIconDialog() {
    if (this._customDialogAbortController) {
      this._customDialogAbortController.abort();
      this._customDialogAbortController = null;
    }
    if (this._customDialog) {
      this._customDialog.remove();
      this._customDialog = null;
    }
  }

  async _renderGroups() {
    if (!this.groupsContainer) {
      return;
    }

    const groups = await this.library.getGroups();
    this.groupsContainer.innerHTML = '';

    groups.forEach(group => {
      if (!Array.isArray(group.icons) || group.icons.length === 0) {
        return;
      }
      const section = document.createElement('section');
      section.className = `icon-picker-group icon-picker-group--${group.source}`;

      const header = document.createElement('header');
      header.className = 'icon-picker-group__header';
      header.textContent = group.label;
      section.appendChild(header);

      const list = document.createElement('div');
      list.className = 'icon-picker-group__list';

      group.icons.forEach(icon => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'icon-picker-option';
        button.innerHTML = `<i class="${icon.value}"></i><span>${icon.label}</span>`;
        button.dataset.value = icon.value;
        button.dataset.source = icon.source;
        if (this.currentIcon && this.currentIcon.value === icon.value) {
          button.classList.add('is-active');
        }
        button.addEventListener('click', () => {
          this._handleSelect(icon);
        });
        list.appendChild(button);
      });

      section.appendChild(list);
      this.groupsContainer.appendChild(section);
    });
  }

  _handleSelect(icon) {
    this.currentIcon = {
      value: icon.value,
      label: icon.label,
      source: icon.source
    };

    if (typeof this.options.onSelect === 'function') {
      this.options.onSelect(this.currentIcon);
    }

    closeIconPicker();
  }

  _resolveCurrentIcon(iconInput) {
    if (!iconInput) {
      return null;
    }

    if (typeof iconInput === 'string') {
      return this.library.findIcon(iconInput) || { value: iconInput, label: iconInput, source: 'custom' };
    }

    const icon = this.library.findIcon(iconInput.value);
    if (icon) {
      return icon;
    }

    return {
      value: iconInput.value,
      label: iconInput.label || iconInput.value,
      source: 'custom'
    };
  }

  _updateCurrentIconSection() {
    if (!this.currentIconPreview || !this.currentIconLabel) {
      return;
    }

    this.currentIconPreview.innerHTML = '';
    if (this.currentIcon) {
      const iconEl = document.createElement('i');
      iconEl.className = this.currentIcon.value;
      this.currentIconPreview.appendChild(iconEl);
      this.currentIconLabel.textContent = this.currentIcon.label || this.currentIcon.value;
    } else {
      this.currentIconLabel.textContent = 'Иконка не выбрана';
    }

    if (this.root) {
      const removeBtn = this.root.querySelector('.icon-picker-active__actions .diagram-link-editor__btn.danger');
      if (removeBtn) {
        removeBtn.disabled = !this.currentIcon;
      }
    }
  }

  _position() {
    if (!this.root) {
      return;
    }

    const margin = 12;
    const { anchor, triggerEvent, position } = this.options;

    let top = margin;
    let left = margin;

    const rect = this.root.getBoundingClientRect();

    if (triggerEvent instanceof MouseEvent) {
      top = triggerEvent.clientY;
      left = triggerEvent.clientX;
    } else if (position && typeof position.x === 'number' && typeof position.y === 'number') {
      left = position.x;
      top = position.y;
    } else if (anchor instanceof HTMLElement) {
      const anchorRect = anchor.getBoundingClientRect();
      top = anchorRect.bottom + margin;
      left = anchorRect.left + (anchorRect.width / 2) - (rect.width / 2);
    }

    if (left + rect.width > window.innerWidth - margin) {
      left = window.innerWidth - margin - rect.width;
    }
    if (left < margin) {
      left = margin;
    }
    if (top + rect.height > window.innerHeight - margin) {
      top = window.innerHeight - margin - rect.height;
    }
    if (top < margin) {
      top = margin;
    }

    this.root.style.position = 'fixed';
    this.root.style.left = `${left}px`;
    this.root.style.top = `${top}px`;
  }

  _bindGlobalListeners() {
    this.abortController = new AbortController();
    const { signal } = this.abortController;

    document.addEventListener('click', (event) => {
      if (!this.root) {
        return;
      }
      const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
      if (path.includes(this.root) || this.root.contains(event.target)) {
        return;
      }
      closeIconPicker();
    }, { signal, capture: true });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeIconPicker();
      }
    }, { signal, capture: true });

    window.addEventListener('resize', () => {
      closeIconPicker();
    }, { signal });

  }
}

function normalizeOptions(options) {
  return {
    anchor: options.anchor,
    position: options.position,
    triggerEvent: options.triggerEvent,
    currentIcon: options.currentIcon,
    onSelect: options.onSelect,
    onRemove: options.onRemove,
    onClose: options.onClose,
    title: options.title
  };
}

function clearMessage(container) {
  if (container) {
    container.textContent = '';
    container.classList.remove('is-error', 'is-success');
  }
}

function showMessage(container, text, type = 'info') {
  if (!container) {
    return;
  }
  container.textContent = text;
  container.classList.remove('is-error', 'is-success');
  if (type === 'error') {
    container.classList.add('is-error');
  } else if (type === 'success') {
    container.classList.add('is-success');
  }
}


