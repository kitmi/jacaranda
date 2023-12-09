const defaultServerOpts = {
    configName: 'server',
    appModulesPath: 'apps',
    packageManager: 'bun',
    sourcePath: 'src',
};

export const defaultRoutableOpts = {
    engine: 'koa',
    traceMiddlewares: false,
    logMiddlewareRegistry: false,
    publicPath: 'public',
    controllersPath: 'actions',
    middlewaresPath: 'middlewares',
};

export const defaultWebModuleOpts = {
    sourcePath: 'src',
};

export default defaultServerOpts;
