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

    packages: ['supertest'],

    /**
     * Load the feature
     * @param {App} app - The cli app module object
     * @param {object} settings - Settings of rest clients
     * @returns {Promise.<*>}
     */
    load_: async function (app, settings, name) {
        const supertest = await app.tryRequire_('supertest', true);
        const { supertest: adapter } = app.tryRequire('@kitmi/adapters');

        let client = new HttpClient(adapter(supertest), settings);

        app.registerService(name, client);
    },
};
