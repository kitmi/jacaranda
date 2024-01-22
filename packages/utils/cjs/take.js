/**
 * Creates a new object with n k-v pairs taken from the beginning.
 * @alias object.take
 * @param {Object} object
 * @param {integer} [n=1] - The number of k-v pair to take.
 * @returns {Object}
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
function take(object, n) {
    n == null && (n = 1);
    let result = {}, i = 0;
    for(let k in object){
        if (i++ < n) {
            result[k] = object[k];
        } else {
            break;
        }
    }
    return result;
}
const _default = take;

//# sourceMappingURL=take.js.map