"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return localeFactory;
    }
});
const _en = /*#__PURE__*/ _interop_require_default(require("./locale/en"));
const _zh = /*#__PURE__*/ _interop_require_default(require("./locale/zh"));
const _zhHant = /*#__PURE__*/ _interop_require_default(require("./locale/zh-Hant"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function localeFactory(config) {
    config.loadMessages('en', _en.default).loadMessages('en-AU', _en.default).loadMessages('en-GB', _en.default).loadMessages('en-US', _en.default).loadMessages('zh', _zh.default).loadMessages('zh-CN', _zh.default).loadMessages('zh-TW', _zhHant.default).loadMessages('zh-HK', _zhHant.default).setLocale('en');
}

//# sourceMappingURL=localesLoader.js.map