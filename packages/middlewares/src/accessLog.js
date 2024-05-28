import pinoHttp from 'pino-http';

/**
 * Add access log for every http request
 * @module Middleware_AccessLog
 */

export default async (opt, app) => {
    const { logger } = app.middlewareConfig(
        opt ?? {},
        {
            schema: {
                logger: { type: 'text', default: 'logger' },
            },
        },
        'accessLog'
    );

    app.requireServices([logger]);

    const pinoLogger = app.getService(logger);

    const log = pinoHttp({ quietReqLogger: true, ...opt, logger: pinoLogger });

    return (ctx, next) => {
        log(ctx.req, ctx.res);
        ctx.log = ctx.request.log = ctx.response.log = ctx.req.log;
        return next();
    };
};
