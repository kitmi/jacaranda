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
const _glob = require("glob");
const _utils = require("@kitmi/utils");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
/**
 * Jacaranda Restful API Spec (jaREST) router.
 * @module Router_JaREST
 */ const appendId = (baseEndpoint, idName)=>idName ? `${baseEndpoint}/:${idName}` : baseEndpoint;
/**
 * Create a jaREST router.
 * @param {*} app
 * @param {string} baseRoute
 * @param {object} options
 * @property {string} [options.resourcesPath]
 * @property {object|array} [options.middlewares]
 * @example
 *  '<base path>': {
 *      jaREST: {
 *          resourcesPath:
 *          middlewares:
 *      }
 *  }
 *
 *  route                          http method    function of ctrl
 *  /:resource                     get            find
 *  /:resource                     post           create
 *  /:resource/:id                 get            findOne
 *  /:resource/:id                 patch          updateOne
 *  /:resource/:id                 put            replaceOne
 *  /:resource/:id                 del            deleteOne 
 *  /:resource                     post           replaceMany
 *  /:resource                     patch          updateMany
 *  /:resource                     del            deleteMany
 */ const jaRestRouter = async (app, baseRoute, options)=>{
    let router = app.engine.createRouter(baseRoute);
    let resourcePath = _nodepath.default.resolve(app.sourcePath, options.resourcesPath || 'resources');
    app.useMiddleware(router, await app.getMiddlewareFactory('jsonError')(options.errorOptions, app), 'jsonError');
    if (options.middlewares) {
        await app.useMiddlewares_(router, options.middlewares);
    }
    let resourcesPath = _nodepath.default.join(resourcePath, '**/*.js');
    let files = (0, _glob.globSync)(resourcesPath);
    await (0, _utils.batchAsync_)(files, async (filepath)=>{
        let controller = (0, _utils.esmCheck)(require(filepath));
        if (typeof controller === 'function') {
            controller = new controller(app);
        }
        const relativePath = _nodepath.default.relative(resourcePath, filepath);
        const dirPath = _nodepath.default.dirname(relativePath);
        const entityName = _nodepath.default.basename(relativePath, '.js');
        const entithNameWithPath = _nodepath.default.join(dirPath, entityName);
        let baseEndpoint;
        if (options.remaps && entithNameWithPath in options.remaps) {
            baseEndpoint = _utils.text.ensureStartsWith(_utils.text.dropIfEndsWith(options.remaps[entithNameWithPath], '/'), '/');
        } else {
            const urlPath = entithNameWithPath.split('/').map((p)=>_utils.naming.kebabCase(p)).join('/');
            baseEndpoint = _utils.text.ensureStartsWith(urlPath, '/');
        }
        let idName = _utils.naming.camelCase(entityName) + 'Id';
        let endpointWithId = appendId(baseEndpoint, idName);
        if ((0, _utils.hasMethod)(controller, 'find')) {
            const _action = controller.find.bind(controller);
            const _middlewares = controller.find.__metaMiddlewares;
            await app.addRoute_(router, 'get', baseEndpoint, _middlewares ? [
                ..._middlewares,
                _action
            ] : _action);
        }
        if ((0, _utils.hasMethod)(controller, 'post')) {
            const _action = controller.post.bind(controller);
            const _middlewares = controller.post.__metaMiddlewares;
            await app.addRoute_(router, 'post', baseEndpoint, _middlewares ? [
                ..._middlewares,
                _action
            ] : _action);
        }
        if ((0, _utils.hasMethod)(controller, 'findById')) {
            const _action = (ctx)=>controller.findById(ctx, ctx.params[idName]);
            const _middlewares = controller.findById.__metaMiddlewares;
            await app.addRoute_(router, 'get', endpointWithId, _middlewares ? [
                ..._middlewares,
                _action
            ] : _action);
        }
        if ((0, _utils.hasMethod)(controller, 'updateById')) {
            const _action = (ctx)=>controller.updateById(ctx, ctx.params[idName]);
            const _middlewares = controller.updateById.__metaMiddlewares;
            await app.addRoute_(router, 'put', endpointWithId, _middlewares ? [
                ..._middlewares,
                _action
            ] : _action);
        }
        if ((0, _utils.hasMethod)(controller, 'deleteById')) {
            const _action = (ctx)=>controller.deleteById(ctx, ctx.params[idName]);
            const _middlewares = controller.deleteById.__metaMiddlewares;
            await app.addRoute_(router, 'del', endpointWithId, _middlewares ? [
                ..._middlewares,
                _action
            ] : _action);
        }
    });
    app.addRouter(router);
};
const _default = jaRestRouter;

//# sourceMappingURL=jaRest.js.map