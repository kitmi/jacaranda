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
const _toInteger = /*#__PURE__*/ _interop_require_default(require("@kitmi/utils/toInteger"));
const _functions = require("./functions");
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
class T_INTEGER {
    validate(value) {
        return typeof value === 'number' && Number.isInteger(value);
    }
    _sanitize(value, meta, opts) {
        value = (0, _toInteger.default)(value);
        if (isNaN(value)) {
            throw new _errors.ValidationError('Invalid integer value.', {
                value: null,
                meta,
                rawValue: opts.rawValue,
                i18n: opts.i18n,
                path: opts.path
            });
        }
        return value;
    }
    constructor(system){
        _define_property(this, "name", 'integer');
        _define_property(this, "alias", [
            'int'
        ]);
        _define_property(this, "primitive", true);
        _define_property(this, "scalar", true);
        _define_property(this, "defaultValue", 0);
        _define_property(this, "serialize", _functions.identity);
        this.system = system;
    }
}
const _default = T_INTEGER;

//# sourceMappingURL=integer.js.map