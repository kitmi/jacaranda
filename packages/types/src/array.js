import { ValidationError } from './errors';

import csvLineParse from '@galaxar/utils/csvLineParse';
import arrayToCsv from '@galaxar/utils/arrayToCsv';
import { padLeft } from '@galaxar/utils/padding';
import batchAsync_ from '@galaxar/utils/batchAsync_';

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
            if (meta.elementSchema) {
                const schema = typeof meta.elementSchema === 'function' ? meta.elementSchema() : meta.elementSchema;

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
            if (meta.elementSchema) {
                const schema = typeof meta.elementSchema === 'function' ? meta.elementSchema() : meta.elementSchema;

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
