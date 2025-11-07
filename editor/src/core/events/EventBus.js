import { EventEmitter } from './EventEmitter.js';

export class EventBus extends EventEmitter {
    constructor() {
        super();
    }
}

export function createEventBus() {
    return new EventBus();
}


