import Feature from '../Feature';
import { isEmpty } from '@kitmi/utils';

export default function (server, options) {
    const { type, middlewares, ..._options } = options;
    const Engine = server.tryRequire('@kitmi/adapters')[type];

    return {
        stage: Feature.INIT,

        packages: Engine.packages,

        load_: async function (server) {
            server.engine = new Engine(server);
            if (!isEmpty(middlewares)) {
                server.once('before:Plugins', () => {                    
                    server.useMiddlewares_(server.engine, middlewares);
                });                
            }
            await server.engine.init_(_options);
        },
    };
}
