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
 * Returns the value at the specified index of an array|object|string.
 * @param {*} object
 * @param {integer} index
 * @returns {*}
 */ function valueAt(object, index) {
    if (object == null) {
        return undefined;
    }
    index ??= 0;
    if ((0, _isPlainObject.default)(object)) {
        object = Object.values(object);
    }
    if (index < 0) {
        index = object.length + index;
    }
    return object[index];
}
const _default = valueAt;

//# sourceMappingURL=valueAt.js.map