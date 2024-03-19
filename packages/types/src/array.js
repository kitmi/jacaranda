import { ValidationError } from './errors';

import csvLineParse from '@kitmi/utils/csvLineParse';
import arrayToCsv from '@kitmi/utils/arrayToCsv';
import { padLeft } from '@kitmi/utils/padding';
import batchAsync_ from '@kitmi/utils/batchAsync_';

class T_ARRAY {
    name = 'array';
    alias = ['list'];
    primitive = true;
    defaultValue = [];

    constructor(system) {
        this.system = system;
    }

    validate(value) {
        return Array.isArray(value);
    }

    _sanitize(value, meta, opts) {
        if (typeof value === 'string') {
            if (meta.csv) {
                value = csvLineParse(value, { delimiter: meta.delimiter || ',' });
            } else {
                const trimmed = value.trim();
                if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                    value = JSON.parse(trimmed);
                }
            }
        }

        if (Array.isArray(value)) {
            if (meta.element) {
                const schema = typeof meta.element === 'function' ? meta.element() : meta.element;

                return value.map((a, i) => this.system.sanitize(a, schema, opts.i18n, padLeft(`[${i}]`, opts.path)));
            }

            return value;
        }

        throw new ValidationError('Invalid array value.', {
            value,
            meta,
            rawValue: opts.rawValue,
            i18n: opts.i18n,
            path: opts.path,
        });
    }

    async _sanitizeAsync(value, meta, opts) {
        if (typeof value === 'string') {
            if (meta.csv) {
                value = csvLineParse(value, { delimiter: meta.delimiter || ',' });
            } else {
                const trimmed = value.trim();
                if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                    value = JSON.parse(trimmed);
                }
            }
        }

        if (Array.isArray(value)) {
            if (meta.element) {
                const schema = typeof meta.element === 'function' ? meta.element() : meta.element;

                return batchAsync_(value, (a, i) => this.system.sanitize_(a, schema, opts.i18n, padLeft(`[${i}]`, opts.path)));
            }

            return value;
        }

        throw new ValidationError('Invalid array value.', {
            value,
            meta,
            rawValue: opts.rawValue,
            i18n: opts.i18n,
            path: opts.path,
        });
    }

    serialize(value, typeInfo) {
        return value == null
            ? null
            : typeInfo?.csv
            ? arrayToCsv(value, typeInfo?.delimiter, this.system.getStringifier())
            : this.system.safeJsonStringify(value);
    }
}

export default T_ARRAY;
