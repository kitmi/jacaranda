/**
 * Drop a left part of a string if it starts with *starting*
 * @function srting.dropIfStartsWith
 * @param {String} str
 * @param {String} starting
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
const dropIfStartsWith = (str, starting)=>str && str.startsWith(starting) ? str.substring(starting.length) : str;
const _default = dropIfStartsWith;

//# sourceMappingURL=dropIfStartsWith.js.map