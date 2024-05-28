import Feature from '../Feature';
import { isEmpty } from '@kitmi/utils';

export default {
    stage: Feature.INIT,

    packages: (server, { type }) => {
        const Engine = server.tryRequire('@kitmi/adapters')[type];
        return Engine.packages;
    },

    load_: async function (server, options, name) {
        const { type, middlewares, ..._options } = server.featureConfig(
            options,
            {
                schema: {
                    type: { type: 'text' },
                    middlewares: [
                        { type: 'text', optional: true },
                        { type: 'array', optional: true },
                        { type: 'object', optional: true },
                    ],
                },
                keepUnsanitized: true,
            },
            name
        );

        const Engine = server.tryRequire('@kitmi/adapters')[type];

        server.engine = new Engine(server);
        if (!isEmpty(middlewares)) {
            server.once('before:Plugins', async () => {
                await server.useMiddlewares_(server.engine, middlewares);
            });
        }

        await server.engine.init_(_options);
    },
};
