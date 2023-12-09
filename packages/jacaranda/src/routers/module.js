import path from 'node:path';
import { _, url as urlUtil, text, esmCheck, eachAsync_, batchAsync_ } from '@kitmi/utils';
import { InvalidConfiguration } from '@kitmi/types';
import { supportedMethods } from '../helpers';

/**
 * Module router for mounting a specific controller.
 * @module Router_Module
 */

/**
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
 */
async function moduleRouter(app, baseRoute, options) {
    let controllerPath = options.$controllerPath;

    if (typeof options === 'string') {
        // [ 'controllerName' ]
        options = {
            '/': [options],
        };
    }

    let router = app.engine.createRouter(baseRoute);

    if (options.$middlewares) {
        //module-wide middlewares
        await app.useMiddlewares_(router, options.$middlewares);
    }

    await eachAsync_(options, async (controllers, subBaseRoute) => {
        if (subBaseRoute[0] === '$') {
            return;
        }

        if (!Array.isArray(controllers)) {
            controllers = [controllers];
        }

        await batchAsync_(controllers, async (moduleController) => {
            let controllerFile = path.join(controllerPath, moduleController);
            let controller;

            try {
                controller = esmCheck(require(controllerFile));
            } catch (e) {
                if (e.code === 'MODULE_NOT_FOUND') {
                    throw new InvalidConfiguration(
                        `Failed to load controller '${moduleController}'. ${e.message}`,
                        app,
                        `routing.${baseRoute}.module`
                    );
                }

                throw e;
            }

            let isController = false;

            if (typeof controller === 'function') {
                controller = new controller(app);
                isController = true;
            }

            for (let actionName in controller) {
                let action = controller[actionName];
                if (typeof action !== 'function' || !action.__metaHttpMethod) continue; // only marked httpMethod should be mounted

                const method = action.__metaHttpMethod;
                const subRoute = urlUtil.join(subBaseRoute, text.dropIfStartsWith(action.__metaRoute || _.kebabCase(actionName), '/'));

                let bindAction;

                if (isController) {
                    bindAction = action.bind(controller);
                } else {
                    bindAction = action;
                }

                if (!supportedMethods.has(method)) {
                    throw new InvalidConfiguration(
                        'Unsupported http method: ' + method,
                        app,
                        `routing.${baseRoute}.module.subBaseRoute[${moduleController}.${actionName}]`
                    );
                }

                await app.addRoute_(
                    router,
                    method,
                    subRoute,
                    action.__metaMiddlewares ? action.__metaMiddlewares.concat([bindAction]) : bindAction
                );
            }
        });
    });

    app.addRouter(router);
}

export default moduleRouter;
