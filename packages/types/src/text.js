import { identity } from './functions';
import { ValidationError } from './errors';

class T_TEXT {
    name = 'text';
    alias = ['string'];
    primitive = true;
    scalar = true;
    defaultValue = '';

    constructor(system) {
        this.system = system;
    }

    validate(value) {
        return typeof value === 'string';
    }

    _sanitize(value, meta, opts) {
        const type = typeof value;
        const isString = type === 'string';

        if (isString) {
            if (!meta.noTrim) {
                value = value.trim();
            }

            if (value === '' && meta.emptyAsNull) {
                value = null;
                if (!meta.optional) {
                    throw new ValidationError('Missing a required value.', {
                        value: opts.rawValue,
                        path: opts.path,
                    });
                }
            }
        } else {
            if (type === 'bigint' || type === 'number') {
                return value.toString();
            }

            throw new ValidationError('Invalid text value.', {
                value: opts.rawValue,
                path: opts.path,
            });
        }

        return value;
    }

    serialize = identity;
}

export default T_TEXT;
