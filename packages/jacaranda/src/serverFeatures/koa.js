import Feature from '../Feature';

export default {
    stage: Feature.INIT,

    packages: ['koa', 'koa-mount', '@koa/router', 'koa-body', 'koa-compress', 'koa-etag', 'koa-static'],

    load_: async function (server, options, name) {
        options = server.featureConfig(
            options ?? {},
            {
                schema: {
                    trustProxy: { type: 'boolean', optional: true },
                    subdomainOffset: { type: 'integer', optional: true, mod: [['~min', 2]] },
                    port: { type: 'integer', optional: true, default: 2331 },
                    keys: [
                        {
                            type: 'text',
                        },
                        {
                            type: 'array',
                            optional: true,
                            elementSchema: { type: 'text' },
                            mod: [['~minLength', 1]],
                        },
                    ],
                },
            },
            name
        );

        const { koa: KoaEngine } = server.tryRequire('@kitmi/adapters');

        server.addMiddlewaresRegistry({
            'koa-body': 'koa-body',
            'koa-compress': 'koa-compress',
            'koa-etag': 'koa-etag',
        });

        server.engine = new KoaEngine(server);
        await server.engine.init_(options);
    },
};
