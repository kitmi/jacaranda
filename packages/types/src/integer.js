import { ValidationError } from './errors';
import toInteger from '@kitmi/utils/toInteger';
import { identity } from './functions';

class T_INTEGER {
    name = 'integer';
    alias = ['int'];
    primitive = true;
    scalar = true;
    defaultValue = 0;

    constructor(system) {
        this.system = system;
    }

    validate(value) {
        return typeof value === 'number' && Number.isInteger(value);
    }

    _sanitize(value, meta, opts) {
        value = toInteger(value);

        if (isNaN(value)) {
            throw new ValidationError('Invalid integer value.', {
                value: null,
                meta,
                rawValue: opts.rawValue,
                i18n: opts.i18n,
                path: opts.path,
            });
        }

        return value;
    }

    serialize = identity;
}

export default T_INTEGER;
