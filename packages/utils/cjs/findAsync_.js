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
const _findKeyAsync_ = /*#__PURE__*/ _interop_require_default(require("./findKeyAsync_"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
/**
 * Iterate a collection asynchronously until predicate returns true
 * The returned value is undefined if not found.
 * That's different from the _.find() function in lodash.
 * @alias collection.findAsync_
 * @async
 * @param {Array|Object} obj
 * @param {asyncIterator} asyncPredicate_
 * @returns {Promise.<Object|undefined>}
 */ async function findAsync_(obj, asyncPredicate_) {
    const k = await (0, _findKeyAsync_.default)(obj, asyncPredicate_);
    return obj[k];
}
const _default = findAsync_;

//# sourceMappingURL=findAsync_.js.map