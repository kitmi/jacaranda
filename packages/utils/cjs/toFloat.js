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
const _isFinite = /*#__PURE__*/ _interop_require_default(require("lodash/isFinite"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function toFloat(value) {
    return (0, _isFinite.default)(value) ? value : parseFloat(value);
}
const _default = toFloat;

//# sourceMappingURL=toFloat.js.map