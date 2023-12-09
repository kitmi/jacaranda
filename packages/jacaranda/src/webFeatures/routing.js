/**
 * Enable web request routing.
 * @module Feature_Routing
 */

import { _, batchAsync_, isPlainObject, esmCheck } from '@kitmi/utils';
import Feature from '../Feature';

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
        app.on('after:' + Feature.PLUGIN, () =>
            batchAsync_(routes, async (routersConfig, route) => {
                if (isPlainObject(routersConfig)) {
                    return batchAsync_(routersConfig, async (options, type) => {
                        let loader_ = esmCheck(require('../routers/' + type));

                        app.log('verbose', `A "${type}" router is created at "${route}" in app [${app.name}].`);

                        return loader_(app, route, options);
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

                    const loader_ = esmCheck(require('../routers/rule'));
                    app.log('verbose', `A "rule" router is created at "${baseRoute}" in app [${app.name}].`);

                    return loader_(app, baseRoute, { rules: rules });
                }
            })
        );
    },
};
