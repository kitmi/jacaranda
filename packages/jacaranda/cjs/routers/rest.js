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
const _nodepath = /*#__PURE__*/ _interop_require_default(require("node:path"));
const _utils = require("@kitmi/utils");
const _glob = require("glob");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
/**
 * Simple RESTful router.
 * @module Router_REST
 */ /**
 * Create a RESTful router.
 * @param {*} app
 * @param {string} baseRoute
 * @param {objects} options
 * @property {string} [options.resourcesPath]
 * @property {object|array} [options.middlewares]
 * @example
 *  '<base path>': {
 *      REST: {
 *          resourcesPath:
 *          middlewares:
 *      }
 *  }
 *
 *  route                          http method    function of ctrl
 *  /:resource                     get            list
 *  /:resource                     post           create
 *  /:resource/:id                 get            detail
 *  /:resource/:id                 put            update
 *  /:resource/:id                 delete         remove
 */ const restRouter = async (app, baseRoute, options)=>{
    let router = app.engine.createRouter(baseRoute);
    let resourcePath = _nodepath.default.resolve(app.sourcePath, options.resourcesPath ?? 'resources');
    app.useMiddleware(router, await app.getMiddlewareFactory('jsonError')(options.errorOptions, app), 'jsonError');
    if (options.middlewares) {
        await app.useMiddlewares_(router, options.middlewares);
    }
    let resourcesPath = _nodepath.default.join(resourcePath, '**', '*.js');
    let files = (0, _glob.globSync)(resourcesPath, {
        nodir: true
    });
    await (0, _utils.batchAsync_)(files, async (file)=>{
        let relPath = _nodepath.default.relative(resourcePath, file);
        let batchUrl = _utils.text.ensureStartsWith(relPath.substring(0, relPath.length - 3).split(_nodepath.default.sep).map((p)=>_utils._.kebabCase(p)).join('/'), '/');
        let singleUrl = batchUrl + '/:id';
        let controller = (0, _utils.esmCheck)(require(file));
        if (typeof controller === 'function') {
            controller = new controller(app);
        }
        if ((0, _utils.hasMethod)(controller, 'list')) {
            await app.addRoute_(router, 'get', batchUrl, (ctx)=>controller.list(ctx));
        }
        if ((0, _utils.hasMethod)(controller, 'create')) {
            await app.addRoute_(router, 'post', batchUrl, (ctx)=>controller.create(ctx));
        }
        if ((0, _utils.hasMethod)(controller, 'detail')) {
            await app.addRoute_(router, 'get', singleUrl, (ctx)=>controller.detail(ctx));
        }
        if ((0, _utils.hasMethod)(controller, 'update')) {
            await app.addRoute_(router, 'put', singleUrl, (ctx)=>controller.update(ctx));
        }
        if ((0, _utils.hasMethod)(controller, 'remove')) {
            await app.addRoute_(router, 'del', singleUrl, (ctx)=>controller.remove(ctx));
        }
    });
    app.addRouter(router);
};
const _default = restRouter;

//# sourceMappingURL=rest.js.map