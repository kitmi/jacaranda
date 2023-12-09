"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return _default;
    }
});
const _nodepath = /*#__PURE__*/ _interop_require_default(require("node:path"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const ModuleBase = (Base)=>{
    class _class extends Base {
        /**
         * Get a service from module hierarchy
         * @param name
         * @returns {object}
         */ getService(name, currentModuleOnly) {
            return super.getService(name) || !currentModuleOnly && this.host.getService(name);
        }
        /**
         * Check whether a service exists
         * @param {*} name
         * @returns {boolean}
         */ hasService(name, currentModuleOnly) {
            return super.hasService(name) || !currentModuleOnly && this.host.hasService(name);
        }
        /**
         * Check whether a feature is enabled in the app or its hosting server.
         * @param {string} feature
         * @returns {bool}
         */ enabled(feature, currentModuleOnly) {
            return super.enabled(feature) || !currentModuleOnly && this.host.enabled(feature);
        }
        /**
         * Require a js module from backend path
         * @param {*} relativePath
         */ require(relativePath) {
            let modPath = _nodepath.default.join(this.sourcePath, relativePath);
            return require(modPath);
        }
        /**
         * Require a module from the source path of a library module
         * @param {*} relativePath
         */ requireFromLib(libName, relativePath) {
            return this.host.requireFromLib(libName, relativePath);
        }
        /**
         * @param {Runnable} hostApp
         * @param {string} name - The name of the app module.
         * @param {string} route - The base route of the app module.
         * @param {string} appPath - The path to load the app's module files
         * @param {object} [options] - The app module's extra options defined in its parent's configuration.
         */ constructor(hostApp, name, appPath, options){
            super(name, {
                workingPath: appPath,
                configPath: _nodepath.default.join(appPath, 'conf'),
                sourcePath: './',
                ...options
            });
            /**
             * Hosting app.
             * @member {Runnable}
             **/ this.host = hostApp;
            /**
             * Whether it is a server.
             * @member {boolean}
             **/ this.isServer = false;
            this.featuresPath = _nodepath.default.resolve(this.sourcePath, this.options.featuresPath);
            this.logger = this.host.logger.child({
                module: this.name
            }, {
                level: this.options.logLevel
            });
            this.log = this._loggerLog;
        }
    }
    return _class;
};
const _default = ModuleBase;

//# sourceMappingURL=ModuleBase.js.map