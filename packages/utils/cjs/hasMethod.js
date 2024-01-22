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
function hasMethod(obj, name) {
    const desc = Object.getOwnPropertyDescriptor(obj, name);
    let has = !!desc && typeof desc.value === 'function';
    if (has) return true;
    let proto = Object.getPrototypeOf(obj);
    if (proto === Object.prototype) return has;
    return hasMethod(proto, name);
}
const _default = hasMethod;

//# sourceMappingURL=hasMethod.js.map