/**
 * Ensure a string ends with *ending*
 * @function string.ensureEndsWith
 * @param {String} str
 * @param {String} ending
 * @returns {String}
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
const ensureEndsWith = (str, ending)=>str ? str.endsWith(ending) ? str : str + ending : ending;
const _default = ensureEndsWith;

//# sourceMappingURL=ensureEndsWith.js.map