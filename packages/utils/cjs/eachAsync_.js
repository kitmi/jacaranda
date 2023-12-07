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
 * Iterate an array of an object asynchronously
 * @alias collection.eachAsync_
 * @async
 * @param {Array|Object} obj
 * @param {asyncIterator} iterator
 * @returns {Promise.<Array|Object>}
 */ async function eachAsync_(obj, iterator) {
    if (Array.isArray(obj)) {
        let r = [];
        let l = obj.length;
        for(let i = 0; i < l; i++){
            r.push(await iterator(obj[i], i, obj));
        }
        return r;
    }
    if ((0, _isPlainObject.default)(obj)) {
        let r = {};
        for(let k in obj){
            if (Object.prototype.hasOwnProperty.call(obj, k)) {
                r[k] = await iterator(obj[k], k, obj);
            }
        }
        return r;
    }
    return Promise.reject('Invalid argument!');
}
const _default = eachAsync_;

//# sourceMappingURL=eachAsync_.js.map