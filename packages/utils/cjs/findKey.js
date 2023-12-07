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
const _isPlainObject = /*#__PURE__*/ _interop_require_default(require("./isPlainObject"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
/**
 * Iterate a collection until predicate returns true
 * The returned value is undefined if not found.
 * That's different from the _.find() function in lodash.
 * @alias collection.findKey
 * @param {Array|Object} obj
 * @param {iterator} predicate
 * @returns {Promise.<Object|undefined>}
 */ function findKey(obj, predicate) {
    if (Array.isArray(obj)) {
        let l = obj.length;
        for(let i = 0; i < l; i++){
            const el = obj[i];
            if (predicate(el, i, obj)) {
                return i;
            }
        }
        return undefined;
    } else if ((0, _isPlainObject.default)(obj)) {
        for(let k in obj){
            if (Object.prototype.hasOwnProperty.call(obj, k)) {
                const el = obj[k];
                if (predicate(el, k, obj)) {
                    return k;
                }
            }
        }
        return undefined;
    }
    throw new Error('The first argument should be a collection.');
}
const _default = findKey;

//# sourceMappingURL=findKey.js.map