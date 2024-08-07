import koaViews from '@ladjs/koa-views';

/**
 * Template views middleware.
 * @module Middleware_Views
 */

const views = async (options, app) => {
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
        'views'
    );

    return koaViews(app.toAbsolutePath(viewPath), opts);
};

export default views;
