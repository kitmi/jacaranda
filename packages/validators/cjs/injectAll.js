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
const _jsv = /*#__PURE__*/ _interop_require_default(require("./validators/jsv"));
const _text = /*#__PURE__*/ _interop_require_default(require("./validators/text"));
const _common = /*#__PURE__*/ _interop_require_default(require("./validators/common"));
const _jsx = /*#__PURE__*/ _interop_require_default(require("./processors/jsx"));
const _common1 = /*#__PURE__*/ _interop_require_default(require("./processors/common"));
const _common2 = /*#__PURE__*/ _interop_require_default(require("./activators/common"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const injectAll = (validator)=>{
    validator.addModifiers('validator', _jsv.default);
    validator.addModifiers('validator', _text.default);
    validator.addModifiers('validator', _common.default);
    validator.addModifiers('processor', _jsx.default);
    validator.addModifiers('processor', _common1.default);
    validator.addModifiers('activator', _common2.default);
};
const _default = injectAll;

//# sourceMappingURL=injectAll.js.map