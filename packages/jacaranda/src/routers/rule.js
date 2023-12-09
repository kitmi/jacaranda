import { _, text, eachAsync_ } from '@kitmi/utils';
import { InvalidConfiguration } from '@kitmi/types';
import { supportedMethods } from '../helpers';

/**
 * Rule based router.
 * @module Router_Rule
 */

/**
 * Create a rule-based router.
 * @param {WebModule} app
 * @param {string} baseRoute
 * @param {object} options
 * @example
 * '<base path>': {
 *     rule: {
 *         middlewares:
 *         rules: {
 *             // type 1, default is "get", methods mapped to one action
 *             '<sub route>': '<controller with relative path>.<action>',
 *
 *             // type 2, different methods mapped to different method
 *             '<sub route>': {
 *                '<method>': '<controller with relative path>.<action>'
 *             },
 *
 *             // type 3, with middleware
 *             '<sub route>': {
 *                 '<method>': {
 *                    '<middleware name>': { //middleware options }
 *                 }
 *             },
 *
 *             // type 4, all methods mapped to one action
 *             '<method>:/<sub route>': '<controller with relative path>.<action>'
 *
 *             // type 5, all methods mapped to one action
 *             '<method>:/<sub route>': {
 *                 '<middleware name>': { //middleware options }
 *             }
 *         }
 *     }
 * }
 */
async function load_(app, baseRoute, options) {
    let router = app.engine.createRouter(baseRoute);

    if (options.middlewares) {
        await app.useMiddlewares_(router, options.middlewares);
    }

    await eachAsync_(options.rules || {}, async (methods, subRoute) => {
        let pos = subRoute.indexOf(':/');

        if (pos !== -1) {
            if (pos === 0) {
                throw new InvalidConfiguration(
                    'Invalid route rule syntax: ' + subRoute,
                    app,
                    `routing[${baseRoute}].rule.rules`
                );
            }

            // like get:/, or post:/

            let embeddedMethod = subRoute.substr(0, pos).toLocaleLowerCase();
            subRoute = subRoute.substr(pos + 2);

            methods = { [embeddedMethod]: methods };
        }

        subRoute = text.ensureStartsWith(subRoute, '/');

        if (typeof methods === 'string' || Array.isArray(methods)) {
            methods = { get: methods };
        }

        await eachAsync_(methods, async (middlewares, method) => {
            if (!supportedMethods.has(method) && method !== 'all') {
                throw new InvalidConfiguration(
                    'Unsupported http method: ' + method,
                    app,
                    `routing[${baseRoute}].rule.rules[${subRoute}]`
                );
            }

            await app.addRoute_(router, method, subRoute, middlewares);
        });
    });

    app.addRouter(router);
}

export default load_;
