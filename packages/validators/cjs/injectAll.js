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
const _jsonx = require("@kitmi/jsonx");
const _en = /*#__PURE__*/ _interop_require_default(require("@kitmi/jsonv/locale/en"));
const _text = /*#__PURE__*/ _interop_require_default(require("./validators/text"));
const _common = /*#__PURE__*/ _interop_require_default(require("./validators/common"));
const _common1 = /*#__PURE__*/ _interop_require_default(require("./processors/common"));
const _common2 = /*#__PURE__*/ _interop_require_default(require("./activators/common"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const JSX = (0, _jsonx.createJSX)();
const JSV = JSX.JSV;
JSV.config.loadMessages('en', _en.default).setLocale('en');
const jsx = (value, options, meta, context)=>JSX.evaluate(value, options, {
        path: context.path
    });
const jsv = (value, options, meta, context)=>JSV.match(value, options, null, {
        path: context.path
    });
const injectAll = (typeSystem)=>{
    typeSystem.addValidator('jsv', jsv);
    typeSystem.addModifiers('validator', _text.default);
    typeSystem.addModifiers('validator', _common.default);
    typeSystem.addProcessor('jsx', jsx);
    typeSystem.addModifiers('processor', _common1.default);
    typeSystem.addModifiers('activator', _common2.default);
    typeSystem.jsvConfig = JSV.config;
};
const _default = injectAll;

//# sourceMappingURL=injectAll.js.map