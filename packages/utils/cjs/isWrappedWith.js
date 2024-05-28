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
const isWrappedWith = (s, q1, q2)=>{
    q2 = q2 || q1;
    return s && q1 && s.length > q1.length && s.startsWith(q1) && s.endsWith(q2);
};
const _default = isWrappedWith;

//# sourceMappingURL=isWrappedWith.js.map