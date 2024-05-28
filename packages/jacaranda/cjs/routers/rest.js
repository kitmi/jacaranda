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
const _utils = require("@kitmi/utils");
/**
 * Simple RESTful router.
 * @module Router_REST
 */ /**
 * Create a RESTful router.
 * @param {Routable} app
 * @param {string} baseRoute
 * @param {object} options
 * @property {string} [options.$controllerPath]
 * @property {object} [options.$errorOptions]
 * @property {object|array} [options.$middlewares]
 * @example
 *  '<base path>': {
 *      REST: {
 *          $controllerPath:
 *          $errorOptions:
 *          $middlewares:
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
    let router = app.router.createRouter(baseRoute);
    let resourcesPath = options.$controllerPath ?? 'resources';
    const kebabify = options.$urlDasherize;
    app.useMiddleware(router, await app.getMiddlewareFactory('jsonError')(options.$errorOptions, app), 'jsonError');
    if (options.$middlewares) {
        await app.useMiddlewares_(router, options.$middlewares);
    }
    const controllers = app.registry.controllers?.[resourcesPath] ?? [];
    await (0, _utils.batchAsync_)(controllers, async (controller, relPath)=>{
        let batchUrl = _utils.text.ensureStartsWith(relPath.split('/').map((p)=>kebabify ? _utils.naming.kebabCase(p) : p).join('/'), '/');
        let singleUrl = batchUrl + '/:id';
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
            await app.addRoute_(router, 'delete', singleUrl, (ctx)=>controller.remove(ctx));
        }
    });
    app.addRouter(router);
};
const _default = restRouter;

//# sourceMappingURL=rest.js.map