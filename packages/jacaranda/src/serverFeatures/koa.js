import Feature from '../Feature';

export default {
    stage: Feature.INIT,

    packages: ['koa', 'koa-mount', '@koa/router'],

    load_: async function (server, options, name) {
        options = server.featureConfig(
            options ?? {},
            {
                schema: {
                    subdomainOffset: { type: 'integer', optional: true, mod: [['~min', 2]] },
                    httpPort: { type: 'integer', optional: true, default: 2331 },
                    keys: [{
                        type: 'text'
                    },{
                        type: 'array',
                        optional: true,
                        elementSchema: { type: 'text' },
                        mod: [['~minLength', 1]],
                    }]
                }
            },
            name
        );

        const { koa: KoaEngine } = app.tryRequire('@kitmi/adapters');

        server.engine = new KoaEngine(server);
        await server.engine.init_(options);      
    },
};
