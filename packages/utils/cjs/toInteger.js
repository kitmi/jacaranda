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
const _isInteger = /*#__PURE__*/ _interop_require_default(require("lodash/isInteger"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function toInteger(value) {
    if ((0, _isInteger.default)(value)) return value;
    return parseInt(value);
}
const _default = toInteger;

//# sourceMappingURL=toInteger.js.map