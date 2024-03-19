/**
 * Template views middleware.
 * @module Middleware_Views
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
const views = async (options, app)=>{
    const views = await app.tryRequire_('@ladjs/koa-views');
    const { root: viewPath, ...opts } = app.middlewareConfig(options, {
        schema: {
            root: {
                type: 'text'
            },
            extension: {
                type: 'text',
                optional: true
            },
            autoRender: {
                type: 'bool',
                optional: true
            },
            map: {
                type: 'object',
                optional: true
            },
            options: {
                type: 'object',
                optional: true
            }
        }
    }, 'accessLog');
    return views(app.toAbsolutePath(viewPath), opts);
};
const _default = views;

//# sourceMappingURL=views.js.map