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
 * Iterates over elements of collection asynchronously, returning an array of all elements predicate returns truthy for.
 * The predicate is invoked asynchronously with three arguments: (value, index|key, collection).
 * @alias collection.filterAsync_
 * @async
 * @param {Array|Object} obj
 * @param {asyncIterator} asyncPredicate
 * @returns {Promise.<Object|undefined>}
 */ async function filterAsync_(obj, asyncPredicate) {
    if (Array.isArray(obj)) {
        let r = [];
        let l = obj.length;
        for(let i = 0; i < l; i++){
            const el = obj[i];
            if (await asyncPredicate(el, i, obj)) {
                r.push(el);
            }
        }
        return r;
    } else if ((0, _isPlainObject.default)(obj)) {
        let r = {};
        for(let k in obj){
            if (Object.prototype.hasOwnProperty.call(obj, k)) {
                const el = obj[k];
                if (await asyncPredicate(el, k, obj)) {
                    r[k] = el;
                }
            }
        }
        return r;
    } else {
        return Promise.reject('Invalid argument!');
    }
}
const _default = filterAsync_;

//# sourceMappingURL=filterAsync_.js.map