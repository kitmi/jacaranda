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
 * Walk through each entry of an array of an object parallelly, faster than eachAsync_
 * @alias collection.batchAsync_
 * @async
 * @param {Array|Object} obj
 * @param {asyncIterator} iterator
 * @returns {Promise.<Array|Object>}
 */ async function batchAsync_(obj, iterator) {
    if (Array.isArray(obj)) {
        const r = [];
        let l = obj.length;
        for(let i = 0; i < l; i++){
            r.push(iterator(obj[i], i, obj));
        }
        return Promise.all(r);
    }
    if ((0, _isPlainObject.default)(obj)) {
        const keys = [];
        const values = [];
        for(let k in obj){
            if (Object.prototype.hasOwnProperty.call(obj, k)) {
                keys.push(k);
                values.push(iterator(obj[k], k, obj));
            }
        }
        const result = await Promise.all(values);
        return keys.reduce((r, k, i)=>{
            r[k] = result[i];
            return r;
        }, {});
    }
    return Promise.reject('Invalid argument!');
}
const _default = batchAsync_;

//# sourceMappingURL=batchAsync_.js.map