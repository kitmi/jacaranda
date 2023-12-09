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
const _types = require("@kitmi/types");
const _helpers = require("../helpers");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
/**
 * Module router for mounting a specific controller.
 * @module Router_Module
 */ /**
 * Create a module-based router.
 * @param {Routable} app
 * @param {string} baseRoute
 * @param {*} options
 * @example
 *   '<base path>': {
 *       module: {
 *           $controllerPath:
 *           $middlewares:
 *           '/': [ 'controller', ... ]
 *       }
 *   }
 *
 *   '<base path>': {
 *       module: "controller"
 *   }
 */ async function moduleRouter(app, baseRoute, options) {
    let controllerPath = options.$controllerPath;
    if (typeof options === 'string') {
        // [ 'controllerName' ]
        options = {
            '/': [
                options
            ]
        };
    }
    let router = app.engine.createRouter(baseRoute);
    if (options.$middlewares) {
        //module-wide middlewares
        await app.useMiddlewares_(router, options.$middlewares);
    }
    await (0, _utils.eachAsync_)(options, async (controllers, subBaseRoute)=>{
        if (subBaseRoute[0] === '$') {
            return;
        }
        if (!Array.isArray(controllers)) {
            controllers = [
                controllers
            ];
        }
        await (0, _utils.batchAsync_)(controllers, async (moduleController)=>{
            let controllerFile = _nodepath.default.join(controllerPath, moduleController);
            let controller;
            try {
                controller = (0, _utils.esmCheck)(require(controllerFile));
            } catch (e) {
                if (e.code === 'MODULE_NOT_FOUND') {
                    throw new _types.InvalidConfiguration(`Failed to load controller '${moduleController}'. ${e.message}`, app, `routing.${baseRoute}.module`);
                }
                throw e;
            }
            let isController = false;
            if (typeof controller === 'function') {
                controller = new controller(app);
                isController = true;
            }
            for(let actionName in controller){
                let action = controller[actionName];
                if (typeof action !== 'function' || !action.__metaHttpMethod) continue; // only marked httpMethod should be mounted
                const method = action.__metaHttpMethod;
                const subRoute = _utils.url.join(subBaseRoute, _utils.text.dropIfStartsWith(action.__metaRoute || _utils._.kebabCase(actionName), '/'));
                let bindAction;
                if (isController) {
                    bindAction = action.bind(controller);
                } else {
                    bindAction = action;
                }
                if (!_helpers.supportedMethods.has(method)) {
                    throw new _types.InvalidConfiguration('Unsupported http method: ' + method, app, `routing.${baseRoute}.module.subBaseRoute[${moduleController}.${actionName}]`);
                }
                await app.addRoute_(router, method, subRoute, action.__metaMiddlewares ? action.__metaMiddlewares.concat([
                    bindAction
                ]) : bindAction);
            }
        });
    });
    app.addRouter(router);
}
const _default = moduleRouter;

//# sourceMappingURL=module.js.map