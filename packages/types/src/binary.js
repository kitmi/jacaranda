import { ValidationError } from './errors';

class T_BINARY {
    name = 'binary';
    alias = ['blob', 'buffer'];
    primitive = true;
    defaultValue = null;

    constructor(system) {
        this.system = system;
    }

    validate(value) {
        return value instanceof Buffer;
    }

    _sanitize(value, meta, opts) {
        if (value instanceof Buffer) {
            return value;
        }

        if (typeof value === 'string') {
            return Buffer.from(value, meta.encoding || 'base64');
        }

        throw new ValidationError('Invalid binary value.', {
            value: opts.rawValue,
            path: opts.path,
        });
    }

    serialize(value, meta) {
        return value == null ? null : value.toString(meta.encoding || 'base64');
    }
}

export default T_BINARY;
