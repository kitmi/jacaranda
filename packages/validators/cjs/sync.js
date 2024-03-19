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
    Types: function() {
        return Types;
    },
    default: function() {
        return _default;
    }
});
const _modifiableSystem = /*#__PURE__*/ _interop_require_default(require("./modifiableSystem"));
const _modifier = require("./modifier");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const typeSystem = (0, _modifiableSystem.default)(_modifier.postProcess);
const Types = typeSystem.types;
const _default = typeSystem;

//# sourceMappingURL=sync.js.map