/**
 * @typedef {() => any} Factory
 */

export class Container {
    constructor() {
        /** @type {Map<string, Factory>} */
        this.factories = new Map();
        /** @type {Map<string, any>} */
        this.instances = new Map();
    }

    /**
     * @param {string} token
     * @param {Factory} factory
     */
    register(token, factory) {
        if (this.factories.has(token)) throw new Error(`Factory already registered for token: ${token}`);
        this.factories.set(token, factory);
    }

    /**
     * @template T
     * @param {string} token
     * @returns {T}
     */
    resolve(token) {
        if (this.instances.has(token)) return this.instances.get(token);
        const factory = this.factories.get(token);
        if (!factory) throw new Error(`No factory registered for token: ${token}`);
        const instance = factory();
        this.instances.set(token, instance);
        return instance;
    }
}


