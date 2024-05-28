import Feature from '../Feature';

export default {
    stage: Feature.SERVICE,

    groupable: true,

    packages: ['@napi-rs/uuid'],

    load_: async function (app, options, name) {       
        const { v4 } = await app.tryRequire_('@napi-rs/uuid');      

        const service = {
            next: v4
        };

        app.registerService(name, service);
    },
};
