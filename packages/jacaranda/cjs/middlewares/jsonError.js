/**
 * Error response middleware with json
 * @module Middleware_JsonError
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
const _nodehttp = /*#__PURE__*/ _interop_require_default(require("node:http"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const jsonError = (opt, app)=>{
    const apiWrapper = app.getService(app.settings?.apiWrapperService || 'apiWrapper');
    const handler = apiWrapper && apiWrapper.wrapError;
    return async (ctx, next)=>{
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
            // accepted types
            if (handler) {
                try {
                    ctx.body = await handler(ctx, err);
                    ctx.app.emit('error', err, ctx);
                    ctx.errorHandled = true;
                    return;
                } catch (error) {
                    error.innerError = err;
                    err = error;
                }
            }
            ctx.body = {
                error: err.expose && err.message ? err.message : _nodehttp.default.STATUS_CODES[ctx.status]
            };
            ctx.app.emit('error', err, ctx);
        }
    };
};
const _default = jsonError;

//# sourceMappingURL=jsonError.js.map