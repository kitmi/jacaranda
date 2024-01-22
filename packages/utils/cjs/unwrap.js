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
const pairs = {
    '(': ')',
    '[': ']',
    '{': '}',
    '<': '>'
};
/**
 * Unwrap a string
 * @function string.unwrap
 * @param {String} str
 * @param {String} [startToken] - Start token, default "
 * @param {String} [endToken] - End token, default "
 * @returns {String}
 */ function unwrap(str, startToken, endToken) {
    if (typeof str !== 'string') {
        return str;
    }
    if (str.length < 2) {
        return str;
    }
    if (startToken == null && endToken == null) {
        let start = str[0];
        let end = str[str.length - 1];
        const endToken2 = pairs[start];
        if (endToken2 == null || end !== endToken2) {
            return str;
        }
        return str.slice(1, -1);
    }
    if (endToken == null) {
        endToken = startToken;
    }
    if (str.startsWith(startToken) && str.endsWith(endToken)) {
        return str.slice(startToken.length, -endToken.length);
    }
    return str;
}
const _default = unwrap;

//# sourceMappingURL=unwrap.js.map