"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, /**
 * Add access log for every http request
 * @module Middleware_AccessLog
 */ "default", {
    enumerable: true,
    get: function() {
        return _default;
    }
});
const _pinohttp = /*#__PURE__*/ _interop_require_default(require("pino-http"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const _default = async (opt, app)=>{
    const { logger } = app.middlewareConfig(opt ?? {}, {
        schema: {
            logger: {
                type: 'text',
                default: 'logger'
            }
        }
    }, 'accessLog');
    app.requireServices([
        logger
    ]);
    const pinoLogger = app.getService(logger);
    const log = (0, _pinohttp.default)({
        quietReqLogger: true,
        ...opt,
        logger: pinoLogger
    });
    return (ctx, next)=>{
        log(ctx.req, ctx.res);
        ctx.log = ctx.request.log = ctx.response.log = ctx.req.log;
        return next();
    };
};

//# sourceMappingURL=accessLog.js.map