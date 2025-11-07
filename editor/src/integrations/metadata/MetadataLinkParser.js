/**
 * @module MetadataLinkParser
 * @description Парсер ссылок на объекты метаданных 1С
 */

/**
 * @typedef {Object} MetadataLink
 * @property {string} type - Тип объекта (catalog, document, etc.)
 * @property {string} name - Имя объекта
 * @property {string} displayName - Отображаемое имя
 * @property {string} href - Полная ссылка
 */

/**
 * @class MetadataLinkParser
 * @description Парсер для ссылок на объекты метаданных 1С
 */
export class MetadataLinkParser {
  /**
   * Регулярное выражение для поиска ссылок на метаданные
   * Формат: #metadata:type:name
   * Пример: #metadata:catalog:Nomenclature
   */
  static METADATA_LINK_REGEX = /#metadata:([a-z]+):([a-zA-Z0-9_]+)/gi;

  /**
   * Типы объектов метаданных (русские названия)
   */
  static METADATA_TYPES = {
    catalog: 'Справочник',
    document: 'Документ',
    dataProcessor: 'Обработка',
    report: 'Отчет',
    chartOfCharacteristicTypes: 'ПланВидовХарактеристик',
    chartOfAccounts: 'ПланСчетов',
    chartOfCalculationTypes: 'ПланВидовРасчета',
    informationRegister: 'РегистрСведений',
    accumulationRegister: 'РегистрНакопления',
    accountingRegister: 'РегистрБухгалтерии',
    calculationRegister: 'РегистрРасчета',
    businessProcess: 'БизнесПроцесс',
    task: 'Задача',
    constant: 'Константа',
    enum: 'Перечисление',
    role: 'Роль',
    commonModule: 'ОбщийМодуль',
    sessionParameter: 'ПараметрСеанса',
    definedType: 'ОпределяемыйТип',
    commonAttribute: 'ОбщийРеквизит',
    exchangePlan: 'ПланОбмена',
    filterCriterion: 'КритерийОтбора',
    settingsStorage: 'ХранилищеНастроек',
    functionalOption: 'ФункциональнаяОпция',
    functionalOptionsParameter: 'ПараметрФункциональныхОпций',
    webService: 'WebСервис',
    httpService: 'HTTPСервис',
    wsReference: 'WSСсылка',
    styleItem: 'ЭлементСтиля',
    language: 'Язык',
    commonForm: 'ОбщаяФорма',
    commonCommand: 'ОбщаяКоманда',
    commandGroup: 'ГруппаКоманд',
    commonTemplate: 'ОбщийМакет',
    commonPicture: 'ОбщаяКартинка',
    xdtoPackage: 'XDTOПакет',
    externalDataSource: 'ВнешнийИсточникДанных',
    subsystem: 'Подсистема'
  };

  /**
   * Парсит строку и извлекает ссылки на метаданные
   * @param {string} text - текст для парсинга
   * @returns {MetadataLink[]} массив найденных ссылок
   */
  static parse(text) {
    const links = [];
    const regex = new RegExp(this.METADATA_LINK_REGEX);
    let match;

    while ((match = regex.exec(text)) !== null) {
      const [fullMatch, type, name] = match;
      
      links.push({
        type,
        name,
        displayName: this.getDisplayName(type, name),
        href: fullMatch
      });
    }

    return links;
  }

  /**
   * Проверяет, является ли строка ссылкой на метаданные
   * @param {string} href - проверяемая ссылка
   * @returns {boolean}
   */
  static isMetadataLink(href) {
    if (!href) return false;
    return href.startsWith('#metadata:');
  }

  /**
   * Парсит одну ссылку на метаданные
   * @param {string} href - ссылка для парсинга
   * @returns {MetadataLink|null}
   */
  static parseLink(href) {
    if (!this.isMetadataLink(href)) {
      return null;
    }

    const match = href.match(/^#metadata:([a-z]+):([a-zA-Z0-9_]+)$/i);
    if (!match) {
      return null;
    }

    const [, type, name] = match;
    
    return {
      type,
      name,
      displayName: this.getDisplayName(type, name),
      href
    };
  }

  /**
   * Получает отображаемое имя для объекта метаданных
   * @param {string} type - тип объекта
   * @param {string} name - имя объекта
   * @returns {string}
   */
  static getDisplayName(type, name) {
    const typeName = this.METADATA_TYPES[type] || type;
    return `${typeName}.${name}`;
  }

  /**
   * Создает ссылку на объект метаданных
   * @param {string} type - тип объекта
   * @param {string} name - имя объекта
   * @returns {string}
   */
  static createLink(type, name) {
    return `#metadata:${type}:${name}`;
  }

  /**
   * Получает русское название типа
   * @param {string} type - тип объекта (английский)
   * @returns {string}
   */
  static getTypeDisplayName(type) {
    return this.METADATA_TYPES[type] || type;
  }

  /**
   * Получает список всех поддерживаемых типов
   * @returns {Array<{value: string, label: string}>}
   */
  static getSupportedTypes() {
    return Object.entries(this.METADATA_TYPES).map(([value, label]) => ({
      value,
      label
    }));
  }

  /**
   * Преобразует текст, заменяя ссылки на метаданные HTML элементами
   * @param {string} text - исходный текст
   * @param {Function} [linkRenderer] - функция для рендеринга ссылки
   * @returns {string} HTML строка
   */
  static renderLinks(text, linkRenderer = null) {
    const defaultRenderer = (link) => {
      return `<a href="${link.href}" class="metadata-link" data-type="${link.type}" data-name="${link.name}" title="${link.displayName}">${link.displayName}</a>`;
    };

    const renderer = linkRenderer || defaultRenderer;
    const regex = new RegExp(this.METADATA_LINK_REGEX);
    
    return text.replace(regex, (match, type, name) => {
      const link = {
        type,
        name,
        displayName: this.getDisplayName(type, name),
        href: match
      };
      return renderer(link);
    });
  }
}

