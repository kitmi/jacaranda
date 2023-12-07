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
const _functions = require("./functions");
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
class T_TEXT {
    validate(value) {
        return typeof value === 'string';
    }
    _sanitize(value, meta, opts) {
        const type = typeof value;
        const isString = type === 'string';
        if (isString) {
            if (meta.trim) {
                value = value.trim();
            }
            if (value === '' && meta.nonEmpty) {
                value = null;
                if (!meta.optional) {
                    throw new _errors.ValidationError('Missing a required value.', {
                        value,
                        meta,
                        rawValue: opts.rawValue,
                        i18n: opts.i18n,
                        path: opts.path
                    });
                }
            }
        } else {
            if (type === 'bigint' || type === 'number') {
                return value.toString();
            }
            throw new _errors.ValidationError('Invalid text value.', {
                value,
                meta,
                rawValue: opts.rawValue,
                i18n: opts.i18n,
                path: opts.path
            });
        }
        return value;
    }
    constructor(system){
        _define_property(this, "name", 'text');
        _define_property(this, "alias", [
            'string'
        ]);
        _define_property(this, "primitive", true);
        _define_property(this, "scalar", true);
        _define_property(this, "defaultValue", '');
        _define_property(this, "serialize", _functions.identity);
        this.system = system;
    }
}
const _default = T_TEXT;

//# sourceMappingURL=text.js.map