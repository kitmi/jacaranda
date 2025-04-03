/**
 * Enable web request routing.
 * @module Feature_Routing
 */

import { _, eachAsync_, isPlainObject, esmCheck } from '@kitmi/utils';
import Feature from '../Feature';
import * as routers from '../routers';

export default {
    /**
     * This feature is loaded at ready (final) stage.
     * @member {string}
     */
    stage: Feature.PLUGIN,

    /**
     * Load the feature.
     * @param {Routable} app - The app module object
     * @param {object} routes - Routes and configuration
     * @returns {Promise.<*>}
     */
    load_: (app, routes) => {
        if (app.router == null) {
            // if mount to server level
            app.createServerModuleRouter();
        }

        app.once('after:' + Feature.PLUGIN, () => {
            app.useMiddleware(
                app.router,
                async (ctx, next) => {
                    ctx.bus = (businessName, schemaName, fromApp) => {
                        if (fromApp) {
                            let _app = app.getOtherApp(fromApp);
                            return _app.bus(businessName, schemaName, null, ctx);
                        }
                        return app.bus(businessName, schemaName, fromApp, ctx);
                    };
                    await next();
                    delete ctx.bus;
                    if (ctx.dbClasses) {
                        _.each(ctx.dbClasses, (db) => {
                            delete db.ctx;
                        });
                        delete ctx.dbClasses;
                    }
                },
                'ctxClean'
            );

            return eachAsync_(routes, async (routersConfig, route) => {
                if (isPlainObject(routersConfig)) {
                    return eachAsync_(routersConfig, async (options, type) => {
                        app.log('verbose', `A "${type}" router is created at "${route}" in app [${app.name}].`);
                        return routers[type](app, route, options);
                    });
                } else {
                    // 'route': 'method:/path'
                    let mainRoute = '/',
                        baseRoute = route;
                    let pos = route.indexOf(':/');

                    if (pos !== -1) {
                        mainRoute = route.substring(0, pos + 2);
                        baseRoute = route.substring(pos + 1);
                    } else if (Array.isArray(routersConfig)) {
                        //all handled by middleware chains
                        mainRoute = 'all:/';
                    }

                    let rules = {
                        [mainRoute]: routersConfig,
                    };

                    app.log('verbose', `A "rule" router is created at "${baseRoute}" in app [${app.name}].`);

                    return routers['rule'](app, baseRoute, { rules: rules });
                }
            });
        });
    },
};
