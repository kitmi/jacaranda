import install from '@kitmi/jacaranda/serverInstall';
import test from './apps/test';

const modulesRegistry = {
    test
};

install({
    logLevel: 'verbose',
    logFeatures: true,
    logMiddlewareRegistry: true,
    registry: {
        apps: modulesRegistry
    }
});
