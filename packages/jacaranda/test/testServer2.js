import { serve } from '../src';

import mc from './middlewares/mc';

import * as middlewares from '@kitmi/middlewares';
import * as actions from './controllers/actions';

middlewares.mc = mc;

const server = serve({
    configName: 'server2',
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
        },
    },
});

export default server;
