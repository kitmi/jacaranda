import Feature from '../Feature';

export default {
    stage: Feature.INIT,

    packages: ['hono', '@hono/node-server'],

    load_: async function (app, options, name) {
        const hono = await app.tryRequire_('hono');

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
