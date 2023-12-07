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
class T_ANY {
    serialize(value) {
        return typeof value === 'object' ? JSON.stringify(value) : value;
    }
    constructor(system){
        _define_property(this, "name", 'any');
        _define_property(this, "alias", [
            '*'
        ]);
        _define_property(this, "defaultValue", null);
        _define_property(this, "validate", _functions.everTrue);
        _define_property(this, "_sanitize", _functions.identity);
        this.system = system;
    }
}
const _default = T_ANY;

//# sourceMappingURL=any.js.map