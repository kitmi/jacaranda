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
        //delay to load middlewares after all plug-ins are ready
        await app.useMiddlewares_(app.router, middlewares);
    },
};
