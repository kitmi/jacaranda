/**
 * Enable middlewares
 * @module Feature_Middlewares
 */

import Feature from '../Feature';

export default {
    /**
     * This feature is loaded at plugin stage
     * @member {string}
     */
    stage: Feature.PLUGIN,

    /**
     * Load the feature
     * @param {Routable} app - The app module object
     * @param {*} middlewares - Middlewares and options
     * @returns {Promise.<*>}
     */
    load_: async function (app, middlewares) {
        if (app.router == null) {
            // if mount to server level
            app.createServerModuleRouter();
        }

        await app.useMiddlewares_(app.router, middlewares);
    },
};
