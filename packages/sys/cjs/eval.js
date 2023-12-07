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
    evaluate: function() {
        return evaluate;
    },
    interpolate: function() {
        return interpolate;
    }
});
const _nodevm = /*#__PURE__*/ _interop_require_default(require("node:vm"));
const _utils = require("@kitmi/utils");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function interpolate(str, variables) {
    return _nodevm.default.runInNewContext((0, _utils.quote)(str, '`'), variables);
}
function evaluate(expr, variables) {
    return _nodevm.default.runInNewContext('() => (' + expr + ')', variables)();
}

//# sourceMappingURL=eval.js.map