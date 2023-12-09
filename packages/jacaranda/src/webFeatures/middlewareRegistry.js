/**
 * Enable middleware registry
 * @module Feature_MiddlewareRegistry
 *
 * @example
 *   "middlewareRegistry": {
 *       //middleware name
 *       "middleware1": "path/to/middleware1", // middleware1 = require("path/to/middleware1");
 *       "middleware2": [ "path/to/middleware2", "object path" ] // middleware2 = _.get(require("path/to/middleware2"), "object path")
 *   },
 */

import Feature from '../Feature';

export default {
    /**
     * This feature is loaded at init stage
     * @member {string}
     */
    stage: Feature.CONF,

    /**
     * Load the feature
     * @param {App} app - The app module object
     * @param {object} registry - Middleware registry, key is middleware name, value is middleware module path
     * @returns {Promise.<*>}
     */
    load_: (app, registry) => {
        app.addMiddlewaresRegistry(registry);
    },
};
