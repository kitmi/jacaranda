/**
 * Check a string if it is quoted with " or '
 * @function string.isQuoted
 * @param {String} s
 * @returns {boolean}
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return _default;
    }
});
const isQuoted = (s)=>s && (s.startsWith("'") || s.startsWith('"')) && s[0] === s[s.length - 1];
const _default = isQuoted;

//# sourceMappingURL=isQuoted.js.map