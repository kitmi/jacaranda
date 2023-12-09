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
    defaultRoutableOpts: function() {
        return defaultRoutableOpts;
    },
    defaultWebModuleOpts: function() {
        return defaultWebModuleOpts;
    }
});
const defaultServerOpts = {
    configName: 'server',
    appModulesPath: 'apps',
    packageManager: 'bun',
    sourcePath: 'src'
};
const defaultRoutableOpts = {
    engine: 'koa',
    traceMiddlewares: false,
    logMiddlewareRegistry: false,
    publicPath: 'public',
    controllersPath: 'actions',
    middlewaresPath: 'middlewares'
};
const defaultWebModuleOpts = {
    sourcePath: 'src'
};
const _default = defaultServerOpts;

//# sourceMappingURL=defaultServerOpts.js.map