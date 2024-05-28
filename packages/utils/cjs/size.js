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
const _isTypedArray = /*#__PURE__*/ _interop_require_default(require("./isTypedArray"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
/**
 * Get the size of a collection.
 * Note: lodash's size does not check symbol properties and will return unicode length for strings.
 * @param {*} collection 
 * @returns {number}
 */ function size(collection) {
    if (collection == null) {
        return 0;
    }
    const type = typeof collection;
    if (type === 'string') return collection.length;
    if (type === 'object') {
        if (Array.isArray(collection) || Buffer.isBuffer(collection) || (0, _isTypedArray.default)(collection) || collection.toString() === '[object Arguments]') {
            return collection.length;
        }
        if (collection instanceof Map || collection instanceof Set) {
            return collection.size;
        }
        if (collection instanceof DataView) {
            return collection.byteLength;
        }
        return Object.keys(collection).length + Object.getOwnPropertySymbols(collection).length;
    }
    return 0;
}
const _default = size;

//# sourceMappingURL=size.js.map