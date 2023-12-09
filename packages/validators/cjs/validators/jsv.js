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
const _jsonv = /*#__PURE__*/ _interop_require_default(require("@kitmi/jsonv"));
const _jsonx = require("@kitmi/jsonx");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const jsv = (value, options, meta, context)=>_jsonv.default.match(value, options, null, {
        name: context.path,
        jsonx: _jsonx.transform,
        locale: context.i18n?.locale
    });
const _default = {
    jsv
};

//# sourceMappingURL=jsv.js.map