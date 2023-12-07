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
class T_BIGINT {
    validate(value) {
        return typeof value === 'bigint';
    }
    _sanitize(value, meta, opts) {
        try {
            value = BigInt(value);
        } catch (e) {
            throw new _errors.ValidationError('Invalid bigint value.', {
                value,
                meta,
                rawValue: opts.rawValue,
                i18n: opts.i18n,
                path: opts.path,
                error: e.message
            });
        }
        return value;
    }
    serialize(value) {
        return value == null ? null : this.system.plugins.bigintWriter ? this.system.plugins.bigintWriter(value) : value.toString();
    }
    constructor(system){
        _define_property(this, "name", 'bigint');
        _define_property(this, "alias", [
            'biginteger'
        ]);
        _define_property(this, "primitive", true);
        _define_property(this, "scalar", true);
        _define_property(this, "defaultValue", 0n);
        this.system = system;
    }
}
const _default = T_BIGINT;

//# sourceMappingURL=bigint.js.map