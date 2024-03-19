import { serve } from '@kitmi/jacaranda';
import test from './apps/test';

const modulesRegistry = {
    test
};

const server = serve({
    configType: 'yaml',
    logLevel: 'verbose',
    logFeatures: true,
    logMiddlewareRegistry: true,
    modulesRegistry
});

export default server;
