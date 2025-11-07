import { Container } from './Container.js';
import { ServiceRegistry } from './ServiceRegistry.js';

export function createContainer() {
    return new Container();
}

export { ServiceRegistry };


