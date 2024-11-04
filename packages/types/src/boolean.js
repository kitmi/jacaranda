import { ValidationError } from './errors';
import toBoolean from '@kitmi/utils/toBoolean';
import { identity } from './functions';

class T_BOOLEAN {
    name = 'boolean';
    alias = ['bool'];
    primitive = true;
    defaultValue = false;

    constructor(system) {
        this.system = system;
    }
    validate(value) {
        return typeof value === 'boolean';
    }

    _sanitize(value, meta, opts) {
        try {
            return toBoolean(value);
        } catch (e) {
            throw new ValidationError('Invalid boolean value. ' + e.message, {
                value: opts.rawValue,
                path: opts.path,
            });
        }
    }

    serialize = identity;
}

export default T_BOOLEAN;
