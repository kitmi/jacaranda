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
 * Check whether a value is empty, or an object is empty. 
 * Note: lodash's isEmpty does not check symbol properties.
 *  const key = Symbol('key');
 *  const obj = {
 *      [key]: 'something'
 *  };
 *  _.isEmpty(obj).should.be.true;
 *  isEmpty(obj).should.be.false;
 * 
 * @param {*} value 
 * @returns {boolean}
 */ function isEmpty(value) {
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