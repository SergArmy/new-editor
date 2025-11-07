import { logger } from '../../utils/logger.js';

/**
 * @class MonacoLoader
 * @description Загрузчик Monaco Editor с поддержкой lazy loading
 */
export class MonacoLoader {
  constructor() {
    /** @type {boolean} */
    this.isLoaded = false;

    /** @type {boolean} */
    this.isLoading = false;

    /** @type {Promise<any>|null} */
    this.loadPromise = null;

    /** @type {any} */
    this.monaco = null;

    /** @type {string} */
    this.cdnUrl = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs';
  }

  /**
   * Загружает Monaco Editor
   * @returns {Promise<any>} Monaco API
   */
  async load() {
    // Если уже загружен, возвращаем
    if (this.isLoaded && this.monaco) {
      return this.monaco;
    }

    // Если идет загрузка, ждем ее завершения
    if (this.isLoading && this.loadPromise) {
      return this.loadPromise;
    }

    // Проверяем, может Monaco уже есть в глобальной области
    if (window.monaco) {
      this.monaco = window.monaco;
      this.isLoaded = true;
      logger.log('Monaco Editor already loaded from global scope');
      return this.monaco;
    }

    this.isLoading = true;

    this.loadPromise = new Promise((resolve, reject) => {
      try {
        // Настройка require для Monaco
        window.require = { paths: { vs: this.cdnUrl } };

        // Создаем script элемент для загрузки
        const script = document.createElement('script');
        script.src = `${this.cdnUrl}/loader.js`;
        script.async = true;

        script.onload = () => {
          // После загрузки loader.js, загружаем сам Monaco
          window.require(['vs/editor/editor.main'], () => {
            this.monaco = window.monaco;
            this.isLoaded = true;
            this.isLoading = false;
            logger.log('Monaco Editor loaded successfully');
            resolve(this.monaco);
          });
        };

        script.onerror = () => {
          this.isLoading = false;
          const error = new Error('Failed to load Monaco Editor from CDN');
          logger.error('Monaco loading error:', error);
          reject(error);
        };

        document.head.appendChild(script);
      } catch (error) {
        this.isLoading = false;
        logger.error('Monaco loading exception:', error);
        reject(error);
      }
    });

    return this.loadPromise;
  }

  /**
   * Проверяет, доступен ли Monaco
   * @returns {boolean}
   */
  isAvailable() {
    return this.isLoaded && this.monaco !== null;
  }

  /**
   * Получает Monaco API
   * @returns {any|null}
   */
  getMonaco() {
    return this.monaco;
  }

  /**
   * Устанавливает кастомный CDN URL
   * @param {string} url
   */
  setCdnUrl(url) {
    if (this.isLoaded || this.isLoading) {
      logger.warn('Cannot change CDN URL after loading has started');
      return;
    }
    this.cdnUrl = url;
  }
}

// Синглтон инстанс
export const monacoLoader = new MonacoLoader();

