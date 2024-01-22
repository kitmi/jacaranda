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
const _get = /*#__PURE__*/ _interop_require_default(require("./get"));
const _set = /*#__PURE__*/ _interop_require_default(require("./set"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
/**
 * Push an value into an array element of a collection
 * @alias object.pushIntoBucket
 * @param {Object} collection
 * @param {string} key
 * @param {Object} value
 * @param {boolean} [flattenArray=false] - Whether to flatten the array, if the given value is an array.
 * @returns {*} The modified bucket
 */ function pushIntoBucket(collection, key, value, flattenArray) {
    let bucket = (0, _get.default)(collection, key);
    if (Array.isArray(bucket)) {
        if (Array.isArray(value) && flattenArray) {
            bucket = bucket.concat(value);
            (0, _set.default)(collection, key, bucket);
        } else {
            bucket.push(value);
        }
    } else if (bucket == null) {
        bucket = Array.isArray(value) && flattenArray ? value.concat() : [
            value
        ];
        (0, _set.default)(collection, key, bucket);
    } else {
        bucket = Array.isArray(value) && flattenArray ? [
            bucket,
            ...value
        ] : [
            bucket,
            value
        ];
        (0, _set.default)(collection, key, bucket);
    }
    return bucket;
}
const _default = pushIntoBucket;

//# sourceMappingURL=pushIntoBucket.js.map