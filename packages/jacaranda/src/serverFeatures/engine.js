import Feature from '../Feature';
import { isEmpty } from '@kitmi/utils';
import { tryLoadFrom_ } from '../helpers/loadModuleFrom_';

export default {
    stage: Feature.INIT,

    packages: (server, { type }) => {
        const Engine = server.requireModule(`@kitmi/adapters::${type}`);
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

        const Engine = await tryLoadFrom_(server, 'Engine adapter', {
            registry: {
                name: type,
                path: 'adapters',
            },
            runtime: {
                name: '@kitmi/adapters',
                namedExport: type,
            },
            direct: {
                name: '@kitmi/adapters',
                namedExport: type,
            },
        });

        server.engine = new Engine(server);
        if (!isEmpty(middlewares)) {
            server.once('before:Plugins', async () => {
                await server.useMiddlewares_(server.engine, middlewares);
            });
        }

        await server.engine.init_(_options);
    },
};
