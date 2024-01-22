import Feature from '../Feature';

export default {
    stage: Feature.INIT,

    packages: ['hono', '@hono/node-server'],

    load_: async function (app, options, name) {
        options = server.featureConfig(
            options ?? {},
            {
                schema: {
                    trustProxy: { type: 'boolean', optional: true },
                    subdomainOffset: { type: 'integer', optional: true, post: [['~min', 2]] },
                    port: { type: 'integer', optional: true, default: 2331 },
                    keys: [
                        {
                            type: 'text',
                        },
                        {
                            type: 'array',
                            optional: true,
                            element: { type: 'text' },
                            post: [['~minLength', 1]],
                        },
                    ],
                },
            },
            name
        );

        const { hono: HonoEngine } = server.tryRequire('@kitmi/adapters');

        server.addMiddlewaresRegistry({
            
        });

        server.engine = new HonoEngine(server);
        await server.engine.init_(options);
    },
};
