"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return serve;
    }
});
const _WebServer = /*#__PURE__*/ _interop_require_default(require("../WebServer"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function serve(options) {
    const server = new _WebServer.default(null, options);
    server.start_().catch((error)=>{
        console.error(error);
    });
    return server;
}

//# sourceMappingURL=serve.js.map