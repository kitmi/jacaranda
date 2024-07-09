import { serve, runtime } from '../src';

import * as middlewares from '@kitmi/middlewares';
import * as actions from './controllers/actions';
import * as modules from './controllers/modules';
import * as resources from './controllers/resources';
import * as restful from './controllers/restful';

// runtime.loadModule('wj-api-sso', apiModule);
// runtime.loadModule('cdm', libCdm);

const server = serve({
    configPath: './test/conf',
    configType: 'yaml',
    logLevel: 'verbose',
    logFeatures: true,
    logMiddlewareRegistry: true,
    sourcePath: './test',

    registry: {
        middlewares,
        features: {},
        controllers: {
            actions,
            modules,
            resources,
            restful,
        },
    },
});

export default server;
