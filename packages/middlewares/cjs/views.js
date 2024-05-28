"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return _default;
    }
});
const _koaviews = /*#__PURE__*/ _interop_require_default(require("@ladjs/koa-views"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
/**
 * Template views middleware.
 * @module Middleware_Views
 */ const views = async (options, app)=>{
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
    return (0, _koaviews.default)(app.toAbsolutePath(viewPath), opts);
};
const _default = views;

//# sourceMappingURL=views.js.map