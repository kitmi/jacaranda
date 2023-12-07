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
const _replaceAll = /*#__PURE__*/ _interop_require_default(require("./replaceAll"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
/**
 * Quote a string.
 * @function string.quote
 * @param {String} str
 * @param {String} [quoteChar=']
 * @returns {String}
 */ function quote(str, quoteChar = '"') {
    return quoteChar + (0, _replaceAll.default)(str, quoteChar, '\\' + quoteChar) + quoteChar;
}
const _default = quote;

//# sourceMappingURL=quote.js.map