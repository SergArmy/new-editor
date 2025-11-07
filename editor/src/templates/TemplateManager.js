import { EventEmitter } from '../core/events/EventEmitter.js';
import { Template } from './Template.js';
import { logger } from '../utils/logger.js';

/**
 * @class TemplateManager
 * @extends EventEmitter
 * @description Менеджер шаблонов документов
 */
export class TemplateManager extends EventEmitter {
  constructor() {
    super();
    
    /** @type {Map<string, Template>} */
    this.templates = new Map();
    
    /** @type {Map<string, Template[]>} */
    this.categoriesCache = new Map();
    
    /** @type {boolean} */
    this.isLoaded = false;
  }

  /**
   * Загружает шаблоны
   * @param {Object} apiClient - клиент API
   * @returns {Promise<void>}
   */
  async load(apiClient) {
    if (this.isLoaded) {
      return;
    }

    try {
      const response = await apiClient.get('/templates');
      
      if (response && response.templates) {
        response.templates.forEach(templateData => {
          const template = Template.fromJSON(templateData);
          this.register(template);
        });
      }

      this.isLoaded = true;
      this.emit('loaded', { count: this.templates.size });
      logger.log(`Loaded ${this.templates.size} templates`);
    } catch (error) {
      logger.error('Failed to load templates:', error);
      // Загружаем встроенные шаблоны
      this.loadBuiltInTemplates();
    }
  }

  /**
   * Регистрирует шаблон
   * @param {Template} template
   */
  register(template) {
    this.templates.set(template.id, template);
    this._invalidateCache();
    this.emit('register', template);
  }

  /**
   * Получает шаблон по ID
   * @param {string} id
   * @returns {Template|null}
   */
  get(id) {
    return this.templates.get(id) || null;
  }

  /**
   * Получает все шаблоны
   * @returns {Template[]}
   */
  getAll() {
    return Array.from(this.templates.values());
  }

  /**
   * Получает шаблоны по категории
   * @param {string} category
   * @returns {Template[]}
   */
  getByCategory(category) {
    if (this.categoriesCache.has(category)) {
      return this.categoriesCache.get(category);
    }

    const templates = Array.from(this.templates.values())
      .filter(t => t.category === category);
    
    this.categoriesCache.set(category, templates);
    return templates;
  }

  /**
   * Получает список категорий
   * @returns {string[]}
   */
  getCategories() {
    const categories = new Set();
    this.templates.forEach(template => {
      categories.add(template.category);
    });
    return Array.from(categories);
  }

  /**
   * Ищет шаблоны по запросу
   * @param {string} query
   * @returns {Template[]}
   */
  search(query) {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.templates.values())
      .filter(t => 
        t.name.toLowerCase().includes(lowerQuery) ||
        t.description.toLowerCase().includes(lowerQuery)
      );
  }

  /**
   * Создает документ из шаблона
   * @param {string} templateId - ID шаблона
   * @param {Object} variables - значения переменных
   * @returns {Object} данные документа
   */
  createDocument(templateId, variables = {}) {
    const template = this.get(templateId);
    
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Валидация переменных
    const validation = template.validate(variables);
    if (!validation.valid) {
      throw new Error(`Template validation failed: ${validation.errors.join(', ')}`);
    }

    // Применяем переменные
    const processedTemplate = template.apply(variables);

    // Создаем данные документа
    const documentData = {
      title: variables.documentTitle || template.name,
      blocks: processedTemplate.blocks,
      metadata: {
        ...template.metadata,
        templateId: template.id,
        templateName: template.name,
        createdFrom: 'template',
        variables
      }
    };

    this.emit('document-created', { template, documentData });
    logger.log(`Document created from template: ${template.name}`);

    return documentData;
  }

  /**
   * Сохраняет кастомный шаблон
   * @param {Object} templateData
   * @returns {Template}
   */
  saveCustomTemplate(templateData) {
    const template = new Template({
      id: `custom-${Date.now()}`,
      ...templateData,
      metadata: {
        ...templateData.metadata,
        custom: true
      }
    });

    this.register(template);
    this._saveToLocalStorage();
    
    this.emit('template-saved', template);
    logger.log(`Custom template saved: ${template.name}`);

    return template;
  }

  /**
   * Удаляет шаблон
   * @param {string} id
   * @returns {boolean}
   */
  delete(id) {
    const template = this.get(id);
    
    if (!template) {
      return false;
    }

    // Нельзя удалять встроенные шаблоны
    if (!template.metadata.custom) {
      throw new Error('Cannot delete built-in template');
    }

    this.templates.delete(id);
    this._invalidateCache();
    this._saveToLocalStorage();
    
    this.emit('template-deleted', { id });
    logger.log(`Template deleted: ${id}`);

    return true;
  }

  /**
   * Загружает встроенные шаблоны
   */
  loadBuiltInTemplates() {
    const builtInTemplates = [
      {
        id: 'tech-spec',
        name: 'Техническое задание',
        description: 'Шаблон технического задания на доработку',
        category: 'specifications',
        variables: {
          documentTitle: { type: 'string', required: true, label: 'Название документа' },
          projectName: { type: 'string', required: true, label: 'Название проекта' },
          authorName: { type: 'string', required: true, label: 'Автор' },
          date: { type: 'string', required: false, label: 'Дата' }
        },
        blocks: [
          {
            type: 'header',
            data: {
              title: '{{documentTitle}}',
              subtitle: 'Техническое задание',
              metadata: {
                author: '{{authorName}}',
                date: '{{date}}',
                project: '{{projectName}}'
              }
            }
          },
          {
            type: 'section',
            data: {
              title: '1. Введение',
              level: 1
            }
          },
          {
            type: 'text',
            data: {
              text: 'Настоящее техническое задание определяет требования к разработке...'
            }
          },
          {
            type: 'section',
            data: {
              title: '2. Цели и задачи',
              level: 1
            }
          },
          {
            type: 'text',
            data: {
              text: 'Основные цели проекта:'
            }
          },
          {
            type: 'section',
            data: {
              title: '3. Функциональные требования',
              level: 1
            }
          },
          {
            type: 'section',
            data: {
              title: '4. Технические требования',
              level: 1
            }
          },
          {
            type: 'section',
            data: {
              title: '5. Критерии приемки',
              level: 1
            }
          }
        ],
        metadata: {
          custom: false
        }
      },
      {
        id: 'user-manual',
        name: 'Руководство пользователя',
        description: 'Шаблон инструкции для пользователей',
        category: 'documentation',
        variables: {
          documentTitle: { type: 'string', required: true, label: 'Название' },
          systemName: { type: 'string', required: true, label: 'Название системы' }
        },
        blocks: [
          {
            type: 'header',
            data: {
              title: '{{documentTitle}}',
              subtitle: 'Руководство пользователя системы {{systemName}}'
            }
          },
          {
            type: 'section',
            data: {
              title: '1. Общие сведения',
              level: 1
            }
          },
          {
            type: 'section',
            data: {
              title: '2. Начало работы',
              level: 1
            }
          },
          {
            type: 'steps',
            data: {
              title: 'Вход в систему',
              steps: [
                'Откройте браузер',
                'Перейдите по адресу',
                'Введите логин и пароль',
                'Нажмите кнопку "Войти"'
              ]
            }
          },
          {
            type: 'section',
            data: {
              title: '3. Основные функции',
              level: 1
            }
          }
        ],
        metadata: {
          custom: false
        }
      },
      {
        id: 'coding-standard',
        name: 'Стандарт кодирования',
        description: 'Шаблон стандарта написания кода',
        category: 'standards',
        variables: {
          documentTitle: { type: 'string', required: true, label: 'Название стандарта' },
          language: { type: 'string', required: true, label: 'Язык программирования' }
        },
        blocks: [
          {
            type: 'header',
            data: {
              title: '{{documentTitle}}',
              subtitle: 'Стандарт кодирования на языке {{language}}'
            }
          },
          {
            type: 'section',
            data: {
              title: '1. Общие принципы',
              level: 1
            }
          },
          {
            type: 'section',
            data: {
              title: '2. Именование',
              level: 1
            }
          },
          {
            type: 'section',
            data: {
              title: '3. Форматирование',
              level: 1
            }
          },
          {
            type: 'section',
            data: {
              title: '4. Комментарии и документация',
              level: 1
            }
          },
          {
            type: 'section',
            data: {
              title: '5. Обработка ошибок',
              level: 1
            }
          }
        ],
        metadata: {
          custom: false
        }
      },
      {
        id: 'business-process',
        name: 'Описание бизнес-процесса',
        description: 'Шаблон для описания бизнес-процессов',
        category: 'processes',
        variables: {
          processName: { type: 'string', required: true, label: 'Название процесса' },
          owner: { type: 'string', required: true, label: 'Владелец процесса' }
        },
        blocks: [
          {
            type: 'header',
            data: {
              title: 'Бизнес-процесс: {{processName}}',
              metadata: {
                owner: '{{owner}}'
              }
            }
          },
          {
            type: 'section',
            data: {
              title: '1. Описание процесса',
              level: 1
            }
          },
          {
            type: 'section',
            data: {
              title: '2. Участники процесса',
              level: 1
            }
          },
          {
            type: 'roles',
            data: {
              roles: [
                { name: 'Инициатор', description: '' },
                { name: 'Исполнитель', description: '' },
                { name: 'Контролер', description: '' }
              ]
            }
          },
          {
            type: 'section',
            data: {
              title: '3. Этапы процесса',
              level: 1
            }
          },
          {
            type: 'section',
            data: {
              title: '4. Используемые объекты 1С',
              level: 1
            }
          }
        ],
        metadata: {
          custom: false
        }
      }
    ];

    builtInTemplates.forEach(templateData => {
      const template = new Template(templateData);
      this.register(template);
    });

    this.isLoaded = true;
    logger.log(`Loaded ${builtInTemplates.length} built-in templates`);
  }

  /**
   * Сохраняет кастомные шаблоны в localStorage
   * @private
   */
  _saveToLocalStorage() {
    const customTemplates = Array.from(this.templates.values())
      .filter(t => t.metadata.custom)
      .map(t => t.toJSON());

    try {
      localStorage.setItem('custom-templates', JSON.stringify(customTemplates));
    } catch (error) {
      logger.error('Failed to save custom templates to localStorage:', error);
    }
  }

  /**
   * Загружает кастомные шаблоны из localStorage
   * @private
   */
  _loadFromLocalStorage() {
    try {
      const stored = localStorage.getItem('custom-templates');
      if (stored) {
        const customTemplates = JSON.parse(stored);
        customTemplates.forEach(templateData => {
          const template = Template.fromJSON(templateData);
          this.register(template);
        });
        logger.log(`Loaded ${customTemplates.length} custom templates from localStorage`);
      }
    } catch (error) {
      logger.error('Failed to load custom templates from localStorage:', error);
    }
  }

  /**
   * Инвалидирует кеш категорий
   * @private
   */
  _invalidateCache() {
    this.categoriesCache.clear();
  }

  /**
   * Инициализирует менеджер
   */
  initialize() {
    this.loadBuiltInTemplates();
    this._loadFromLocalStorage();
  }
}

// Синглтон инстанс
export const templateManager = new TemplateManager();

