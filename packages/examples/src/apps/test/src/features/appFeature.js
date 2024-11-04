import { Feature } from '@kitmi/jacaranda';

export default {
    /**
     * This feature is loaded at service stage
     * @member {string}
     */
    stage: Feature.SERVICE,

    load_: async function (app, config, name) {
        const { param } = config;

        const service = {
            getParam: () => param,
        };

        app.registerService(name, service);
    },
};
