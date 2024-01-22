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
function isPromise(p) {
    if (typeof p === 'object' && typeof p.then === 'function') {
        return true;
    }
    return false;
}
const _default = isPromise;

//# sourceMappingURL=isPromise.js.map