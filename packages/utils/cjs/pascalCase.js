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
const _upperFirst = /*#__PURE__*/ _interop_require_default(require("lodash/upperFirst"));
const _camelCase = /*#__PURE__*/ _interop_require_default(require("lodash/camelCase"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
/**
 * Convert a string to pascal case, 'fooBar'
 * @function string.pascalCase
 * @param {String} str
 * @returns {String}
 */ const pascalCase = (str)=>(0, _upperFirst.default)((0, _camelCase.default)(str));
const _default = pascalCase;

//# sourceMappingURL=pascalCase.js.map