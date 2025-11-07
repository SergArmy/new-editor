import { DebouncedSaveStrategy } from './SaveStrategy.js';

const DEFAULT_STATUS = 'saved';

/**
 * @typedef {'saved'|'saving'|'pending'|'error'} AutoSaveStatus
 */

export class AutoSaveManager {
  /**
   * @param {(payload: any) => Promise<void>} saveFn
   * @param {Object} [options]
   * @param {import('./SaveStrategy.js').SaveStrategy} [options.strategy]
   * @param {number} [options.interval]
   */
  constructor(saveFn, options = {}) {
    if (typeof saveFn !== 'function') {
      throw new Error('AutoSaveManager requires a save function');
    }

    const { strategy, ...strategyOptions } = options;

    this.saveFn = saveFn;
    this.status = DEFAULT_STATUS;
    this.lastError = null;
    this.lastSavedAt = null;
    this._hasPendingChanges = false;
    this._isSaving = false;
    this._listeners = new Set();
    this._teardown = null;

    const strategyInstance = strategy || new DebouncedSaveStrategy(
      (payload) => this._executeSave(payload),
      strategyOptions
    );

    this.strategy = strategyInstance;
  }

  /**
   * Возвращает текущий статус
   * @returns {AutoSaveStatus}
   */
  getStatus() {
    return /** @type {AutoSaveStatus} */ (this.status);
  }

  /**
   * Возвращает время последнего успешного сохранения
   * @returns {Date|null}
   */
  getLastSavedAt() {
    return this.lastSavedAt;
  }

  /**
   * Возвращает последнюю ошибку сохранения
   * @returns {Error|null}
   */
  getLastError() {
    return this.lastError;
  }

  /**
   * Настраивает источник изменений (обратная совместимость)
   * @param {(handler: Function) => (Function|void)} registerChangeHandler
   * @returns {void}
   */
  setup(registerChangeHandler) {
    if (typeof registerChangeHandler !== 'function') {
      return;
    }

    if (this._teardown) {
      this._teardown();
    }

    const teardown = registerChangeHandler((data) => {
      this.scheduleSave(data);
    });

    this._teardown = typeof teardown === 'function' ? teardown : null;
  }

  /**
   * Планирует автосохранение с использованием стратегии
   * @param {any|(() => any)|(() => Promise<any>)} dataOrProvider
   */
  scheduleSave(dataOrProvider) {
    this._hasPendingChanges = true;
    this.lastError = null;
    this.setStatus('pending');

    if (this.strategy && typeof this.strategy.handleChange === 'function') {
      this.strategy.handleChange(dataOrProvider);
      return;
    }

    this._executeSave(dataOrProvider);
  }

  /**
   * Выполняет немедленное сохранение, минуя стратегию
   * @param {any|(() => any)|(() => Promise<any>)} [dataOrProvider]
   * @returns {Promise<void>}
   */
  async saveNow(dataOrProvider) {
    if (dataOrProvider !== undefined) {
      if (this.strategy && typeof this.strategy.cancelPending === 'function') {
        this.strategy.cancelPending();
      }
      return this._executeSave(dataOrProvider);
    }

    if (this.strategy && typeof this.strategy.flush === 'function') {
      await this.strategy.flush();
      return;
    }

    // Нет данных для сохранения — считаем, что все уже сохранено
    this.setStatus(this._hasPendingChanges ? 'pending' : 'saved');
  }

  /**
   * Принудительно помечает состояние как сохраненное (например, после загрузки документа)
   * @param {Date|string} [timestamp]
   */
  markSaved(timestamp = new Date()) {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    this.lastSavedAt = Number.isNaN(date.getTime()) ? new Date() : date;
    this._hasPendingChanges = false;
    this.lastError = null;
    this.setStatus('saved');
  }

  /**
   * Подписка на изменения статуса
   * @param {(status: AutoSaveStatus, error?: Error|null) => void} callback
   * @returns {() => void}
   */
  onStatusChangeSubscribe(callback) {
    if (typeof callback !== 'function') {
      return () => {};
    }

    this._listeners.add(callback);

    // Немедленно уведомляем о текущем статусе
    callback(this.getStatus(), this.lastError);

    return () => {
      this._listeners.delete(callback);
    };
  }

  /**
   * @param {AutoSaveStatus} status
   * @param {Error|null} [error]
   */
  setStatus(status, error = null) {
    this.status = status;
    this.lastError = error;

    for (const listener of this._listeners) {
      listener(status, error);
    }
  }

  /**
   * @param {any|(() => any)|(() => Promise<any>)} dataOrProvider
   * @returns {Promise<void>}
   * @private
   */
  async _executeSave(dataOrProvider) {
    this._isSaving = true;
    this.setStatus('saving');

    // Сбрасываем индикатор ожидающих изменений для текущего сохранения
    this._hasPendingChanges = false;

    try {
      const payload = await this._resolveData(dataOrProvider);
      await this.saveFn(payload);

      this.lastSavedAt = new Date();
      this._isSaving = false;

      if (this._hasPendingChanges) {
        this.setStatus('pending');
      } else {
        this.setStatus('saved');
      }
    } catch (error) {
      this._isSaving = false;
      this.lastError = /** @type {Error} */ (error);
      this.setStatus('error', this.lastError);
      throw error;
    }
  }

  /**
   * @param {any|(() => any)|(() => Promise<any>)} dataOrProvider
   * @returns {Promise<any>}
   * @private
   */
  async _resolveData(dataOrProvider) {
    if (typeof dataOrProvider === 'function') {
      const result = dataOrProvider();
      return result instanceof Promise ? await result : result;
    }
    return dataOrProvider;
  }

  destroy() {
    if (this._teardown) {
      this._teardown();
      this._teardown = null;
    }

    if (this.strategy && typeof this.strategy.destroy === 'function') {
      this.strategy.destroy();
    }

    this._listeners.clear();
    this._hasPendingChanges = false;
    this._isSaving = false;
  }
}

