/**
 * Add access log for every http request
 * @module Middleware_AccessLog
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return _default;
    }
});
const _default = async (opt, app)=>{
    const { logger } = app.middlewareConfig(opt ?? {}, {
        schema: {
            logger: {
                type: 'text',
                default: 'logger'
            }
        }
    }, 'accessLog');
    const pinoHttp = await app.tryRequire_('pino-http');
    app.requireServices([
        logger
    ], 'accessLog');
    const pinoLogger = app.getService(logger);
    const log = pinoHttp({
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