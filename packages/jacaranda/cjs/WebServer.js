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
    createWebServer: function() {
        return createWebServer;
    },
    default: function() {
        return _default;
    }
});
const _nodepath = /*#__PURE__*/ _interop_require_default(require("node:path"));
const _utils = require("@kitmi/utils");
const _types = require("@kitmi/types");
const _Runnable = /*#__PURE__*/ _interop_require_default(require("./Runnable"));
const _Routable = /*#__PURE__*/ _interop_require_default(require("./Routable"));
const _ServiceContainer = /*#__PURE__*/ _interop_require_default(require("./ServiceContainer"));
const _defaultServerOpts = /*#__PURE__*/ _interop_require_default(require("./defaultServerOpts"));
const _middlewares = /*#__PURE__*/ _interop_require_wildcard(require("./middlewares"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
function createWebServer(Base) {
    /**
     * Web server class.
     * @class
     * @extends Routable(App)
     */ return class extends (0, _Routable.default)(Base) {
        async stop_() {
            let stopByThis = false;
            if (this.started) {
                stopByThis = true;
                if (this.appModules) {
                    await (0, _utils.batchAsync_)(this.appModules, (app)=>app.stop_());
                    delete this.appModules;
                    delete this.appModulesByAlias;
                }
            }
            if (stopByThis && this.httpServer) {
                await new Promise((resolve, reject)=>{
                    this.httpServer.close((err)=>{
                        if (err) return reject(err);
                        resolve();
                    });
                });
                delete this.httpServer;
                this.log('info', `The http service is stopped.`);
            }
            return super.stop_();
        }
        visitChildModules(vistor) {
            super.visitChildModules(vistor);
            if (this.appModules) {
                _utils._.each(this.appModules, vistor);
            }
        }
        getExports() {
            return this._stuffToExport;
        }
        /**
         * Mount an app at specified route.
         * @param {WebModule} app
         */ mountApp(app) {
            if (!this.appModules) {
                this.appModules = {};
                this.appModulesByAlias = {};
            }
            if (app.route in this.appModules) {
                throw new Error(`The route "${app.route}" is already mounted by another app.`);
            }
            this.engine.mount(app.route, app.router);
            this.appModules[app.route] = app;
            if (app.name in this.appModulesByAlias) {
                let existingApp = this.appModulesByAlias[app.name];
                //move bucket
                this.appModulesByAlias[`${existingApp.name}[@${existingApp.route}]`] = existingApp;
                delete this.appModulesByAlias[app.name];
                this.appModulesByAlias[`${app.name}[@${app.route}]`] = app;
            } else {
                this.appModulesByAlias[app.name] = app;
            }
            this.log('verbose', `All routes from app [${app.name}] are mounted under "${app.route}".`);
        }
        /**
         * Get the app module object by base route
         * @param {string} p - App module base route started with "/"
         */ getAppByRoute(p) {
            return this.appModules[p];
        }
        /**
         * Get the app module object by app alias, usually the app name if no duplicate entry
         * @param {string} a - App module alias
         */ getAppByAlias(a) {
            return this.appModulesByAlias[a];
        }
        /**
         * Get a registered service
         * @param {string} name
         *
         * @example
         *  // Get service from a lib module
         *  const service = app.getService('<lib name>/<service name>');
         *  // e.g const service = app.getService('data/mysql.mydb');
         *
         *  // Get service from a web app module
         *  const service = app.getService('<app name>:<service name>');
         *  // e.g const service = app.getService('admin:mysql.mydb');
         */ getService(name) {
            let pos = name.indexOf(':');
            if (pos === -1) {
                return super.getService(name);
            }
            let modAlias = name.substring(0, pos);
            name = name.substring(pos + 1);
            let app = this.getAppByAlias(modAlias);
            return app && app.getService(name, true);
        }
        _getFeatureFallbackPath() {
            let pathArray = super._getFeatureFallbackPath();
            pathArray.splice(1, 0, _nodepath.default.resolve(__dirname, 'serverFeatures'));
            return pathArray;
        }
        /**
         * @param {string} [name='server'] - The name of the server.
         * @param {object} [options] - The app module's extra options defined in its parent's configuration.
         * @property {object} [options.logger] - Logger options
         * @property {bool} [options.verbose=false] - Flag to output trivial information for diagnostics
         * @property {string} [options.workingPath] - App's working path, default to process.cwd()
         * @property {string} [options.configPath] - App's config path, default to "conf" under workingPath
         * @property {string} [options.configName] - App's config basename, default to "app"
         * @property {string} [options.sourcePath='server'] - Relative path of back-end server source files
         * @property {string} [options.appModulesPath=app_modules] - Relative path of child modules
         */ constructor(name, options){
            if (typeof options === 'undefined' && (0, _utils.isPlainObject)(name)) {
                options = name;
                name = undefined;
            }
            super(name || 'server', {
                ..._defaultServerOpts.default,
                ...options
            });
            /**
             * Hosting server.
             * @member {WebServer}
             **/ this.server = this;
            /**
             * Whether it is a server.
             * @member {boolean}
             **/ this.isServer = true;
            /**
             * App modules path.
             * @member {string}
             */ this.appModulesPath = this.toAbsolutePath(this.options.appModulesPath);
            /**
             * Base route.
             * @member {string}
             */ this.route = '/';
            // add built-in middlewares
            this.registry.middlewares = {
                ..._middlewares,
                ...this.registry.middlewares
            };
            this.once('after:Initial', ()=>{
                if (this.engine == null) {
                    throw new _types.InvalidConfiguration('Missing server engine feature, e.g. koa or hono.', this);
                }
            });
            process.once('SIGINT', ()=>{
                this.stop_().then(()=>{}).catch((error)=>console.error(error.message || error));
            });
        }
    };
}
const WebServer = createWebServer((0, _Runnable.default)(_ServiceContainer.default));
const _default = WebServer;

//# sourceMappingURL=WebServer.js.map