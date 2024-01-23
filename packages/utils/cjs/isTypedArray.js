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
function isTypedArray(obj) {
    return typeof obj === 'object' && Object.getPrototypeOf(obj.constructor).name === 'TypedArray';
}
const _default = isTypedArray;

//# sourceMappingURL=isTypedArray.js.map