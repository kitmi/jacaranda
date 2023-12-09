const defaultOpts = {
    env: process.env.NODE_ENV || 'development',
    configPath: 'conf',
    configName: 'app',
    configType: 'json',
    featuresPath: 'features',
    loadConfigFromOptions: false,
    disableEnvAwareConfig: false,
    allowedFeatures: undefined, // whitelist
};

export const defaultRunnableOpts = {
    logger: undefined,
    logLevel: 'info',
    logFeatures: false,
    packageManager: 'bun',
    ignoreUncaught: false,
    exitOnUncaught: true,
    libModulesPath: 'libs',
};

export default defaultOpts;
