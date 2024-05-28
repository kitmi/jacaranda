import Feature from '../../jacaranda/src/Feature';

export default {
    stage: Feature.SERVICE,

    groupable: true,

    packages: ['cld'],

    load_: async function (app, options, name) {
        const cld = await app.tryRequire_('cld');

        const service = {
            detect_: async (text) => {
                const { reliable, languages } = await cld.detect(text);
                return {
                    reliable,
                    name: languages[0]?.name ?? 'unknown',
                    code: languages[0]?.code ?? 'unknown',
                };
            },
        };

        app.registerService(name, service);
    },
};
