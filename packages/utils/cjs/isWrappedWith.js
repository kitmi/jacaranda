/**
 * Check a string if it is started and ended with a given sub-string
 * @function string.isWrappedWith
 * @param {String} s - String to check
 * @param {String} q - Sub-srting
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
const isWrappedWith = (s, q)=>s && q && s.length > q.length && s.startsWith(q) && s.endsWith(q);
const _default = isWrappedWith;

//# sourceMappingURL=isWrappedWith.js.map