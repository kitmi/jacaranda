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
        return _Jsx.default;
    },
    transform: function() {
        return _transformers.default;
    }
});
const _transformers = /*#__PURE__*/ _interop_require_default(require("./transformers"));
const _Jsx = /*#__PURE__*/ _interop_require_default(require("./Jsx"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}

//# sourceMappingURL=index.js.map