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
const _sys = require("@kitmi/sys");
const _glob = require("glob");
const _utils = require("@kitmi/utils");
const _types = require("@kitmi/types");
const _defaultServerOpts = require("./defaultServerOpts");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const Routable = (T)=>{
    class _class extends T {
        async start_() {
            /**
             * Middleware factory registry.
             * @member {object}
             */ this.middlewareFactoryRegistry = {};
            return super.start_();
        }
        async stop_() {
            delete this.middlewareFactoryRegistry;
            return super.stop_();
        }
        /**
         * Load and regsiter middleware files from a specified path.
         * @param dir
         */ loadMiddlewaresFrom(dir) {
            let files = (0, _glob.globSync)(_nodepath.default.join(dir, '**/*.{js,ts,mjs,cjs}'), {
                nodir: true
            });
            files.forEach((file)=>this.registerMiddlewareFactory(_utils.text.baseName(file), (0, _utils.esmCheck)(require(file))));
        }
        /**
         * Register the factory method of a named middleware.
         * @param {string} name - The name of the middleware
         * @param {function} factoryMethod - The factory method of a middleware
         */ registerMiddlewareFactory(name, factoryMethod) {
            if (typeof factoryMethod !== 'function') {
                if (factoryMethod.__esModule && typeof factoryMethod.default === 'function') {
                    factoryMethod = factoryMethod.default;
                } else {
                    throw new _types.InvalidArgument('Invalid middleware factory: ' + name);
                }
            }
            if (name in this.middlewareFactoryRegistry) {
                throw new _types.ApplicationError('Middleware "' + name + '" already registered!');
            }
            this.middlewareFactoryRegistry[name] = factoryMethod;
            this.log('verbose', `Registered named middleware [${name}].`);
        }
        /**
         * Get the factory method of a middleware from module hierarchy.
         * @param name
         * @returns {function}
         */ getMiddlewareFactory(name) {
            const factory = this.middlewareFactoryRegistry[name];
            if (factory != null) {
                return factory;
            }
            if (this.server && !this.isServer) {
                return this.server.getMiddlewareFactory(name);
            }
            let npmMiddleware = this.tryRequire(name);
            if (npmMiddleware) {
                return npmMiddleware;
            }
            throw new _types.ApplicationError(`Don't know where to load middleware "${name}".`);
        }
        /**
         * Use middlewares by creating middleware instances (asynchronously) from factory methods and attach them to a router.
         * @param {Router} router
         * @param {*} middlewares - Can be an array of middleware entries or a key-value list of registerred middlewares
         * @returns {Routable}
         */ async useMiddlewares_(router, middlewares) {
            let middlewareFactory, middleware;
            let middlewareFunctions = [];
            if ((0, _utils.isPlainObject)(middlewares)) {
                await (0, _utils.eachAsync_)(middlewares, async (options, name)=>{
                    middlewareFactory = this.getMiddlewareFactory(name);
                    middleware = await middlewareFactory(options, this);
                    middlewareFunctions.push({
                        name,
                        middleware
                    });
                });
            } else {
                middlewares = _utils._.castArray(middlewares);
                await (0, _utils.eachAsync_)(middlewares, async (middlewareEntry)=>{
                    let type = typeof middlewareEntry;
                    if (type === 'string') {
                        // [ 'namedMiddleware' ]
                        middlewareFactory = this.getMiddlewareFactory(middlewareEntry);
                        middleware = await middlewareFactory(undefined, this);
                        middlewareFunctions.push({
                            name: middlewareEntry,
                            middleware
                        });
                    } else if (type === 'function') {
                        middlewareFunctions.push({
                            name: middlewareEntry.name || 'unamed middleware',
                            middleware: middlewareEntry
                        });
                    } else if (Array.isArray(middlewareEntry)) {
                        // [ [ 'namedMiddleware', config ] ]
                        if (middlewareEntry.length === 0) {
                            throw new _types.InvalidConfiguration('Empty array found as middleware entry!', this, 'middlewares');
                        }
                        middlewareFactory = this.getMiddlewareFactory(middlewareEntry[0]);
                        middleware = await middlewareFactory(middlewareEntry.length > 1 ? middlewareEntry[1] : null, this);
                        middlewareFunctions.push({
                            name: middlewareEntry[0],
                            middleware
                        });
                    } else {
                        if (!(0, _utils.isPlainObject)(middlewareEntry) || !('name' in middlewareEntry)) {
                            throw new _types.InvalidConfiguration('Invalid middleware entry!', this, 'middlewares');
                        }
                        middlewareFactory = this.getMiddlewareFactory(middlewareEntry.name);
                        middleware = await middlewareFactory(middlewareEntry.options, this);
                        middlewareFunctions.push({
                            name: middlewareEntry.name,
                            middleware
                        });
                    }
                });
            }
            middlewareFunctions.forEach(({ name, middleware })=>{
                if (Array.isArray(middleware)) {
                    middleware.forEach((m)=>this.useMiddleware(router, m, name));
                } else {
                    this.useMiddleware(router, middleware, name);
                }
            });
            return this;
        }
        /**
         * Add a route to a router, skipped while the server running in deaf mode.
         * @param router
         * @param method
         * @param route
         * @param actions
         */ async addRoute_(router, method, route, actions) {
            let handlers = [], middlewareFactory;
            if ((0, _utils.isPlainObject)(actions)) {
                await (0, _utils.eachAsync_)(actions, async (options, name)=>{
                    middlewareFactory = this.getMiddlewareFactory(name);
                    handlers.push(this._wrapMiddlewareTracer(await middlewareFactory(options, this), name));
                });
            } else {
                actions = _utils._.castArray(actions);
                let lastIndex = actions.length - 1;
                await (0, _utils.eachAsync_)(actions, async (action, i)=>{
                    let type = typeof action;
                    if (i === lastIndex) {
                        // last middleware may be an action
                        if (type === 'string' && action.lastIndexOf('.') > 0) {
                            action = {
                                name: 'action',
                                options: action
                            };
                            type = 'object';
                        }
                    }
                    if (type === 'string') {
                        // [ 'namedMiddleware' ]
                        middlewareFactory = this.getMiddlewareFactory(action);
                        let middleware = await middlewareFactory(null, this);
                        //in case it's register by the middlewareFactory feature
                        if (Array.isArray(middleware)) {
                            middleware.forEach((middlewareItem, i)=>handlers.push(this._wrapMiddlewareTracer(middlewareItem, `${action}-${i}` + (middleware.name ? '-' + middleware.name : ''))));
                        } else {
                            handlers.push(this._wrapMiddlewareTracer(middleware, action));
                        }
                    } else if (type === 'function') {
                        handlers.push(this._wrapMiddlewareTracer(action));
                    } else if (Array.isArray(action)) {
                        if (action.length === 0 || action.length > 2) {
                            throw new _types.InvalidConfiguration('Invalid middleware entry!', this, 'middlewares');
                        }
                        middlewareFactory = this.getMiddlewareFactory(action[0]);
                        handlers.push(this._wrapMiddlewareTracer(await middlewareFactory(action.length > 1 ? action[1] : undefined, this)));
                    } else {
                        if (typeof action !== 'object' || !('name' in action)) {
                            throw new _types.InvalidConfiguration('Invalid middleware entry!', this, 'middlewares');
                        }
                        middlewareFactory = this.getMiddlewareFactory(action.name);
                        handlers.push(this._wrapMiddlewareTracer(await middlewareFactory(action.options, this), action.name));
                    }
                });
            }
            router[method](route, ...handlers);
            let endpoint = router.opts.prefix ? _utils.url.join(this.route, router.opts.prefix, route) : _utils.url.join(this.route, route);
            this.log('verbose', `Route "${method}:${endpoint}" is added from module [${this.name}].`);
            return this;
        }
        requireFeatures(features, middleware) {
            const hasNotEnabled = _utils._.find(_utils._.castArray(features), (feature)=>!this.enabled(feature));
            if (hasNotEnabled) {
                throw new _types.InvalidConfiguration(`Middleware "${middleware}" requires "${hasNotEnabled}" feature to be enabled.`, this, `middlewares.${middleware}`);
            }
        }
        requireServices(services, middleware) {
            const notRegisterred = _utils._.find(_utils._.castArray(services), (service)=>!this.hasService(service));
            if (notRegisterred) {
                throw new _types.InvalidConfiguration(`Middleware "${middleware}" requires "${notRegisterred}" service to be registerred.`, this, `middlewares.${middleware}`);
            }
        }
        /**
         * Attach a router to this app module, skipped while the server running in deaf mode
         * @param {Router} nestedRouter
         */ addRouter(nestedRouter, baseRoute) {
            this.router.attach(nestedRouter, baseRoute);
            return this;
        }
        /**
         * Translate a relative path and query parameters if any to a url path
         * @param {string} relativePath - Relative path
         * @param {...*} [pathOrQuery] - Queries
         * @returns {string}
         */ toWebPath(relativePath, ...pathOrQuery) {
            let url, query;
            if (pathOrQuery && pathOrQuery.length > 0 && (pathOrQuery.length > 1 || pathOrQuery[0] !== undefined)) {
                if (_utils._.isObject(pathOrQuery[pathOrQuery.length - 1])) {
                    query = pathOrQuery.pop();
                }
                pathOrQuery.unshift(relativePath);
                url = _utils.url.join(this.route, ...pathOrQuery);
            } else {
                url = _utils.url.join(this.route, relativePath);
            }
            url = _utils.text.ensureStartsWith(url, '/');
            if (query) {
                url = _utils.url.appendQuery(url, query);
                url = url.replace('/?', '?');
            }
            return url;
        }
        /**
         * Attach a middleware to a router.
         * @param {Router} router - The router to attach the middleware
         * @param {function} middleware - (ctx, next) => ()
         * @param {String} name - The name of the middleware
         */ useMiddleware(router, middleware, name) {
            if (typeof middleware !== 'function') {
                throw new _types.InvalidArgument('Invalid middleware.', {
                    name,
                    middleware
                });
            }
            router.use(this._wrapMiddlewareTracer(middleware, name));
            this.log('verbose', `Attached middleware [${name}].`);
        }
        middlewareConfig(config, typeInfo, name) {
            return this.sanitize(config, typeInfo, name, 'middlewares');
        }
        _wrapMiddlewareTracer(middleware, name) {
            if (this.options.traceMiddlewares) {
                return async (ctx, next)=>{
                    this.log('debug', `Step in middleware "${name || middleware.name}" ...`);
                    let ret = await middleware(ctx, next);
                    this.log('debug', `Step out from middleware "${name || middleware.name}".`);
                    return ret;
                };
            }
            return middleware;
        }
        _createEngine() {
            let Engine = this.server.engineType;
            if (Engine == null) {
                throw new _types.ApplicationError('At least one http server engine feature (e.g. koa or hono) should be enabled!');
            }
            return new Engine();
        }
        _getFeatureFallbackPath() {
            let pathArray = super._getFeatureFallbackPath();
            pathArray.splice(1, 0, _nodepath.default.resolve(__dirname, 'webFeatures'));
            return pathArray;
        }
        /**
         * @param {string} name - The name of the routable instance.
         * @param {object} [options] - Routable options
         * @property {string} [options.backendPath='server'] - Relative path of back-end server source files
         * @property {string} [options.clientPath='client'] - Relative path of front-end client source files
         * @property {string} [options.publicPath='public'] - Relative path of front-end static files
         */ constructor(name, options){
            super(name, {
                ..._defaultServerOpts.defaultRoutableOpts,
                ...options
            });
            /**
             * Frontend static files path.
             * @member {string}
             **/ this.publicPath = this.toAbsolutePath(this.options.publicPath);
            this.controllersPath = _nodepath.default.resolve(this.sourcePath, this.options.controllersPath);
            this.middlewaresPath = _nodepath.default.resolve(this.sourcePath, this.options.middlewaresPath);
            this.routable = true;
            this.on('configLoaded', ()=>{
                //load middlewares if exists in server or app path
                if (_sys.fs.pathExistsSync(this.middlewaresPath) && (0, _sys.isDir)(this.middlewaresPath)) {
                    this.loadMiddlewaresFrom(this.middlewaresPath);
                }
            });
        }
    }
    return _class;
};
const _default = Routable;

//# sourceMappingURL=Routable.js.map