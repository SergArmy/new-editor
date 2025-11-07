import { EventEmitter } from '../../core/events/EventEmitter.js';
import { logger } from '../../utils/logger.js';

/**
 * @typedef {Object} MetadataObject
 * @property {string} type - Тип объекта
 * @property {string} name - Имя объекта
 * @property {string} displayName - Отображаемое имя
 * @property {string} [description] - Описание
 * @property {Object} [properties] - Свойства объекта
 * @property {string} [uuid] - UUID объекта
 */

/**
 * @class MetadataRegistry
 * @extends EventEmitter
 * @description Реестр объектов метаданных 1С
 */
export class MetadataRegistry extends EventEmitter {
  constructor() {
    super();
    
    /** @type {Map<string, MetadataObject>} */
    this.objects = new Map();
    
    /** @type {boolean} */
    this.isLoaded = false;
    
    /** @type {Promise<void>|null} */
    this.loadPromise = null;
  }

  /**
   * Загружает метаданные из API
   * @param {Object} apiClient - клиент API
   * @returns {Promise<void>}
   */
  async load(apiClient) {
    if (this.isLoaded) {
      return;
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = this._loadFromApi(apiClient);
    return this.loadPromise;
  }

  /**
   * Загружает метаданные из API
   * @private
   * @param {Object} apiClient
   * @returns {Promise<void>}
   */
  async _loadFromApi(apiClient) {
    try {
      // Получаем список объектов метаданных
      const response = await apiClient.get('/metadata/objects');
      
      if (response && response.objects) {
        response.objects.forEach(obj => {
          this.register(obj);
        });
      }

      this.isLoaded = true;
      this.emit('loaded', { count: this.objects.size });
      logger.log(`Loaded ${this.objects.size} metadata objects`);
    } catch (error) {
      logger.error('Failed to load metadata:', error);
      // Не бросаем ошибку, просто логируем
      // Приложение может работать без метаданных
    }
  }

  /**
   * Регистрирует объект метаданных
   * @param {MetadataObject} obj
   */
  register(obj) {
    const key = this._createKey(obj.type, obj.name);
    this.objects.set(key, obj);
    this.emit('register', obj);
  }

  /**
   * Получает объект метаданных
   * @param {string} type - тип объекта
   * @param {string} name - имя объекта
   * @returns {MetadataObject|null}
   */
  get(type, name) {
    const key = this._createKey(type, name);
    return this.objects.get(key) || null;
  }

  /**
   * Проверяет, существует ли объект метаданных
   * @param {string} type
   * @param {string} name
   * @returns {boolean}
   */
  has(type, name) {
    const key = this._createKey(type, name);
    return this.objects.has(key);
  }

  /**
   * Получает все объекты определенного типа
   * @param {string} type
   * @returns {MetadataObject[]}
   */
  getByType(type) {
    const result = [];
    for (const [key, obj] of this.objects) {
      if (obj.type === type) {
        result.push(obj);
      }
    }
    return result;
  }

  /**
   * Ищет объекты по имени (частичное совпадение)
   * @param {string} query - поисковый запрос
   * @param {number} [limit=10] - максимальное количество результатов
   * @returns {MetadataObject[]}
   */
  search(query, limit = 10) {
    const lowerQuery = query.toLowerCase();
    const results = [];

    for (const obj of this.objects.values()) {
      if (results.length >= limit) {
        break;
      }

      const nameMatch = obj.name.toLowerCase().includes(lowerQuery);
      const displayNameMatch = obj.displayName.toLowerCase().includes(lowerQuery);
      
      if (nameMatch || displayNameMatch) {
        results.push(obj);
      }
    }

    return results;
  }

  /**
   * Получает автодополнение для объектов метаданных
   * @param {string} type - тип объекта (опционально)
   * @param {string} query - начало имени
   * @param {number} [limit=10] - максимальное количество результатов
   * @returns {MetadataObject[]}
   */
  autocomplete(type, query, limit = 10) {
    const lowerQuery = query.toLowerCase();
    const results = [];

    for (const obj of this.objects.values()) {
      if (results.length >= limit) {
        break;
      }

      // Если указан тип, фильтруем по нему
      if (type && obj.type !== type) {
        continue;
      }

      const nameMatch = obj.name.toLowerCase().startsWith(lowerQuery);
      
      if (nameMatch) {
        results.push(obj);
      }
    }

    return results;
  }

  /**
   * Очищает реестр
   */
  clear() {
    this.objects.clear();
    this.isLoaded = false;
    this.loadPromise = null;
    this.emit('clear');
  }

  /**
   * Получает количество зарегистрированных объектов
   * @returns {number}
   */
  count() {
    return this.objects.size;
  }

  /**
   * Создает ключ для хранения объекта
   * @private
   * @param {string} type
   * @param {string} name
   * @returns {string}
   */
  _createKey(type, name) {
    return `${type}:${name}`;
  }

  /**
   * Загружает тестовые данные (для разработки)
   */
  loadMockData() {
    const mockObjects = [
      { type: 'catalog', name: 'Nomenclature', displayName: 'Справочник.Номенклатура', description: 'Справочник номенклатуры' },
      { type: 'catalog', name: 'Counterparties', displayName: 'Справочник.Контрагенты', description: 'Справочник контрагентов' },
      { type: 'catalog', name: 'Products', displayName: 'Справочник.Товары', description: 'Справочник товаров' },
      { type: 'document', name: 'SalesInvoice', displayName: 'Документ.РеализацияТоваровУслуг', description: 'Документ реализации товаров и услуг' },
      { type: 'document', name: 'PurchaseInvoice', displayName: 'Документ.ПоступлениеТоваровУслуг', description: 'Документ поступления товаров и услуг' },
      { type: 'document', name: 'PaymentOrder', displayName: 'Документ.ПлатежноеПоручение', description: 'Платежное поручение' },
      { type: 'report', name: 'SalesReport', displayName: 'Отчет.ОтчетПоПродажам', description: 'Отчет по продажам' },
      { type: 'dataProcessor', name: 'DataImport', displayName: 'Обработка.ЗагрузкаДанных', description: 'Загрузка данных из внешних источников' },
      { type: 'informationRegister', name: 'Prices', displayName: 'РегистрСведений.Цены', description: 'Регистр цен номенклатуры' },
      { type: 'accumulationRegister', name: 'Sales', displayName: 'РегистрНакопления.Продажи', description: 'Регистр накопления продаж' },
    ];

    mockObjects.forEach(obj => this.register(obj));
    this.isLoaded = true;
    this.emit('loaded', { count: this.objects.size });
    logger.log(`Loaded ${this.objects.size} mock metadata objects`);
  }
}

// Синглтон инстанс
export const metadataRegistry = new MetadataRegistry();

