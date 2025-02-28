import { Feature, DeferredService } from '@kitmi/jacaranda';
import { giteaApi } from 'gitea-js';

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

    /**
     * Load the feature
     * @param {App} app - The cli app module object
     * @param {object} settings - Settings of soal client
     * @returns {Promise.<*>}
     */
    load_: async function (app, opts, name) {
        const service = new DeferredService(() => {
            const { url, token } = app.featureConfig(
                opts,
                {
                    schema: {
                        url: { type: 'text' },
                        token: { type: 'text' },
                    },
                },
                name
            );

            const giteaApi = giteaApi(url, { token });

            return {
                api: giteaApi,
                createRepo: () => giteaApi, // todo: 
                pullRequest: () => giteaApi, // todo: 
            };
        });

        app.registerService(name, service);
    },
};
