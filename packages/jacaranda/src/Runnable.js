import { _, sleep_, batchAsync_ } from '@kitmi/utils';
import { InvalidConfiguration } from '@kitmi/types';
import { defaultRunnableOpts } from './defaultOpts';
import { fs, isDir_ } from '@kitmi/sys';
import path from 'node:path';
import minimist from 'minimist';

/**
 * Runnable app mixin.
 * @param {object} T - Base class.
 * @returns {Runnable} A runable app class.
 * @constructs Runnable(T)
 */
const Runnable = (T) =>
    class extends T {
        _getOnUncaughtException = (exitOnError) => (err) => {
            if (exitOnError) {
                //wait 1 second for flushing the last log
                this.log('error', err);
            } else {
                this.logError(err);
            }
        };

        _onWarning = (warning) => {
            this.log('warn', warning.message);
        };

        _onExit = (code) => {
            if (this.started) {
                if (this._logCache.length) {
                    this.flushLogCache();
                }
            }

            this.stop_().catch(this.logError);
        };

        /**
         * @param {string} name - The name of the application.
         * @param {object} [options] - Application options
         * @property {string} [options.logLevel='info'] - Logging level
         * @property {object} [options.ignoreUncaught=false] - Whether to skip the handling of uncaught exception
         * @property {object} [options.exitOnUncaught=true] - Whether to exit process on uncaught exception thrown
         * @property {object} [options.logFeatures=false] - Log enabled features
         * @property {object} [options.logConfig=false] - Log finalized config
         * @constructs Runnable
         */
        constructor(name, options) {
            if (process.argv.length > 2) {
                const { _, ...cliOptions } = minimist(process.argv.slice(2));
                options = { ...cliOptions, ...options };
            }

            super(name, {
                ...defaultRunnableOpts,
                ...options,
            });

            this.runnable = true;
            this.libModulesPath = this.toAbsolutePath(this.options.libModulesPath);
        }

        /**
         * Start the app
         * @returns {Promise}
         * @memberof Runnable
         */
        async start_() {
            if (this.started) {
                throw new Error('App already started.');
            }

            this._initialize();

            process.on('exit', this._onExit);

            await super.start_();

            if (
                this.options.logFeatures &&
                (this.options.logLevel === 'verbose' || this.options.logLevel === 'debug')
            ) {
                const childModules = {};
                this.visitChildModules((childModule, name) => {
                    childModules[name] = {
                        features: Object.keys(childModule.features),
                        services: Object.keys(childModule.services),
                    };
                });

                this.log('verbose', 'Enabled features & services:', {
                    features: Object.keys(this.features),
                    services: Object.keys(this.services),
                    modules: childModules,
                });
            }

            return this;
        }

        /**
         * Stop the app
         * @returns {Promise}
         * @memberof Runnable
         */
        async stop_() {
            let stopByThis = false;

            if (this.started) {
                stopByThis = true;

                if (this.libModules) {
                    await batchAsync_(this.libModules, (lib) => lib.stop_());
                    delete this.libModules;
                }
            }

            process.removeListener('exit', this._onExit);

            await super.stop_();

            await sleep_(0);

            if (stopByThis) {
                this._uninitialize();
            }
        }

        /**
         * Visit child modules
         * @param {function} vistor
         */
        visitChildModules(vistor) {
            if (this.libModules) {
                _.each(this.libModules, vistor);
            }
        }

        /**
         * Try to load a module.
         * @param {object} config
         * @param {string} name
         * @param {string} fromFeature
         * @returns {object} { appPath, moduleMeta }
         */
        async tryLoadModule_(config, name, defaultBasePath, configItemName) {
            let appPath;
            let moduleMeta;

            if (config.npmModule || config.source === 'runtime') {
                moduleMeta = await this.requireModule(name);
                appPath = moduleMeta.appPath;
            } else if (config.source === 'registry') {
                moduleMeta = this.registry.modules?.[name];
                if (moduleMeta == null) {
                    throw new InvalidConfiguration(`Module [${name}] not found in registry.`, app, configItemName);
                }                
                appPath = moduleMeta.appPath;
            } else if (config.source === 'npm') {
                if (!config.packageName) {
                    throw new InvalidConfiguration(`Missing "packageName" for npm module [${name}].`, app, configItemName);
                }

                moduleMeta = await this.tryRequire_(config.packageName, true);
                appPath = moduleMeta.appPath;            
            } else {
                appPath = path.join(defaultBasePath, name);
            }

            let exists = (await fs.pathExists(appPath)) && (await isDir_(appPath));
            if (!exists) {
                throw new InvalidConfiguration(`Module [${name}] not found at "${appPath}".`, app, configItemName);
            }
            return { appPath, moduleMeta };
        }

        /**
         * Get the lib module
         * @param {string} libName
         * @memberof Runnable
         */
        getLib(libName) {
            if (!this.libModules) {
                throw new Error('"libs" feature is required to access lib among modules.');
            }

            let libModule = this.libModules[libName];

            if (!libModule) {
                throw new Error(`Lib module [${libName}] not found.`);
            }

            return libModule;
        }

        /**
         * Register a loaded lib module
         * @param {LibModule} lib
         * @memberof Runnable
         */
        registerLib(lib) {
            if (!this.libModules) {
                this.libModules = {};
            }

            if (lib.name in this.libModules) {
                throw new InvalidConfiguration(`Lib module [${lib.name}] already exists.`, this, {
                    name: lib.name,
                });
            }

            this.libModules[lib.name] = lib;
        }

        /**
         * Get a registered service
         * @param {string} name
         *
         * @example
         *  // Get service from a lib module
         *  const service = app.getService('<lib name>/<service name>');
         *  // e.g const service = app.getService('data/mysql.mydb');
         * @memberof Runnable
         */
        getService(name) {
            let pos = name.indexOf('/');
            if (pos === -1) {
                return super.getService(name);
            }

            let lib = name.substring(0, pos);
            name = name.substring(pos + 1);

            let app = this.getLib(lib);
            return app?.getService(name, true);
        }

        _initialize() {
            this._pwd = process.cwd();
            if (this.workingPath !== this._pwd) {
                process.chdir(this.workingPath);
            }

            this._injectErrorHandlers();
        }

        _uninitialize() {
            const detach = true;
            this._injectErrorHandlers(detach);

            process.chdir(this._pwd);
            delete this._pwd;
        }

        _injectErrorHandlers(detach) {
            if (detach) {
                process.removeListener('warning', this._onWarning);
                if (this._onUncaughtException) {
                    process.removeListener('uncaughtException', this._onUncaughtException);
                    delete this._onUncaughtException;
                }

                return;
            }

            if (!this.options.ignoreUncaught) {
                this._onUncaughtException = this._getOnUncaughtException(this.options.exitOnUncaught);
                process.on('uncaughtException', this._onUncaughtException);
            }

            process.on('warning', this._onWarning);
        }

        _getFeatureFallbackPath() {
            let pathArray = super._getFeatureFallbackPath();
            pathArray.splice(1, 0, path.resolve(__dirname, 'appFeatures'));

            return pathArray;
        }
    };

export default Runnable;
