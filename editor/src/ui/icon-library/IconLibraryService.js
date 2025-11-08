const BUILTIN_GROUPS = [
  {
    id: 'ui-controls',
    label: 'Управление интерфейсом',
    icons: [
      { id: 'icon-gear', label: 'Настройки', value: 'fa-light fa-gear' },
      { id: 'icon-eye', label: 'Просмотр', value: 'fa-light fa-eye' },
      { id: 'icon-code', label: 'Режим кода', value: 'fa-light fa-code' },
      { id: 'icon-zoom-out', label: 'Уменьшить масштаб', value: 'fa-light fa-magnifying-glass-minus' },
      { id: 'icon-zoom-reset', label: 'Сброс масштаба', value: 'fa-light fa-arrows-rotate' },
      { id: 'icon-zoom-in', label: 'Увеличить масштаб', value: 'fa-light fa-magnifying-glass-plus' },
      { id: 'icon-expand', label: 'Полноэкранный режим', value: 'fa-light fa-expand' }
    ]
  },
  {
    id: 'actions',
    label: 'Действия',
    icons: [
      { id: 'icon-copy', label: 'Копировать', value: 'fa-light fa-copy' },
      { id: 'icon-plus', label: 'Добавление', value: 'fa-light fa-plus' },
      { id: 'icon-circle-plus', label: 'Добавить запись', value: 'fa-light fa-circle-plus' },
      { id: 'icon-trash', label: 'Удалить запись', value: 'fa-light fa-trash-can' },
      { id: 'icon-grip', label: 'Перемещение', value: 'fa-light fa-grip-lines' },
      { id: 'icon-image', label: 'Изображение', value: 'fa-light fa-image' }
    ]
  },
  {
    id: 'states',
    label: 'Статусы и показатели',
    icons: [
      { id: 'icon-trend-up', label: 'Рост показателей', value: 'fa-light fa-arrow-trend-up' },
      { id: 'icon-triangle-warning', label: 'Предупреждение', value: 'fa-light fa-triangle-exclamation' },
      { id: 'icon-check', label: 'Подтверждение', value: 'fa-light fa-check' },
      { id: 'icon-xmark', label: 'Отмена', value: 'fa-light fa-xmark' },
      { id: 'icon-circle-check', label: 'Подтверждено', value: 'fa-light fa-circle-check' },
      { id: 'icon-circle-xmark', label: 'Отклонено', value: 'fa-light fa-circle-xmark' },
      { id: 'icon-shield-check', label: 'Безопасность', value: 'fa-light fa-shield-check' },
      { id: 'icon-gauge', label: 'Производительность', value: 'fa-light fa-gauge-high' }
    ]
  },
  {
    id: 'content',
    label: 'Контент и роли',
    icons: [
      { id: 'icon-gears', label: 'Автоматизация', value: 'fa-light fa-gears' },
      { id: 'icon-people', label: 'Команда', value: 'fa-light fa-people-group' },
      { id: 'icon-file-lines', label: 'Документация', value: 'fa-light fa-file-lines' },
      { id: 'icon-display', label: 'Интерфейс', value: 'fa-light fa-display' }
    ]
  }
];

/**
 * Сервис управления библиотекой иконок редактора.
 */
export class IconLibraryService {
  /**
   * @param {{ api?: import('../../api/IconLibraryApi.js').IconLibraryApi }} [options]
   */
  constructor(options = {}) {
    this.api = options.api ?? null;
    this._customIcons = [];
    this._additionalGroups = [];
    this._isInitialized = false;
    this._listeners = new Set();
    this._additionalLoaded = false;
  }

  /**
   * Загружает пользовательские иконки из бэкенда.
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this._isInitialized) {
      return;
    }

    if (this.api) {
      try {
        const loaded = await this.api.getCustomIcons();
        if (Array.isArray(loaded) && loaded.length > 0) {
          this._customIcons = loaded.map(icon => ({
            id: icon.id,
            label: icon.label,
            value: icon.value
          }));
        } else {
          this._customIcons = [];
        }
      } catch (error) {
        console.warn('[IconLibraryService] Не удалось загрузить пользовательские иконки:', error);
        this._customIcons = [];
      }
    }

    this._isInitialized = true;
    this._notify();
  }

  /**
   * Гарантирует наличие данных библиотеки.
   * @returns {Promise<void>}
   */
  async ensureInitialized() {
    if (!this._isInitialized) {
      await this.initialize();
    }
  }

  /**
   * Возвращает список всех групп (встроенные, дополнительные, пользовательские).
   * @returns {Promise<Array<{id: string, label: string, source: string, icons: Array<{id?: string, label: string, value: string, source: string}>}>>}
   */
  async getGroups() {
    await this.ensureInitialized();

    const result = BUILTIN_GROUPS.map(group => ({
      id: group.id,
      label: group.label,
      source: 'builtin',
      icons: group.icons.map(icon => ({
        ...icon,
        source: 'builtin'
      }))
    }));

    if (this._additionalGroups.length > 0) {
      this._additionalGroups.forEach(group => {
        result.push({
          id: group.id,
          label: group.label,
          source: 'additional',
          icons: group.icons.map(icon => ({
            ...icon,
            source: 'additional'
          }))
        });
      });
    }

    if (this._customIcons.length > 0) {
      result.push({
        id: 'custom',
        label: 'Пользовательские иконки',
        source: 'custom',
        icons: this._customIcons.map(icon => ({
          ...icon,
          source: 'custom'
        }))
      });
    }

    return result;
  }

  /**
   * Добавляет пользовательскую иконку.
   * @param {{label: string, value: string}} icon
   * @returns {Promise<{id: string, label: string, value: string}>}
   */
  async addCustomIcon(icon) {
    await this.ensureInitialized();

    const normalized = {
      label: icon?.label?.trim(),
      value: normalizeIconValue(icon?.value)
    };

    if (!normalized.value) {
      throw new Error('Класс иконки обязателен');
    }

    const existing = this.findIcon(normalized.value);
    if (existing) {
      return existing;
    }

    let created = { id: `icon-${Date.now()}`, ...normalized };
    if (this.api) {
      try {
        created = await this.api.addCustomIcon(normalized);
      } catch (error) {
        console.warn('[IconLibraryService] Не удалось сохранить пользовательскую иконку:', error);
      }
    }

    this._customIcons.push(created);
    this._notify();
    return created;
  }

  /**
   * Загружает дополнительные иконки из бэкенда.
   * @returns {Promise<Array>}
   */
  async fetchAdditionalGroups() {
    if (this._additionalLoaded || !this.api) {
      return this._additionalGroups;
    }

    try {
      const groups = await this.api.getAdditionalIconGroups();
      if (Array.isArray(groups) && groups.length > 0) {
        const normalized = groups.map(group => ({
          id: group.id || `additional-${Date.now()}`,
          label: group.label || 'Дополнительные иконки',
          icons: Array.isArray(group.icons) ? group.icons.map(icon => ({
            id: icon.id || `icon-${Date.now()}`,
            label: icon.label || icon.value,
            value: icon.value
          })) : []
        }));
        this._additionalGroups = normalized;
        this._notify();
      }
      this._additionalLoaded = true;
    } catch (error) {
      console.warn('[IconLibraryService] Не удалось загрузить дополнительные иконки:', error);
    }

    return this._additionalGroups;
  }

  /**
   * Возвращает информацию об иконке по классу.
   * @param {string|null|undefined} value
   * @returns {{id?: string, label: string, value: string, source: string}|null}
   */
  findIcon(value) {
    if (!value) {
      return null;
    }

    const target = value.trim();

    const lookup = (group) => {
      return group.icons.find(icon => icon.value === target) || null;
    };

    for (const group of BUILTIN_GROUPS) {
      const found = lookup({ icons: group.icons });
      if (found) {
        return { ...found, source: 'builtin' };
      }
    }

    for (const group of this._additionalGroups) {
      const found = lookup(group);
      if (found) {
        return { ...found, source: 'additional' };
      }
    }

    const custom = this._customIcons.find(icon => icon.value === target);
    return custom ? { ...custom, source: 'custom' } : null;
  }

  /**
   * Подписка на изменения библиотеки.
   * @param {(service: IconLibraryService) => void} listener
   * @returns {() => void}
   */
  subscribe(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  _notify() {
    this._listeners.forEach(listener => {
      try {
        listener(this);
      } catch (error) {
        console.error('[IconLibraryService] Ошибка обработчика подписки:', error);
      }
    });
  }
}

export function cloneGroups(groups) {
  return groups.map(group => ({
    id: group.id,
    label: group.label,
    source: group.source,
    icons: group.icons.map(icon => ({ ...icon }))
  }));
}

export function getBuiltinGroups() {
  return BUILTIN_GROUPS.map(group => ({
    id: group.id,
    label: group.label,
    source: 'builtin',
    icons: group.icons.map(icon => ({ ...icon, source: 'builtin' }))
  }));
}

export function normalizeIconValue(raw) {
  if (!raw) {
    return '';
  }

  const tokens = raw
    .split(/\s+/g)
    .map(token => token.trim())
    .filter(Boolean);

  if (tokens.length === 0) {
    return '';
  }

  const weightTokens = new Set([
    'fa',
    'fa-solid',
    'fa-regular',
    'fa-thin',
    'fa-duotone',
    'fa-brands',
    'fa-sharp',
    'fa-light'
  ]);

  const unique = [];
  tokens.forEach(token => {
    const lower = token.toLowerCase();
    if (lower === 'fa-light') {
      return;
    }
    if (weightTokens.has(lower)) {
      return;
    }
    if (!unique.includes(token)) {
      unique.push(token);
    }
  });

  if (unique.length === 0) {
    return '';
  }

  return ['fa-light', ...unique].join(' ');
}


