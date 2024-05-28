import koaStatic from 'koa-static';

/**
 * Static file server middleware.
 * @module Middleware_ServeStatic
 */

const serveStatic = async (options, app) => {
    return koaStatic(app.publicPath, options);
};

export default serveStatic;
