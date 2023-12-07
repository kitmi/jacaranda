"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return _index.default;
    }
});
const _config = /*#__PURE__*/ _interop_require_default(require("./config"));
const _en = /*#__PURE__*/ _interop_require_default(require("./locale/en"));
const _zh = /*#__PURE__*/ _interop_require_default(require("./locale/zh"));
const _zhHant = /*#__PURE__*/ _interop_require_default(require("./locale/zh-Hant"));
const _index = /*#__PURE__*/ _interop_require_default(_export_star(require("./index"), exports));
function _export_star(from, to) {
    Object.keys(from).forEach(function(k) {
        if (k !== "default" && !Object.prototype.hasOwnProperty.call(to, k)) {
            Object.defineProperty(to, k, {
                enumerable: true,
                get: function() {
                    return from[k];
                }
            });
        }
    });
    return from;
}
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
_config.default.loadMessages('en', _en.default).loadMessages('en-AU', _en.default).loadMessages('en-GB', _en.default).loadMessages('en-US', _en.default).loadMessages('zh', _zh.default).loadMessages('zh-CN', _zh.default).loadMessages('zh-TW', _zhHant.default).loadMessages('zh-HK', _zhHant.default).setLocale('en');

//# sourceMappingURL=bundle.js.map