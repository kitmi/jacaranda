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
const _dropIfEndsWith = /*#__PURE__*/ _interop_require_default(require("./dropIfEndsWith"));
const _ensureStartsWith = /*#__PURE__*/ _interop_require_default(require("./ensureStartsWith"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
/**
 * Join base url and the extra url path.
 * @function string.urlJoin
 * @param {String} base
 * @param {String} extraPath
 * @param {...any} more - More path
 * @returns {String}
 */ function join(base, extraPath, ...more) {
    if (more && more.length > 0) {
        return more.reduce((result, part)=>join(result, part), join(base, extraPath));
    }
    return base ? extraPath ? (0, _dropIfEndsWith.default)(base, '/') + (0, _ensureStartsWith.default)(extraPath, '/') : base : extraPath;
}
const _default = join;

//# sourceMappingURL=urlJoin.js.map