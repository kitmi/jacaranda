/**
 * Enable routing web requests to a child app.
 * @module Feature_AppRouting
 *
 * @example
 *
 *  'appRouting': {
 *      '<mounting point>': {
 *          name: 'app name',
 *          npmModule: false, // whether is a npm module
 *          options: { // module options
 *          },
 *          settings: { // can override module defined settings
 *          },
 *          middlewares: { // can override middlewares
 *          }
 *      }
 *  }
 */

import path from 'node:path';
import { _, batchAsync_, eachAsync_, pushIntoBucket } from '@kitmi/utils';
import { InvalidConfiguration } from '@kitmi/types';
import { TopoSort } from '@kitmi/algo';
import Feature from '../Feature';

import WebModule from '../WebModule';

export default {
    /**
     * This feature is loaded at plugin stage.
     * @member {string}
     */
    stage: Feature.PLUGIN,

    /**
     * Load the feature.
     * @param {WebServer} server - The web server module object.
     * @param {object} routes - Routes and configuration.
     * @returns {Promise.<*>}
     */
    load_: async (server, routes) => {
        const topoSort = new TopoSort();
        const modules = {};

        await batchAsync_(routes, async (config, baseRoute) => {
            if (!config.name) {
                throw new InvalidConfiguration('Missing app name.', app, `appRouting.${baseRoute}.name`);
            }

            let options = {
                configType: server.options.configType,
                logLevel: server.options.logLevel,
                traceMiddlewares: server.options.traceMiddlewares,
                logMiddlewareRegistry: server.options.logMiddlewareRegistry,
                sourcePath: server.options.sourcePath,
                ...config.options,
            };

            let { appPath, moduleMeta } = await server.tryLoadModule_(
                config,
                config.name,
                server.appModulesPath,
                `appRouting.[${baseRoute}]`
            );

            if (!moduleMeta) {
                moduleMeta = {};
            }

            let app = new WebModule(server, config.name, baseRoute, appPath, {
                ...moduleMeta.options,
                registry: moduleMeta.registry,
                ...options,
            });
            app.now = server.now;

            app.once('configLoaded', () => {
                if (!_.isEmpty(config.overrides)) {
                    Object.assign(app.config, config.overrides);
                    server.log('verbose', 'App config is overrided.');
                }

                if (!_.isEmpty(config.settings)) {
                    app.config.settings = Object.assign({}, app.config.settings, config.settings);
                    server.log('verbose', `App settings of [${app.name}] is overrided.`);
                }

                if (!_.isEmpty(config.middlewares)) {
                    let middlewaresToAppend = app.config.middlewares;
                    app.config.middlewares = { ...config.middlewares };
                    _.defaults(app.config.middlewares, middlewaresToAppend);
                }
            });

            pushIntoBucket(modules, config.name, { appPath, app });

            if (moduleMeta.depends) {
                topoSort.depends(config.name, moduleMeta.depends);
            } else {
                topoSort.add(config.name);
            }
        });

        const sorted = topoSort.sort();

        return eachAsync_(sorted, async (name) => {
            const bucket = modules[name];
            return batchAsync_(bucket, async ({ appPath, app }) => {
                let relativePath = path.relative(server.workingPath, appPath);
                server.log('verbose', `Loading app [${app.name}] from "${relativePath}" ...`);

                await app.start_();

                server.log('verbose', `App [${app.name}] is loaded.`);

                //delayed the app routes mounting after all plugins of the server are loaded
                server.on('before:' + Feature.FINAL, () => {
                    server.mountApp(app);
                });
            });
        });
    },
};
