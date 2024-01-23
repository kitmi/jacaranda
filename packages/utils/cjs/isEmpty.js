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
function isEmpty(value) {
    if (value == null) {
        return true;
    }
    const type = typeof value;
    if (type === 'string') return value.length === 0;
    if (type === 'object') {
        if (Array.isArray(value) || Buffer.isBuffer(value) || (0, _isTypedArray.default)(value) || value.toString() === '[object Arguments]') {
            return value.length === 0;
        }
        if (value instanceof Map || value instanceof Set) {
            return value.size === 0;
        }
        return Object.keys(value).length === 0 && Object.getOwnPropertySymbols(value).length === 0;
    }
    return false;
}
const _default = isEmpty;

//# sourceMappingURL=isEmpty.js.map