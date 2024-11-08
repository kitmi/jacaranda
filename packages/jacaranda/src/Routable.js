import path from 'node:path';
import { _, url as urlUtil, text, isPlainObject, eachAsync_ } from '@kitmi/utils';
import { ApplicationError, InvalidConfiguration, InvalidArgument } from '@kitmi/types';
import { defaultRoutableOpts } from './defaultServerOpts';
import { tryLoadFrom_ } from './helpers/loadModuleFrom_';

const Routable = (T) =>
    class extends T {
        /**
         * @param {string} name - The name of the routable instance.
         * @param {object} [options] - Routable options
         * @property {string} [options.controllersPath='actions'] - Relative path of controller source files
         * @property {string} [options.publicPath='public'] - Relative path of front-end static files
         */
        constructor(name, options) {
            super(name, { ...defaultRoutableOpts, ...options });

            /**
             * Frontend static files path.
             * @member {string}
             **/
            this.publicPath = this.toAbsolutePath(this.options.publicPath);

            this.controllersPath = path.resolve(this.sourcePath, this.options.controllersPath);

            this.routable = true;
        }

        async start_() {
            /**
             * Middleware factory registry.
             * @member {object}
             */
            this._middlewareFactories = {};

            await super.start_();

            if (
                this.options.logMiddlewareRegistry &&
                (this.options.logLevel === 'verbose' || this.options.logLevel === 'debug')
            ) {
                this.log('verbose', 'Registered middlewares:', {
                    middlewares: this.registry.middlewares ? Object.keys(this.registry.middlewares) : [],
                });
            }

            return this;
        }

        async stop_() {
            delete this._middlewareFactories;

            return super.stop_();
        }

        /**
         * Register the factory method of a named middleware.
         * @param {string} name - The name of the middleware
         * @param {function} factoryMethod - The factory method of a middleware
         */
        registerMiddlewareFactory(name, factoryMethod) {
            if (typeof factoryMethod !== 'function') {
                if (factoryMethod.__esModule && typeof factoryMethod.default === 'function') {
                    factoryMethod = factoryMethod.default;
                } else {
                    throw new InvalidArgument('Invalid middleware factory: ' + name);
                }
            }

            if (name in this._middlewareFactories) {
                throw new ApplicationError('Middleware "' + name + '" already registered!');
            }

            this._middlewareFactories[name] = factoryMethod;
            this.log('verbose', `Registered named middleware [${name}].`);
        }

        /**
         * Get the factory method of a middleware from module hierarchy.
         * @param name
         * @returns {Promise.<function>}
         */
        async getMiddlewareFactory_(name) {
            const factory = this._middlewareFactories[name];
            if (factory != null) {
                return factory;
            }

            const registryEntry = await tryLoadFrom_(
                this,
                'Middleware',
                {
                    registry: {
                        name,
                        path: 'middlewares',
                    },
                    project: {
                        name,
                        path: path.join(this.sourcePath, 'middlewares'),
                    },
                },
                true /* no throw */
            );

            if (registryEntry != null) {
                this._middlewareFactories[name] = registryEntry;
                return registryEntry;
            }

            if (this.server && !this.isServer) {
                return this.server.getMiddlewareFactory_(name);
            }

            throw new ApplicationError(`Middleware "${name}" not found in middleware registry.`);
        }

        /**
         * Use middlewares by creating middleware instances (asynchronously) from factory methods and attach them to a router.
         * @param {Router} router
         * @param {*} middlewares - Can be an array of middleware entries or a key-value list of registerred middlewares
         * @returns {Routable}
         */
        async useMiddlewares_(router, middlewares) {
            let middlewareFactory, middleware;
            let middlewareFunctions = [];

            if (isPlainObject(middlewares)) {
                await eachAsync_(middlewares, async (options, name) => {
                    middlewareFactory = await this.getMiddlewareFactory_(name);
                    middleware = await middlewareFactory(options, this);
                    middlewareFunctions.push({ name, middleware });
                });
            } else {
                middlewares = _.castArray(middlewares);

                await eachAsync_(middlewares, async (middlewareEntry) => {
                    let type = typeof middlewareEntry;

                    if (type === 'string') {
                        // [ 'namedMiddleware' ]
                        middlewareFactory = await this.getMiddlewareFactory_(middlewareEntry);
                        middleware = await middlewareFactory(undefined, this);
                        middlewareFunctions.push({ name: middlewareEntry, middleware });
                    } else if (type === 'function') {
                        middlewareFunctions.push({
                            name: middlewareEntry.name || 'unamed middleware',
                            middleware: middlewareEntry,
                        });
                    } else if (Array.isArray(middlewareEntry)) {
                        // [ [ 'namedMiddleware', config ] ]
                        if (middlewareEntry.length === 0) {
                            throw new InvalidConfiguration(
                                'Empty array found as middleware entry!',
                                this,
                                'middlewares'
                            );
                        }

                        middlewareFactory = await this.getMiddlewareFactory_(middlewareEntry[0]);
                        middleware = await middlewareFactory(
                            middlewareEntry.length > 1 ? middlewareEntry[1] : null,
                            this
                        );
                        middlewareFunctions.push({ name: middlewareEntry[0], middleware });
                    } else {
                        if (!isPlainObject(middlewareEntry) || !('name' in middlewareEntry)) {
                            throw new InvalidConfiguration('Invalid middleware entry!', this, 'middlewares');
                        }

                        middlewareFactory = await this.getMiddlewareFactory_(middlewareEntry.name);
                        middleware = await middlewareFactory(middlewareEntry.options, this);
                        middlewareFunctions.push({ name: middlewareEntry.name, middleware });
                    }
                });
            }

            middlewareFunctions.forEach(({ name, middleware }) => {
                if (Array.isArray(middleware)) {
                    middleware.forEach((m) => this.useMiddleware(router, m, name));
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
         */
        async addRoute_(router, method, route, actions) {
            let handlers = [],
                middlewareFactory;

            if (isPlainObject(actions)) {
                await eachAsync_(actions, async (options, name) => {
                    middlewareFactory = await this.getMiddlewareFactory_(name);
                    handlers.push(this._wrapMiddlewareTracer(await middlewareFactory(options, this), name));
                });
            } else {
                actions = _.castArray(actions);
                let lastIndex = actions.length - 1;

                await eachAsync_(actions, async (action, i) => {
                    let type = typeof action;

                    if (i === lastIndex) {
                        // last middleware may be an action
                        if (type === 'string' && action.lastIndexOf('.') > 0) {
                            action = {
                                name: 'action',
                                options: action,
                            };

                            type = 'object';
                        }
                    }

                    if (type === 'string') {
                        // [ 'namedMiddleware' ]
                        middlewareFactory = await this.getMiddlewareFactory_(action);

                        let middleware = await middlewareFactory(null, this);

                        //in case it's register by the middlewareFactory feature
                        if (Array.isArray(middleware)) {
                            middleware.forEach((middlewareItem, i) =>
                                handlers.push(
                                    this._wrapMiddlewareTracer(
                                        middlewareItem,
                                        `${action}-${i}` + (middleware.name ? '-' + middleware.name : '')
                                    )
                                )
                            );
                        } else {
                            handlers.push(this._wrapMiddlewareTracer(middleware, action));
                        }
                    } else if (type === 'function') {
                        handlers.push(this._wrapMiddlewareTracer(action));
                    } else if (Array.isArray(action)) {
                        if (action.length === 0 || action.length > 2) {
                            throw new InvalidConfiguration('Invalid middleware entry!', this, 'middlewares');
                        }

                        middlewareFactory = await this.getMiddlewareFactory_(action[0]);
                        handlers.push(
                            this._wrapMiddlewareTracer(
                                await middlewareFactory(action.length > 1 ? action[1] : undefined, this)
                            )
                        );
                    } else {
                        if (typeof action !== 'object' || !('name' in action)) {
                            throw new InvalidConfiguration('Invalid middleware entry!', this, 'middlewares');
                        }

                        middlewareFactory = await this.getMiddlewareFactory_(action.name);
                        handlers.push(
                            this._wrapMiddlewareTracer(await middlewareFactory(action.options, this), action.name)
                        );
                    }
                });
            }

            router[method](route, ...handlers);

            let endpoint = text.dropIfEndsWith(router.opts.prefix
                ? urlUtil.join(this.route, router.opts.prefix, route)
                : urlUtil.join(this.route, route), '/');

            this.log('verbose', `Route "${method}:${endpoint}" is added from app [${this.name}].`);

            return this;
        }

        requireFeatures(features, middleware) {
            const hasNotEnabled = _.find(_.castArray(features), (feature) => !this.enabled(feature));

            if (hasNotEnabled) {
                throw new InvalidConfiguration(
                    `Middleware "${middleware}" requires "${hasNotEnabled}" feature to be enabled.`,
                    this,
                    `middlewares.${middleware}`
                );
            }
        }

        /**
         * Attach a router to this app module, skipped while the server running in deaf mode
         * @param {Router} nestedRouter
         */
        addRouter(nestedRouter, baseRoute) {
            if (this.router == null) {
                // if mount to server level
                this.createServerModuleRouter();
            }

            this.router.attach(nestedRouter, baseRoute);
            return this;
        }

        createServerModuleRouter() {
            if (!this.isServer) {
                throw new ApplicationError('Only the server instance can create a server module router.');
            }

            this.router = this.engine.createModuleRouter(this);
            this.engine.mount('/', this.router);
        }

        /**
         * Translate a relative path and query parameters if any to a url path
         * @param {string} relativePath - Relative path
         * @param {...*} [pathOrQuery] - Queries
         * @returns {string}
         */
        toWebPath(relativePath, ...pathOrQuery) {
            let url, query;

            if (pathOrQuery && pathOrQuery.length > 0 && (pathOrQuery.length > 1 || pathOrQuery[0] !== undefined)) {
                if (_.isObject(pathOrQuery[pathOrQuery.length - 1])) {
                    query = pathOrQuery.pop();
                }
                pathOrQuery.unshift(relativePath);
                url = urlUtil.join(this.route, ...pathOrQuery);
            } else {
                url = urlUtil.join(this.route, relativePath);
            }

            url = text.ensureStartsWith(url, '/');

            if (query) {
                url = urlUtil.appendQuery(url, query);
                url = url.replace('/?', '?');
            }

            return url;
        }

        /**
         * Attach a middleware to a router.
         * @param {Router} router - The router to attach the middleware
         * @param {function} middleware - (ctx, next) => ()
         * @param {String} name - The name of the middleware
         */
        useMiddleware(router, middleware, name) {
            if (typeof middleware !== 'function') {
                throw new InvalidArgument('Invalid middleware.', { name, middleware });
            }

            router.use(this._wrapMiddlewareTracer(middleware, name));
            this.log('verbose', `Attached middleware [${name}].`);
        }

        middlewareConfig(config, typeInfo, name) {
            return this.sanitize(config, typeInfo, name, 'middlewares');
        }

        _wrapMiddlewareTracer(middleware, name) {
            if (this.options.traceMiddlewares) {
                return async (ctx, next) => {
                    this.log('debug', `Step in middleware "${name || middleware.name}" ...`);
                    let ret = await middleware(ctx, next);
                    this.log('debug', `Step out from middleware "${name || middleware.name}".`);
                    return ret;
                };
            }

            return middleware;
        }

        _getFeatureFallbackPath() {
            let pathArray = super._getFeatureFallbackPath();
            pathArray.splice(1, 0, path.resolve(__dirname, 'webFeatures'));

            return pathArray;
        }
    };

export default Routable;
