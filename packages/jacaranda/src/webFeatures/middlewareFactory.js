/**
 * Enable middleware factory
 * @module Feature_MiddlewareFactory
 *
 * @example
 *   "middlewareFactory": {
 *       //new middleware name
 *       "listOfMiddleware": {
 *           "middleware1": { // options
 *               ...
 *           },
 *           "middleware2": { // options
 *               ...
 *           }
 *       },
 *        "altListOfMiddleware": [
 *           {
 *               "name": "middleware1",
 *               "options": { ... }
 *           },
 *           [ "middleware2", { ... } ],
 *           "middleware3"
 *       ]
 *   },
 */

import { _, isPlainObject, eachAsync_ } from '@kitmi/utils';
import { InvalidConfiguration } from '@kitmi/types';
import Feature from '../Feature';

export default {
    /**
     * This feature is loaded at init stage
     * @member {string}
     */
    stage: Feature.INIT,

    /**
     * Load the feature
     * @param {App} app - The app module object
     * @param {object} factories - Object factories
     * @returns {Promise.<*>}
     */
    load_: (app, factories) => {
        _.each(factories, (factoryInfo, name) => {
            app.registerMiddlewareFactory(name, async (opt, targetApp) => {
                if (!_.isEmpty(opt)) {
                    throw new InvalidConfiguration(
                        'Middleware factory should be used with empty options.',
                        app,
                        `middlewareFactory.${name}`
                    );
                }

                let chains;

                if (isPlainObject(factoryInfo)) {
                    chains = [];

                    await eachAsync_(factoryInfo, async (options, middleware) => {
                        chains.push(await (await app.getMiddlewareFactory_(middleware))(options, targetApp));
                    });
                } else if (Array.isArray(factoryInfo)) {
                    chains = await eachAsync_(factoryInfo, async (middlewareInfo, i) => {
                        if (isPlainObject(middlewareInfo)) {
                            if (!middlewareInfo.name) {
                                throw new InvalidConfiguration(
                                    'Missing referenced middleware name.',
                                    app,
                                    `middlewareFactory.${name}[${i}].name`
                                );
                            }

                            return (await app.getMiddlewareFactory_(middlewareInfo.name))(middlewareInfo.options, targetApp);
                        }

                        if (Array.isArray(middlewareInfo)) {
                            if (
                                middlewareInfo.length < 1 ||
                                middlewareInfo.length > 2 ||
                                typeof middlewareInfo[0] !== 'string'
                            ) {
                                throw new InvalidConfiguration(
                                    'Invalid middleware factory item config.',
                                    app,
                                    `middlewareFactory.${name}[${i}]`
                                );
                            }

                            return (await app.getMiddlewareFactory_(middlewareInfo[0]))(
                                middlewareInfo.length > 1 ? middlewareInfo[1] : undefined,
                                targetApp
                            );
                        }

                        if (typeof middlewareInfo === 'string') {
                            return (await app.getMiddlewareFactory_(middlewareInfo))(undefined, targetApp);
                        }

                        throw new InvalidConfiguration(
                            'Invalid middleware factory item config.',
                            app,
                            `middlewareFactory.${name}[${i}]`
                        );
                    });
                } else {
                    throw new InvalidConfiguration(
                        'Invalid middleware factory config.',
                        app,
                        `middlewareFactory.${name}`
                    );
                }

                return chains.length === 1 ? chains[0] : chains;
            });
        });
    },
};
