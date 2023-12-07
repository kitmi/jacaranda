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
class T_DATETIME {
    validate(value) {
        return value instanceof Date;
    }
    /**
     * Transform a value into a JavaScript Date object.
     * @param {*} value
     * @param {*} meta
     * @param {*} i18n
     * @param {string} [path]
     * @returns {Date|null}
     */ _sanitize(value, meta, opts) {
        if (value instanceof Date) {
            return value;
        } else {
            const type = typeof value;
            if (type === 'string') {
                if (meta.format) {
                    const parser = this.system.plugins.datetimeParser;
                    if (!parser) {
                        throw new _errors.ApplicationError('Missing datetime parser plugin.');
                    }
                    value = parser(value, {
                        format: meta.format,
                        timezone: opts.i18n?.timezone
                    });
                } else {
                    value = new Date(value);
                }
            } else if (type === 'number') {
                value = new Date(value);
            } else if (value.toJSDate) {
                value = value.toJSDate();
            }
            if (isNaN(value)) {
                throw new _errors.ValidationError('Invalid datetime value.', {
                    value: null,
                    meta,
                    rawValue: opts.rawValue,
                    i18n: opts.i18n,
                    path: opts.path
                });
            }
        }
        return value;
    }
    serialize(value) {
        return value?.toISOString();
    }
    constructor(system){
        _define_property(this, "name", 'datetime');
        _define_property(this, "alias", [
            'date',
            'time',
            'timestamp'
        ]);
        _define_property(this, "primitive", true);
        _define_property(this, "scalar", true);
        _define_property(this, "defaultValue", new Date(0));
        this.system = system;
    }
}
const _default = T_DATETIME;

//# sourceMappingURL=datetime.js.map