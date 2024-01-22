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
function toBoolean(any) {
    const type = typeof any;
    if (type === 'boolean') {
        return any;
    }
    if (type === 'number') {
        return any === 1;
    }
    return type === 'string' && (any === '1' || /^true$/i.test(any));
}
const _default = toBoolean;

//# sourceMappingURL=toBoolean.js.map