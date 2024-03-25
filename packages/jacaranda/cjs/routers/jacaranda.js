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
 * Jacaranda Restful API Spec (jacaranda) router.
 * @module Router_JaREST
 */ const appendId = (baseEndpoint, idName)=>idName ? `${baseEndpoint}/:${idName}` : baseEndpoint;
/**
 * Create a jaREST router.
 * @param {*} app
 * @param {string} baseRoute
 * @param {object} options
 * @property {string} [options.$controllerPath]
 * @property {object|array} [options.$middlewares]
 * @property {boolean} [options.$urlDasherize]
 * @example
 *  '<base path>': {
 *      jacaranda: {
 *          $controllerPath:
 *          $middlewares:
 *          $errorOptions
 *          'controller To remap': '/special/:abc/url'
 *          ...
 *      }
 *  }
 *
 *  route                          http method    function of ctrl
 *  /:resource                     get            find
 *  /:resource                     post           post
 *  /:resource/:id                 get            findOne
 *  /:resource/:id                 patch          updateOne
 *  /:resource/:id                 put            replaceOne
 *  /:resource/:id                 delete         deleteOne 
 *  /:resource                     put            replaceMany
 *  /:resource                     patch          updateMany
 *  /:resource                     delete         deleteMany
 */ const jaRestRouter = async (app, baseRoute, options)=>{
    let router = app.router.createRouter(baseRoute);
    let resourcePath = _nodepath.default.resolve(app.sourcePath, options.$controllerPath || 'resources');
    const kebabify = options.$urlDasherize;
    app.useMiddleware(router, await app.getMiddlewareFactory('jsonError')(options.$errorOptions, app), 'jsonError');
    if (options.$middlewares) {
        await app.useMiddlewares_(router, options.$middlewares);
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
        if (entithNameWithPath in options) {
            baseEndpoint = _utils.text.ensureStartsWith(_utils.text.dropIfEndsWith(options[entithNameWithPath], '/'), '/');
        } else {
            const urlPath = entithNameWithPath.split('/').map((p)=>kebabify ? _utils.naming.kebabCase(p) : p).join('/');
            baseEndpoint = _utils.text.ensureStartsWith(urlPath, '/');
        }
        let idName = _utils.naming.camelCase(entityName) + 'Id';
        let endpointWithId = appendId(baseEndpoint, idName);
        async function addRoute_(methodName, httpMethod) {
            if ((0, _utils.hasMethod)(controller, methodName)) {
                const _action = controller[methodName].bind(controller);
                const _middlewares = controller[methodName].__metaMiddlewares;
                await app.addRoute_(router, httpMethod, baseEndpoint, _middlewares ? [
                    ..._middlewares,
                    _action
                ] : _action);
            }
        }
        async function addRouteWithId_(methodName, httpMethod) {
            if ((0, _utils.hasMethod)(controller, methodName)) {
                const _action = (ctx)=>controller[methodName](ctx, ctx.params[idName]);
                const _middlewares = controller[methodName].__metaMiddlewares;
                await app.addRoute_(router, httpMethod, endpointWithId, _middlewares ? [
                    ..._middlewares,
                    _action
                ] : _action);
            }
        }
        await addRoute_('query', 'get');
        await addRoute_('post', 'post');
        await addRoute_('put', 'put');
        await addRoute_('del', 'delete');
        await addRouteWithId_('getOne', 'get');
        await addRouteWithId_('putOne', 'put');
        await addRouteWithId_('delOne', 'delete');
    });
    app.addRouter(router);
};
const _default = jaRestRouter;

//# sourceMappingURL=jacaranda.js.map