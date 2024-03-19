/**
 * Template views middleware.
 * @module Middleware_Views
 */

const views = async (options, app) => {
    const views = await app.tryRequire_('@ladjs/koa-views');

    const { root: viewPath, ...opts } = app.middlewareConfig(
        options,
        {
            schema: {
                root: { type: 'text' },
                extension: { type: 'text', optional: true },
                autoRender: { type: 'bool', optional: true },
                map: { type: 'object', optional: true },
                options: { type: 'object', optional: true },
            },
        },
        'accessLog'
    );

    return views(app.toAbsolutePath(viewPath), opts);
};

export default views;


