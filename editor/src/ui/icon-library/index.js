import { IconLibraryService, normalizeIconValue } from './IconLibraryService.js';

let iconLibraryInstance = null;

/**
 * Создает и сохраняет экземпляр сервиса библиотеки иконок.
 * @param {{ api?: import('../../api/IconLibraryApi.js').IconLibraryApi }} [options]
 * @returns {IconLibraryService}
 */
export function createIconLibrary(options = {}) {
  iconLibraryInstance = new IconLibraryService(options);
  return iconLibraryInstance;
}

/**
 * Устанавливает внешне созданный экземпляр сервиса.
 * @param {IconLibraryService} instance
 */
export function setIconLibraryInstance(instance) {
  iconLibraryInstance = instance;
}

/**
 * Возвращает текущий экземпляр библиотеки иконок.
 * @returns {IconLibraryService}
 */
export function getIconLibraryInstance() {
  if (!iconLibraryInstance) {
    throw new Error('IconLibraryService is not initialized. Call createIconLibrary() during app bootstrap.');
  }
  return iconLibraryInstance;
}

export { IconLibraryService, normalizeIconValue } from './IconLibraryService.js';


