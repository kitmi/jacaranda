/**
 * Static file server middleware.
 * @module Middleware_ServeStatic
 */

const serveStatic = async (options, app) => {
    const koaStatic = await app.tryRequire_('koa-static');

    return koaStatic(app.publicPath, options);
};

export default serveStatic;
