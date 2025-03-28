/**
 * Error response middleware with json
 * @module Middleware_JsonError
 */

import http from 'node:http';

/**
 * Wrap the error response into json format and with the apiWrapper service if exists.
 * @param {*} opt
 * @param {*} app
 * @returns {Function} Middleware function
 */
const jsonError = (opt, app) => {
    const apiWrapper = app.getService(app.settings?.apiWrapperService || 'apiWrapper');
    const handler = apiWrapper && apiWrapper.wrapError;

    return async (ctx, next) => {
        try {
            await next();

            if (ctx.errorHandled) {
                return;
            }

            if (ctx.status >= 400) {
                if (ctx.type === 'text/plain') {
                    ctx.throw(ctx.status, ctx.body);
                } else {
                    ctx.throw(ctx.status);
                }
            }
        } catch (err) {
            ctx.status = typeof err.status === 'number' && err.status >= 100 ? err.status : 500;
            ctx.type = 'application/json';

            let errReport = err;

            // accepted types
            if (handler) {
                try {
                    // avoid error in error handling
                    ctx.body = handler(ctx, err);
                    ctx.app.emit('error', err, ctx);
                    ctx.errorHandled = true;
                    return;
                } catch (error) {
                    error.innerError = err;
                    errReport = error;
                }
            }

            ctx.body = {
                error: errReport.expose && errReport.message ? errReport.message : http.STATUS_CODES[ctx.status],
            };
            ctx.app.emit('error', errReport, ctx);
        }
    };
};

export default jsonError;
