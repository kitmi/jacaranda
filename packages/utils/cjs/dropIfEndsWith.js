/**
 * Drop a right part of a string if it ends with *ending*
 * @function string.dropIfEndsWith
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
const dropIfEndsWith = (str, ending)=>str && str.endsWith(ending) ? str.substring(0, str.length - ending.length) : str;
const _default = dropIfEndsWith;

//# sourceMappingURL=dropIfEndsWith.js.map