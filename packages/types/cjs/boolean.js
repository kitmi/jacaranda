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
const _toBoolean = /*#__PURE__*/ _interop_require_default(require("@kitmi/utils/toBoolean"));
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
class T_BOOLEAN {
    validate(value) {
        return typeof value === 'boolean';
    }
    _sanitize(value, meta, opts) {
        try {
            return (0, _toBoolean.default)(value);
        } catch (e) {
            throw new _errors.ValidationError('Invalid boolean value.', {
                value,
                meta,
                rawValue: opts.rawValue,
                i18n: opts.i18n,
                path: opts.path,
                error: e.message
            });
        }
    }
    constructor(system){
        _define_property(this, "name", 'boolean');
        _define_property(this, "alias", [
            'bool'
        ]);
        _define_property(this, "primitive", true);
        _define_property(this, "defaultValue", false);
        _define_property(this, "serialize", _functions.identity);
        this.system = system;
    }
}
const _default = T_BOOLEAN;

//# sourceMappingURL=boolean.js.map