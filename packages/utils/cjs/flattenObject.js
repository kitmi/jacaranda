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
const _each = /*#__PURE__*/ _interop_require_default(require("lodash/each"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
/**
 * Convert a hierachy object into a flat object with the key path sperarated by a given string, default as ".".
 * @param {*} object
 * @param {*} keyPathSep
 * @returns {object}
 */ const flattenObject = (object, keyPathSep = '.')=>{
    const result = {};
    (0, _each.default)(object, (v, k)=>{
        k = k.toString();
        if (v != null && typeof v === 'object') {
            v = flattenObject(v, keyPathSep);
            (0, _each.default)(v, (v2, k2)=>{
                k2 = k2.toString();
                result[k + keyPathSep + k2] = v2;
            });
        } else {
            result[k] = v;
        }
    });
    return result;
};
const _default = flattenObject;

//# sourceMappingURL=flattenObject.js.map