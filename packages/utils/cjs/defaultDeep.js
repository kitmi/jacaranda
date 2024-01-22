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
const _filterNull = /*#__PURE__*/ _interop_require_default(require("./filterNull"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
/**
 * Fallback to default value according to the sequence of sources, if the value of a key in all sources is null or undefined.
 * @param {object} obj - immutable object.
 * @param  {...object} sources
 * @returns {object} Merged object.
 */ function defaultDeep(obj, ...sources) {
    return [
        ...sources.reverse(),
        obj
    ].reduce((merged, newSource)=>({
            ...merged,
            ...(0, _filterNull.default)(newSource)
        }), {});
}
const _default = defaultDeep;

//# sourceMappingURL=defaultDeep.js.map