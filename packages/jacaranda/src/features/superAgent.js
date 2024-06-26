import Feature from '../Feature';
import HttpClient from '../helpers/HttpClient';

export default {
    /**
     * This feature is loaded at init stage
     * @member {string}
     */
    stage: Feature.SERVICE,

    /**
     * This feature can be grouped by serviceGroup
     * @member {boolean}
     */
    groupable: true,

    packages: ['superagent'],

    /**
     * Load the feature
     * @param {App} app - The cli app module object
     * @param {object} settings - Settings of rest clients
     * @returns {Promise.<*>}
     */
    load_: async function (app, settings, name) {
        const superagent = await app.tryRequire_('superagent', true);
        const { superagent: adapter } = app.tryRequire('@kitmi/adapters');

        let client = new HttpClient(adapter(superagent), settings);

        app.registerService(name, client);
    },
};
