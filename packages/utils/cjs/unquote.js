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
 * Unquote a string
 * @function string.unquote
 * @param {String} str
 * @param {boolean} [unescape=false] - True to unescape slashed quote, default false
 * @param {Set|Array} [quoteSet] - Set of chars
 * @returns {String}
 */ function unquote(str, unescape, quoteSet) {
    if (typeof str !== 'string') {
        return str;
    }
    if (str.length < 2) {
        return str;
    }
    let start = str[0];
    if (start !== str[str.length - 1]) {
        return str;
    }
    if (quoteSet) {
        if (Array.isArray(quoteSet)) {
            quoteSet = new Set(quoteSet);
        }
        if (!quoteSet.has(start)) {
            return str;
        }
    }
    str = str.slice(1, -1);
    if (unescape) {
        return (0, _replaceAll.default)(str, '\\' + start, start);
    }
    return str;
}
const _default = unquote;

//# sourceMappingURL=unquote.js.map