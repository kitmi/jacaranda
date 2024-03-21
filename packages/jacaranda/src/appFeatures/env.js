/**
 * Enable app customized env variables
 * @module Feature_Env
 */

import Feature from '../Feature';

export default {
    /**
     * This feature is loaded at init stage
     * @member {string}
     */
    stage: Feature.INIT,

    /**
     * Load the feature
     * @param {App} app - The cli app module object
     * @param {object} envSettings - Customized env settings
     * @returns {Promise.<*>}
     */
    load_: function (app, envSettings) {
        Object.assign(process.env, envSettings);
    },
};
