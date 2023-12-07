import _each from 'lodash/each';
import _every from 'lodash/every';
import _mapValues from 'lodash/mapValues';
import { ValidationError } from './errors';
import { makePath } from '@kit/utils/objectPathUtils';
import isPlainObject from '@kit/utils/isPlainObject';
import batchAsync_ from '@kit/utils/batchAsync_';
import findAsync_ from '@kit/utils/findAsync_';

const jsonStarter = new Set(['"', '[', '{']);
const jsonEnding = {
    '"': '"',
    '[': ']',
    '{': '}',
};

class T_OBJECT {
    name = 'object';
    alias = ['json'];
    primitive = true;
    defaultValue = {};

    _sanitizeMember = (value, opts, newValue) => (validationObject, fieldName) => {
        const fieldValue = value[fieldName];
        const fieldPath = makePath(opts.path, fieldName);

        let _fieldValue;

        if (Array.isArray(validationObject)) {
            const errors = [];
            const foudMatched = validationObject.find((_validationObject) => {
                try {
                    _fieldValue = this.system.sanitize(fieldValue, _validationObject, opts.i18n, fieldPath);
                    return true;
                } catch (error) {
                    errors.push(ValidationError.extractFromError(error));
                    return false;
                }
            });

            if (foudMatched == null) {
                throw new ValidationError('Object member schema validation failed.', {
                    value: fieldValue,
                    meta: validationObject,
                    rawValue: opts.rawValue,
                    i18n: opts.i18n,
                    path: fieldPath,
                    errors,
                });
            }
        } else {
            _fieldValue = this.system.sanitize(fieldValue, validationObject, opts.i18n, fieldPath);
        }

        if (_fieldValue != null || fieldName in value) {
            newValue[fieldName] = _fieldValue;
        }
    };

    _sanitizeMember_ = (value, opts, newValue) => async (validationObject, fieldName) => {
        const fieldValue = value[fieldName];
        const fieldPath = makePath(opts.path, fieldName);

        let _fieldValue;

        if (Array.isArray(validationObject)) {
            const errors = [];
            const foudMatched = await findAsync_(validationObject, async (_validationObject) => {
                try {
                    _fieldValue = await this.system.sanitize_(fieldValue, _validationObject, opts.i18n, fieldPath);
                    return true;
                } catch (error) {
                    errors.push(ValidationError.extractFromError(error));
                    return false;
                }
            });

            if (foudMatched == null) {
                throw new ValidationError('Object member schema validation failed.', {
                    value: fieldValue,
                    meta: validationObject,
                    rawValue: opts.rawValue,
                    i18n: opts.i18n,
                    path: fieldPath,
                    errors,
                });
            }
        } else {
            _fieldValue = await this.system.sanitize_(fieldValue, validationObject, opts.i18n, fieldPath);
        }

        if (_fieldValue != null || fieldName in value) {
            newValue[fieldName] = _fieldValue;
        }
    };

    constructor(system) {
        this.system = system;
    }

    validate(value) {
        return isPlainObject(value);
    }

    _sanitize(value, meta, opts) {
        const type = typeof value;

        if (type === 'string') {
            if (value.length > 1 && jsonStarter.has(value[0]) && jsonEnding[value[0]] === value[value.length - 1]) {
                value = JSON.parse(value);
            }
        }

        if (meta.schema) {
            if (typeof value !== 'object') {
                throw new ValidationError('Invalid object value.', {
                    value,
                    meta,
                    rawValue: opts.rawValue,
                    i18n: opts.i18n,
                    path: opts.path,
                });
            }

            let schema = typeof meta.schema === 'function' ? meta.schema() : meta.schema;
            let newValue;

            if (Array.isArray(schema)) {
                const errors = [];
                const pass = schema.find((altSchema) => {
                    newValue = {};
                    try {
                        _each(altSchema, this._sanitizeMember(value, opts, newValue));
                        return true;
                    } catch (error) {
                        errors.push(ValidationError.extractFromError(error));
                        return false;
                    }
                });

                if (pass == null) {
                    throw new ValidationError('Object schema validation failed.', {
                        value,
                        meta,
                        rawValue: opts.rawValue,
                        i18n: opts.i18n,
                        path: opts.path,
                        errors,
                    });
                }
            } else {
                newValue = {};
                _each(schema, this._sanitizeMember(value, opts, newValue));
            }

            if (meta.keepUnsanitized) {
                return { ...value, ...newValue };
            }

            return newValue;
        }

        const { valueSchema, ..._meta } = meta;
        if (valueSchema) {
            const schema = _mapValues(value, () => valueSchema);            
            return this._sanitize(value, { schema, ..._meta }, opts);
        }

        return value;
    }

    async _sanitizeAsync(value, meta, opts) {
        const type = typeof value;

        if (type === 'string') {
            if (value.length > 1 && jsonStarter.has(value[0]) && jsonEnding[value[0]] === value[value.length - 1]) {
                value = JSON.parse(value);
            }
        }

        if (meta.schema) {
            if (typeof value !== 'object') {
                throw new ValidationError('Invalid object value.', {
                    value,
                    meta,
                    rawValue: opts.rawValue,
                    i18n: opts.i18n,
                    path: opts.path,
                });
            }

            const schema = typeof meta.schema === 'function' ? meta.schema() : meta.schema;
            let newValue;

            if (Array.isArray(schema)) {
                const errors = [];
                const pass = await findAsync_(schema, async (altSchema) => {
                    newValue = {};
                    try {
                        await batchAsync_(altSchema, this._sanitizeMember_(value, opts, newValue));
                        return true;
                    } catch (error) {
                        errors.push(ValidationError.extractFromError(error));
                        return false;
                    }
                });

                if (pass == null) {
                    throw new ValidationError('Object schema validation failed.', {
                        value,
                        meta,
                        rawValue: opts.rawValue,
                        i18n: opts.i18n,
                        path: opts.path,
                        errors,
                    });
                }
            } else {
                newValue = {};
                await batchAsync_(schema, this._sanitizeMember_(value, opts, newValue));
            }

            if (meta.keepUnsanitized) {
                return { ...value, ...newValue };
            }

            return newValue;
        }

        const { valueSchema, ..._meta } = meta;
        if (valueSchema) {
            const schema = _mapValues(value, () => valueSchema);
            return this._sanitizeAsync(value, { schema, ..._meta }, opts);
        }

        return value;
    }

    serialize(value) {
        if (value == null) return null;
        return this.system.safeJsonStringify(value);
    }
}

export default T_OBJECT;
