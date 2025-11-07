export class EventEmitter {
    constructor() {
        this.listeners = new Map();
    }

    on(type, listener) {
        if (!this.listeners.has(type)) this.listeners.set(type, new Set());
        this.listeners.get(type).add(listener);
        return () => this.off(type, listener);
    }

    off(type, listener) {
        const set = this.listeners.get(type);
        if (set) set.delete(listener);
    }

    emit(type, detail) {
        const set = this.listeners.get(type);
        if (!set) return 0;
        let count = 0;
        for (const l of set) { l(detail); count++; }
        return count;
    }
}


