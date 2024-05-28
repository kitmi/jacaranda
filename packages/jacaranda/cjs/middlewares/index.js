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
    action: function() {
        return _action.default;
    },
    favicon: function() {
        return _favicon.default;
    },
    jsonError: function() {
        return _jsonError.default;
    }
});
const _jsonError = /*#__PURE__*/ _interop_require_default(require("./jsonError"));
const _favicon = /*#__PURE__*/ _interop_require_default(require("./favicon"));
const _action = /*#__PURE__*/ _interop_require_default(require("./action"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}

//# sourceMappingURL=index.js.map