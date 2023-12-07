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
 * Iterate a collection asynchronously until predicate returns true
 * The returned value is undefined if not found.
 * That's different from the _.find() function in lodash.
 * @alias collection.findKeyAsync_
 * @async
 * @param {Array|Object} obj
 * @param {asyncIterator} asyncPredicate_
 * @returns {Promise.<Object|undefined>}
 */ async function findKeyAsync_(obj, asyncPredicate_) {
    if (Array.isArray(obj)) {
        let l = obj.length;
        for(let i = 0; i < l; i++){
            const el = obj[i];
            if (await asyncPredicate_(el, i, obj)) {
                return i;
            }
        }
        return undefined;
    } else if ((0, _isPlainObject.default)(obj)) {
        for(let k in obj){
            if (Object.prototype.hasOwnProperty.call(obj, k)) {
                const el = obj[k];
                if (await asyncPredicate_(el, k, obj)) {
                    return k;
                }
            }
        }
        return undefined;
    }
    return Promise.reject('The first argument should be a collection.');
}
const _default = findKeyAsync_;

//# sourceMappingURL=findKeyAsync_.js.map