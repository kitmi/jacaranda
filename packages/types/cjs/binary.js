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
class T_BINARY {
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
        throw new _errors.ValidationError('Invalid binary value.', {
            value,
            meta,
            rawValue: opts.rawValue,
            i18n: opts.i18n,
            path: opts.path
        });
    }
    serialize(value, meta) {
        return value == null ? null : value.toString(meta.encoding || 'base64');
    }
    constructor(system){
        _define_property(this, "name", 'binary');
        _define_property(this, "alias", [
            'blob',
            'buffer'
        ]);
        _define_property(this, "primitive", true);
        _define_property(this, "defaultValue", null);
        this.system = system;
    }
}
const _default = T_BINARY;

//# sourceMappingURL=binary.js.map