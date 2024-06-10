const defaultServerOpts = {
    configName: 'server',
    appModulesPath: 'apps',
    packageManager: 'pnpm',
};

export const defaultRoutableOpts = {
    traceMiddlewares: false,
    logMiddlewareRegistry: false,
    publicPath: 'public',
    controllersPath: 'actions',
};

export default defaultServerOpts;
