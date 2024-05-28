const defaultServerOpts = {
    configName: 'server',
    appModulesPath: 'apps',
    packageManager: 'bun',
    sourcePath: 'src',
};

export const defaultRoutableOpts = {
    traceMiddlewares: false,
    logMiddlewareRegistry: false,
    publicPath: 'public',
    controllersPath: 'actions'
};

export const defaultWebModuleOpts = {
    sourcePath: 'src',
};

export default defaultServerOpts;
