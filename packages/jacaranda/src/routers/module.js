import { url as urlUtil, naming, text, eachAsync_, batchAsync_, get as _get } from '@kitmi/utils';
import { InvalidConfiguration } from '@kitmi/types';
import { supportedMethods } from '../helpers';
import { loadController_ } from '../helpers/loadModuleFrom_';

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
 *           $urlDasherize: false
 *           '/': [ 'controller', ... ]
 *       }
 *   }
 *
 *   '<base path>': {
 *       module: "controller"
 *   }
 */
async function moduleRouter(app, baseRoute, options) {
    if (typeof options === 'string') {
        // [ 'controllerName' ]
        options = {
            '/': [options],
        };
    }

    let controllerPath = options.$controllerPath ?? 'modules';

    const kebabify = options.$urlDasherize;

    let router = app.router.createRouter(baseRoute);

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
            let controller = await loadController_(
                app,
                options.$source,
                controllerPath,
                moduleController,
                options.$packageName
            );

            if (controller == null) {
                throw new InvalidConfiguration(
                    `Module controller "${moduleController}" not found.`,
                    app,
                    `routing.${baseRoute}.module[${subBaseRoute}]`
                );
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
                const subRoute = text.ensureStartsWith(
                    urlUtil.join(
                        subBaseRoute,
                        text.dropIfStartsWith(
                            action.__metaRoute || (kebabify ? naming.kebabCase(actionName) : actionName),
                            '/'
                        )
                    ),
                    '/'
                );

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
                        `routing[${baseRoute}].module.subBaseRoute[${moduleController}.${actionName}]`
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
