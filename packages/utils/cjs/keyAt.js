/**
 * Returns the key at the specified index of an object.
 * @param {Object} object
 * @param {integer} index
 * @returns {String|*}
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
function keyAt(object, index) {
    return object == null ? undefined : Object.keys(object)[index ?? 0];
}
const _default = keyAt;

//# sourceMappingURL=keyAt.js.map