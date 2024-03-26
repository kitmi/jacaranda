"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    default: function() {
        return _default;
    },
    esTemplate: function() {
        return esTemplate;
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
const esTemplateSetting = {
    escape: false,
    evaluate: false,
    imports: false,
    interpolate: /\$\{([\s\S]+?)\}/g,
    variable: false
};
const esTemplate = (str, values)=>template(str, values, esTemplateSetting);
const _default = template;

//# sourceMappingURL=template.js.map