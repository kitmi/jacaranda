"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    default: function() {
        return _default;
    },
    defaultAppOpts: function() {
        return defaultAppOpts;
    }
});
const defaultOpts = {
    env: process.env.NODE_ENV || 'development',
    configPath: 'conf',
    configName: 'app',
    configType: 'json',
    featuresPath: 'features',
    loadConfigFromOptions: false,
    disableEnvAwareConfig: false,
    allowedFeatures: undefined
};
const defaultAppOpts = {
    logger: undefined,
    logLevel: 'info',
    packageManager: 'bun',
    ignoreUncaught: false,
    exitOnUncaught: true,
    libModulesPath: 'libs'
};
const _default = defaultOpts;

//# sourceMappingURL=defaultOpts.js.map