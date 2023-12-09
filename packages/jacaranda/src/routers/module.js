import path from 'node:path';
import { _, url as urlUtil, text, esmCheck, batchAsync_ } from '@kitmi/utils';
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
 */
async function moduleRouter(app, baseRoute, moduleItem) {
    let controllerPath = app.controllersPath;

    if (typeof moduleItem === 'string') {
        // [ 'controllerName' ]
        moduleItem = {
            controller: moduleItem,
        };
    }

    let currentPrefix = urlUtil.join(baseRoute, moduleItem.route || '/');
    let router = app.engine.createRouter(currentPrefix);

    if (moduleItem.middlewares) {
        //module-wide middlewares
        await app.useMiddlewares_(router, moduleItem.middlewares);
    }

    let controllers;

    if (moduleItem.controllers) {
        controllers = moduleItem.controllers;
        if (!Array.isArray(controllers)) {
            throw new InvalidConfiguration(
                'Invalid module router configuration: controllers must be an array.',
                app,
                `routing.${baseRoute}.module.controllers`
            );
        }
    } else {
        if (typeof moduleItem.controller !== 'string') {
            throw new InvalidConfiguration(
                'Invalid module router configuration: controller must be a string.',
                app,
                `routing.${baseRoute}.module.controller`
            );
        }

        controllers = [moduleItem.controller];
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
            let subRoute = text.ensureStartsWith(action.__metaRoute || _.kebabCase(actionName), '/');

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
                    `routing.${baseRoute}.module ${moduleItem.controller}.${actionName}`
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

    app.addRouter(router);
}

export default moduleRouter;
