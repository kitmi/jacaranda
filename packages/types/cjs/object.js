"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return _default;
    }
});
const _each = /*#__PURE__*/ _interop_require_default(require("lodash/each"));
const _every = /*#__PURE__*/ _interop_require_default(require("lodash/every"));
const _mapValues = /*#__PURE__*/ _interop_require_default(require("lodash/mapValues"));
const _errors = require("./errors");
const _objectPathUtils = require("@kit/utils/objectPathUtils");
const _isPlainObject = /*#__PURE__*/ _interop_require_default(require("@kit/utils/isPlainObject"));
const _batchAsync_ = /*#__PURE__*/ _interop_require_default(require("@kit/utils/batchAsync_"));
const _findAsync_ = /*#__PURE__*/ _interop_require_default(require("@kit/utils/findAsync_"));
function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const jsonStarter = new Set([
    '"',
    '[',
    '{'
]);
const jsonEnding = {
    '"': '"',
    '[': ']',
    '{': '}'
};
class T_OBJECT {
    validate(value) {
        return (0, _isPlainObject.default)(value);
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
                throw new _errors.ValidationError('Invalid object value.', {
                    value,
                    meta,
                    rawValue: opts.rawValue,
                    i18n: opts.i18n,
                    path: opts.path
                });
            }
            let schema = typeof meta.schema === 'function' ? meta.schema() : meta.schema;
            let newValue;
            if (Array.isArray(schema)) {
                const errors = [];
                const pass = schema.find((altSchema)=>{
                    newValue = {};
                    try {
                        (0, _each.default)(altSchema, this._sanitizeMember(value, opts, newValue));
                        return true;
                    } catch (error) {
                        errors.push(_errors.ValidationError.extractFromError(error));
                        return false;
                    }
                });
                if (pass == null) {
                    throw new _errors.ValidationError('Object schema validation failed.', {
                        value,
                        meta,
                        rawValue: opts.rawValue,
                        i18n: opts.i18n,
                        path: opts.path,
                        errors
                    });
                }
            } else {
                newValue = {};
                (0, _each.default)(schema, this._sanitizeMember(value, opts, newValue));
            }
            if (meta.keepUnsanitized) {
                return {
                    ...value,
                    ...newValue
                };
            }
            return newValue;
        }
        const { valueSchema, ..._meta } = meta;
        if (valueSchema) {
            const schema = (0, _mapValues.default)(value, ()=>valueSchema);
            return this._sanitize(value, {
                schema,
                ..._meta
            }, opts);
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
                throw new _errors.ValidationError('Invalid object value.', {
                    value,
                    meta,
                    rawValue: opts.rawValue,
                    i18n: opts.i18n,
                    path: opts.path
                });
            }
            const schema = typeof meta.schema === 'function' ? meta.schema() : meta.schema;
            let newValue;
            if (Array.isArray(schema)) {
                const errors = [];
                const pass = await (0, _findAsync_.default)(schema, async (altSchema)=>{
                    newValue = {};
                    try {
                        await (0, _batchAsync_.default)(altSchema, this._sanitizeMember_(value, opts, newValue));
                        return true;
                    } catch (error) {
                        errors.push(_errors.ValidationError.extractFromError(error));
                        return false;
                    }
                });
                if (pass == null) {
                    throw new _errors.ValidationError('Object schema validation failed.', {
                        value,
                        meta,
                        rawValue: opts.rawValue,
                        i18n: opts.i18n,
                        path: opts.path,
                        errors
                    });
                }
            } else {
                newValue = {};
                await (0, _batchAsync_.default)(schema, this._sanitizeMember_(value, opts, newValue));
            }
            if (meta.keepUnsanitized) {
                return {
                    ...value,
                    ...newValue
                };
            }
            return newValue;
        }
        const { valueSchema, ..._meta } = meta;
        if (valueSchema) {
            const schema = (0, _mapValues.default)(value, ()=>valueSchema);
            return this._sanitizeAsync(value, {
                schema,
                ..._meta
            }, opts);
        }
        return value;
    }
    serialize(value) {
        if (value == null) return null;
        return this.system.safeJsonStringify(value);
    }
    constructor(system){
        _define_property(this, "name", 'object');
        _define_property(this, "alias", [
            'json'
        ]);
        _define_property(this, "primitive", true);
        _define_property(this, "defaultValue", {});
        _define_property(this, "_sanitizeMember", (value, opts, newValue)=>(validationObject, fieldName)=>{
                const fieldValue = value[fieldName];
                const fieldPath = (0, _objectPathUtils.makePath)(opts.path, fieldName);
                let _fieldValue;
                if (Array.isArray(validationObject)) {
                    const errors = [];
                    const foudMatched = validationObject.find((_validationObject)=>{
                        try {
                            _fieldValue = this.system.sanitize(fieldValue, _validationObject, opts.i18n, fieldPath);
                            return true;
                        } catch (error) {
                            errors.push(_errors.ValidationError.extractFromError(error));
                            return false;
                        }
                    });
                    if (foudMatched == null) {
                        throw new _errors.ValidationError('Object member schema validation failed.', {
                            value: fieldValue,
                            meta: validationObject,
                            rawValue: opts.rawValue,
                            i18n: opts.i18n,
                            path: fieldPath,
                            errors
                        });
                    }
                } else {
                    _fieldValue = this.system.sanitize(fieldValue, validationObject, opts.i18n, fieldPath);
                }
                if (_fieldValue != null || fieldName in value) {
                    newValue[fieldName] = _fieldValue;
                }
            });
        _define_property(this, "_sanitizeMember_", (value, opts, newValue)=>async (validationObject, fieldName)=>{
                const fieldValue = value[fieldName];
                const fieldPath = (0, _objectPathUtils.makePath)(opts.path, fieldName);
                let _fieldValue;
                if (Array.isArray(validationObject)) {
                    const errors = [];
                    const foudMatched = await (0, _findAsync_.default)(validationObject, async (_validationObject)=>{
                        try {
                            _fieldValue = await this.system.sanitize_(fieldValue, _validationObject, opts.i18n, fieldPath);
                            return true;
                        } catch (error) {
                            errors.push(_errors.ValidationError.extractFromError(error));
                            return false;
                        }
                    });
                    if (foudMatched == null) {
                        throw new _errors.ValidationError('Object member schema validation failed.', {
                            value: fieldValue,
                            meta: validationObject,
                            rawValue: opts.rawValue,
                            i18n: opts.i18n,
                            path: fieldPath,
                            errors
                        });
                    }
                } else {
                    _fieldValue = await this.system.sanitize_(fieldValue, validationObject, opts.i18n, fieldPath);
                }
                if (_fieldValue != null || fieldName in value) {
                    newValue[fieldName] = _fieldValue;
                }
            });
        this.system = system;
    }
}
const _default = T_OBJECT;

//# sourceMappingURL=object.js.map