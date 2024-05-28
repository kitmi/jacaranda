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
const _requestip = /*#__PURE__*/ _interop_require_default(require("request-ip"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const IPV4_PREFIX = '::ffff:';
const IPV4_LOCALHOST = '::1';
const ip = async (options, app)=>{
    return async (ctx, next)=>{
        let ip = _requestip.default.getClientIp(ctx.req);
        if (ip.startsWith(IPV4_PREFIX)) {
            ip = ip.substring(IPV4_PREFIX.length);
        }
        if (ip === IPV4_LOCALHOST) {
            ip = '127.0.0.1';
        }
        ctx.request.ip = ip;
        ctx.req.info = {
            remoteAddress: ip,
            remotePort: ctx.req.socket.remotePort
        };
        return next();
    };
};
const _default = ip;

//# sourceMappingURL=ip.js.map