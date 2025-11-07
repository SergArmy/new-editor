export class SaveStrategy {
  /**
   * @param {(payload: any) => Promise<void>} saveFn
   * @param {Object} options
   */
  constructor(saveFn, options = {}) {
    this.saveFn = saveFn;
    this.options = options;
  }

  /**
   * Вызывается для обработки изменений (по умолчанию — мгновенное сохранение)
   * @param {any} data
   * @returns {Promise<void>}
   */
  async handleChange(data) {
    await this.save(data);
  }

  /**
   * Выполняет сохранение
   * @param {any} data
   * @returns {Promise<void>}
   */
  async save(data) {
    return this.saveFn(data);
  }

  /**
   * Принудительное выполнение ожидающего сохранения
   * @returns {Promise<void>}
   */
  async flush() {
    // Переопределяется в подклассах при необходимости
    return Promise.resolve();
  }

  /**
   * Отменяет ожидающие операции
   */
  cancelPending() {
    // Переопределяется в подклассах при необходимости
  }

  destroy() {
    // Очистка ресурсов в подклассах
  }
}

export class DebouncedSaveStrategy extends SaveStrategy {
  constructor(saveFn, options = {}) {
    super(saveFn, options);
    this.interval = options.interval || 3000;
    this.timer = null;
    this.pendingData = null;
  }

  handleChange(data) {
    this.pendingData = data;
    if (this.timer) {
      clearTimeout(this.timer);
    }

    this.timer = setTimeout(() => {
      this.timer = null;
      const payload = this.pendingData;
      this.pendingData = null;
      this.save(payload);
    }, this.interval);
  }

  async flush() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.pendingData !== null) {
      const payload = this.pendingData;
      this.pendingData = null;
      await this.save(payload);
    }
  }

  cancelPending() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.pendingData = null;
  }

  destroy() {
    this.cancelPending();
  }
}

export class PeriodicSaveStrategy extends SaveStrategy {
  constructor(saveFn, options = {}) {
    super(saveFn, options);
    this.interval = options.interval || 30000;
    this.timer = null;
    this.hasChanges = false;
    this.pendingData = null;

    this.timer = setInterval(() => {
      if (!this.hasChanges) return;
      this.hasChanges = false;
      const payload = this.pendingData;
      this.pendingData = null;
      this.save(payload);
    }, this.interval);
  }

  handleChange(data) {
    this.pendingData = data;
    this.hasChanges = true;
  }

  async flush() {
    if (this.hasChanges && this.pendingData !== null) {
      const payload = this.pendingData;
      this.pendingData = null;
      this.hasChanges = false;
      await this.save(payload);
    }
  }

  cancelPending() {
    this.pendingData = null;
    this.hasChanges = false;
  }

  destroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.cancelPending();
  }
}

