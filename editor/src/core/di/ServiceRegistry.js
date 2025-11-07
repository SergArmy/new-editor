export class ServiceRegistry {
    constructor(container) {
        this.container = container;
    }

    registerValue(token, value) {
        this.container.register(token, () => value);
    }

    registerClass(token, ClassCtor, deps = []) {
        this.container.register(token, () => new ClassCtor(...deps.map(d => this.container.resolve(d))));
    }
}


