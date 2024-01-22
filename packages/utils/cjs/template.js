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
const _compile = /*#__PURE__*/ _interop_require_default(require("./compile"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
/**
 * Interpolate values
 * @function string.template
 * @param {String} str
 * @param {Object} values
 * @param {Object} [settings] - Template settings, {@link https://lodash.com/docs/4.17.15#template}
 * @returns {String}
 */ function template(str, values, settings) {
    return (0, _compile.default)(str, settings)(values);
}
const _default = template;

//# sourceMappingURL=template.js.map