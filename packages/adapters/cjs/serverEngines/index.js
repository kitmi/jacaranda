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
    hono: function() {
        return _hono.default;
    },
    koa: function() {
        return _koa.default;
    }
});
const _koa = /*#__PURE__*/ _interop_require_default(require("./koa"));
const _hono = /*#__PURE__*/ _interop_require_default(require("./hono"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}

//# sourceMappingURL=index.js.map