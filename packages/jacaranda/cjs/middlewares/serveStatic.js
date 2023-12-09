/**
 * Static file server middleware.
 * @module Middleware_ServeStatic
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
const serveStatic = async (options, app)=>{
    const koaStatic = await app.tryRequire_('koa-static');
    return koaStatic(app.publicPath, options);
};
const _default = serveStatic;

//# sourceMappingURL=serveStatic.js.map