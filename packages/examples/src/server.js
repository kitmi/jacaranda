import { serve } from '@kitmi/jacaranda';

const server = serve({
    configType: 'yaml',
    logLevel: 'verbose',
    logFeatures: true,
    logMiddlewareRegistry: true
});

export default server;
