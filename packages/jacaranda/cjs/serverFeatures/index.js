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
    appRouting: function() {
        return _appRouting.default;
    },
    engine: function() {
        return _engine.default;
    }
});
const _engine = /*#__PURE__*/ _interop_require_default(require("./engine"));
const _appRouting = /*#__PURE__*/ _interop_require_default(require("./appRouting"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}

//# sourceMappingURL=index.js.map