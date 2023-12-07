import { ValidationError } from './errors';
import toFloat from '@kit/utils/toFloat';
import { identity } from './functions';

class T_NUMBER {
    name = 'number';
    alias = ['float', 'double'];
    primitive = true;
    scalar = true;
    defaultValue = 0;

    constructor(system) {
        this.system = system;
    }

    validate(value) {
        return typeof value === 'number';
    }

    _sanitize(value, meta, opts) {
        value = toFloat(value);

        if (isNaN(value)) {
            throw new ValidationError('Invalid number value.', {
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

export default T_NUMBER;
