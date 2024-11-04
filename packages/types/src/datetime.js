import { ValidationError, ApplicationError } from './errors';

class T_DATETIME {
    name = 'datetime';
    alias = ['date', 'time', 'timestamp'];
    primitive = true;
    scalar = true;
    defaultValue = new Date(0);

    constructor(system) {
        this.system = system;
    }

    validate(value) {
        return value instanceof Date;
    }

    /**
     * Transform a value into a JavaScript Date object.
     * @param {*} value
     * @param {*} meta
     * @param {*} i18n
     * @param {string} [path]
     * @returns {Date|null}
     */
    _sanitize(value, meta, opts) {
        if (value instanceof Date) {
            return value;
        } else {
            const type = typeof value;

            if (type === 'string') {
                if (meta.format) {
                    const parser = this.system.plugins.datetimeParser;
                    if (!parser) {
                        throw new ApplicationError('Missing datetime parser plugin.');
                    }
                    value = parser(value, { format: meta.format, timezone: opts.i18n?.timezone });
                } else {
                    value = new Date(value);
                }
            } else if (type === 'number') {
                value = new Date(value);
            } else if (value.toJSDate) {
                value = value.toJSDate();
            }

            if (isNaN(value)) {
                throw new ValidationError('Invalid datetime value.', {
                    value: opts.rawValue,
                    path: opts.path,
                });
            }
        }

        return value;
    }

    serialize(value) {
        return value?.toISOString();
    }
}

export default T_DATETIME;
