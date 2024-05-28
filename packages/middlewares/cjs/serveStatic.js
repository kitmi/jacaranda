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
const _koastatic = /*#__PURE__*/ _interop_require_default(require("koa-static"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
/**
 * Static file server middleware.
 * @module Middleware_ServeStatic
 */ const serveStatic = async (options, app)=>{
    return (0, _koastatic.default)(app.publicPath, options);
};
const _default = serveStatic;

//# sourceMappingURL=serveStatic.js.map