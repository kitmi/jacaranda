import { everTrue, identity } from './functions';

class T_ANY {
    name = 'any';
    alias = ['*'];
    defaultValue = null;
    validate = everTrue;
    _sanitize = identity;

    constructor(system) {
        this.system = system;
    }

    serialize(value) {
        return typeof value === 'object' ? JSON.stringify(value) : value;
    }
}

export default T_ANY;
