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
const _jsonx = /*#__PURE__*/ _interop_require_default(require("@kitmi/jsonx"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const jsx = (value, options, meta, context)=>_jsonx.default.evaluate(value, options, {
        name: context.path,
        locale: context.i18n?.locale
    });
const _default = {
    jsx
};

//# sourceMappingURL=jsx.js.map