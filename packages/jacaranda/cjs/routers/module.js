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
 * @param {*} moduleItem
 * @example
 *   '<base path>': {
 *       module: {
 *           middlewares:
 *           controller:
 *       }
 *   }
 *
 *   '<base path>': {
 *       module: "controller"
 *   }
 */ async function moduleRouter(app, baseRoute, moduleItem) {
    let controllerPath = app.controllersPath;
    if (typeof moduleItem === 'string') {
        // [ 'controllerName' ]
        moduleItem = {
            controller: moduleItem
        };
    }
    let currentPrefix = _utils.url.join(baseRoute, moduleItem.route || '/');
    let router = app.engine.createRouter(currentPrefix);
    if (moduleItem.middlewares) {
        //module-wide middlewares
        await app.useMiddlewares_(router, moduleItem.middlewares);
    }
    let controllers;
    if (moduleItem.controllers) {
        controllers = moduleItem.controllers;
        if (!Array.isArray(controllers)) {
            throw new _types.InvalidConfiguration('Invalid module router configuration: controllers must be an array.', app, `routing.${baseRoute}.module.controllers`);
        }
    } else {
        if (typeof moduleItem.controller !== 'string') {
            throw new _types.InvalidConfiguration('Invalid module router configuration: controller must be a string.', app, `routing.${baseRoute}.module.controller`);
        }
        controllers = [
            moduleItem.controller
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
            let subRoute = _utils.text.ensureStartsWith(action.__metaRoute || _utils._.kebabCase(actionName), '/');
            let bindAction;
            if (isController) {
                bindAction = action.bind(controller);
            } else {
                bindAction = action;
            }
            if (!_helpers.supportedMethods.has(method)) {
                throw new _types.InvalidConfiguration('Unsupported http method: ' + method, app, `routing.${baseRoute}.module ${moduleItem.controller}.${actionName}`);
            }
            await app.addRoute_(router, method, subRoute, action.__metaMiddlewares ? action.__metaMiddlewares.concat([
                bindAction
            ]) : bindAction);
        }
    });
    app.addRouter(router);
}
const _default = moduleRouter;

//# sourceMappingURL=module.js.map