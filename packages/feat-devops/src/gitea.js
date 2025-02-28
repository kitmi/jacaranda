import { Feature, DeferredService } from '@kitmi/jacaranda';
import { giteaApi } from 'gitea-js';
import GiteaClient from './drivers/GiteaClient';
import { createGitService } from './baseGitService';

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
     * @param {object} settings - Settings of gitea client
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

            const client = new GiteaClient();
            client.initialize({ host: url, token });

            const api = client.api;

            const gitService = createGitService(client, {}, app.logger);

            return {
                ...gitService,
                api,  // 保留原有的 api 属性以兼容旧版本
            };
        });

        app.registerService(name, service);
    },
};