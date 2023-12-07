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
const _isPlainObject = /*#__PURE__*/ _interop_require_default(require("./isPlainObject"));
const _set = /*#__PURE__*/ _interop_require_default(require("./set"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const unflattenObject = (object, keyPathSep = '.')=>{
    if (!(0, _isPlainObject.default)(object)) {
        throw new Error('The argument is not an object.');
    }
    const options = {
        numberAsArrayIndex: true,
        keyPathSeparator: keyPathSep
    };
    const result = {};
    (0, _each.default)(object, (v, k)=>{
        (0, _set.default)(result, k, v, options);
    });
    return result;
};
const _default = unflattenObject;

//# sourceMappingURL=unflattenObject.js.map