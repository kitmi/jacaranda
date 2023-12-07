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
const _errors = require("./errors");
const _csvLineParse = /*#__PURE__*/ _interop_require_default(require("@kitmi/utils/csvLineParse"));
const _arrayToCsv = /*#__PURE__*/ _interop_require_default(require("@kitmi/utils/arrayToCsv"));
const _padding = require("@kitmi/utils/padding");
const _batchAsync_ = /*#__PURE__*/ _interop_require_default(require("@kitmi/utils/batchAsync_"));
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
class T_ARRAY {
    validate(value) {
        return Array.isArray(value);
    }
    _sanitize(value, meta, opts) {
        if (typeof value === 'string') {
            if (meta.csv) {
                value = (0, _csvLineParse.default)(value, {
                    delimiter: meta.delimiter || ','
                });
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
                return value.map((a, i)=>this.system.sanitize(a, schema, opts.i18n, (0, _padding.padLeft)(`[${i}]`, opts.path)));
            }
            return value;
        }
        throw new _errors.ValidationError('Invalid array value.', {
            value,
            meta,
            rawValue: opts.rawValue,
            i18n: opts.i18n,
            path: opts.path
        });
    }
    async _sanitizeAsync(value, meta, opts) {
        if (typeof value === 'string') {
            if (meta.csv) {
                value = (0, _csvLineParse.default)(value, {
                    delimiter: meta.delimiter || ','
                });
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
                return (0, _batchAsync_.default)(value, (a, i)=>this.system.sanitize_(a, schema, opts.i18n, (0, _padding.padLeft)(`[${i}]`, opts.path)));
            }
            return value;
        }
        throw new _errors.ValidationError('Invalid array value.', {
            value,
            meta,
            rawValue: opts.rawValue,
            i18n: opts.i18n,
            path: opts.path
        });
    }
    serialize(value, typeInfo) {
        return value == null ? null : typeInfo?.csv ? (0, _arrayToCsv.default)(value, typeInfo?.delimiter, this.system.getStringifier()) : this.system.safeJsonStringify(value);
    }
    constructor(system){
        _define_property(this, "name", 'array');
        _define_property(this, "alias", [
            'list'
        ]);
        _define_property(this, "primitive", true);
        _define_property(this, "defaultValue", []);
        this.system = system;
    }
}
const _default = T_ARRAY;

//# sourceMappingURL=array.js.map