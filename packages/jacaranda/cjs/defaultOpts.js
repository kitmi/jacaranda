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
    defaultRunnableOpts: function() {
        return defaultRunnableOpts;
    }
});
const defaultOpts = {
    configPath: 'conf',
    configName: 'app',
    configType: 'json',
    featuresPath: 'features',
    loadConfigFromOptions: false,
    disableEnvAwareConfig: false,
    allowedFeatures: undefined
};
const defaultRunnableOpts = {
    logger: undefined,
    logLevel: 'info',
    logFeatures: false,
    packageManager: 'bun',
    ignoreUncaught: false,
    exitOnUncaught: true,
    libModulesPath: 'libs'
};
const _default = defaultOpts;

//# sourceMappingURL=defaultOpts.js.map