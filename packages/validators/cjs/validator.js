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
const _modifibleSystem = /*#__PURE__*/ _interop_require_default(require("./modifibleSystem"));
const _modifier = require("./modifier");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const validator = (0, _modifibleSystem.default)();
validator.addPlugin('postProcess', _modifier.postProcess);
const Types = validator.types;
const _default = validator;

//# sourceMappingURL=validator.js.map