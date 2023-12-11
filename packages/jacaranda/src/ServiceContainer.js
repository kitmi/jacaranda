import ConfigLoader, { JsonConfigProvider, YamlConfigProvider } from '@kitmi/config';
import { _, pushIntoBucket, eachAsync_, arrayToObject, esmCheck } from '@kitmi/utils';
import { fs, tryRequire as _tryRequire } from '@kitmi/sys';
import { InvalidConfiguration, ValidationError } from '@kitmi/types';
import { Types } from '@kitmi/validators/allSync';
import { TopoSort } from '@kitmi/algo';

import path from 'node:path';

import Feature from './Feature';
import defaultOpts from './defaultOpts';
import AsyncEmitter from './helpers/AsyncEmitter';
import { consoleLogger, makeLogger } from './logger';

const FILE_EXT = ['.js', '.mjs', '.cjs', '.ts'];

const configOverrider = (defConf, envConf) => {
    const { serviceGroup: defServiceGroup, ..._def } = defConf ?? {};
    const { serviceGroup: envServiceGroup, ..._env } = envConf ?? {};

    const serviceGroup = {};

    if (defServiceGroup || envServiceGroup) {
        defServiceGroup &&
            _.each(defServiceGroup, (servicesMap, serviceName) => {
                serviceGroup[serviceName] = servicesMap;
            });

        envServiceGroup &&
            _.each(envServiceGroup, (servicesMap, serviceName) => {
                serviceGroup[serviceName] = {
                    ...serviceGroup[serviceName],
                    ...servicesMap,
                };
            });
    }

    const ret = {
        ..._def,
        ..._env,
    };

    if (!_.isEmpty(serviceGroup)) {
        ret.serviceGroup = serviceGroup;
    }

    return ret;
};

/**
 * Service container class.
 * @class
 */
class ServiceContainer extends AsyncEmitter {
    _loggerLog = (...args) => {
        this.logger.log(...args);
        return this;
    };

    logError = (error, message) => {
        return this.logException('error', error, message);
    };

    logErrorAsWarning = (error, message) => {
        return this.logException('warn', error, message);
    };

    /**
     * @param {string} name - The name of the container instance.
     * @param {object} [options] - Container options
     * @property {string} [options.env] - Environment, default to process.env.NODE_ENV
     * @property {string} [options.workingPath] - App's working path, default to process.cwd()
     * @property {string} [options.configPath="conf"] - App's config path, default to "conf" under workingPath
     * @property {string} [options.configName="app"] - App's config basename, default to "app"
     * @property {string} [options.configType="json"] - App's config type, default to "json"
     * @property {string} [options.disableEnvAwareConfig=false] - Don't use environment-aware config
     * @property {array} [options.allowedFeatures] - A list of enabled feature names
     * @property {boolean} [options.loadConfigFromOptions=false] - Whether to load config from passed-in options
     * @property {object} [options.config] - Config in options, used only when loadConfigFromOptions
     */
    constructor(name, options) {
        super();

        /**
         * Name of the app
         * @member {object}
         **/
        this.name = name;

        /**
         * App options
         * @member {object}
         */
        this.options = {
            ...defaultOpts,
            ...options,
        };

        /**
         * Environment flag
         * @member {string}
         */
        this.env = this.options.env;

        /**
         * Working directory of this cli app
         * @member {string}
         */
        this.workingPath = this.options.workingPath ? path.resolve(this.options.workingPath) : process.cwd();

        /**
         * Config path
         * @member {string}
         */
        this.configPath = this.toAbsolutePath(this.options.configPath);

        /**
         * Source files path.
         * @member {string}
         **/
        this.sourcePath = this.toAbsolutePath(this.options.sourcePath);

        /**
         * Feature path
         */
        this.featuresPath = path.resolve(this.sourcePath, this.options.featuresPath);

        this._logCache = [];

        // dummy
        this.log = (...args) => {
            this._logCache.push(args);
            return this;
        };
    }

    /**
     * Start the container.
     * @fires ServiceContainer#configLoaded
     * @fires ServiceContainer#ready
     * @returns {Promise.<ServiceContainer>}
     */
    async start_() {
        this.log('verbose', `Starting app [${this.name}] ...`);

        await this.emit_('starting', this);

        this._featureRegistry = {
            //firstly look up "features" under current working path, and then try the builtin features path
            '*': this._getFeatureFallbackPath(),
        };

        /**
         * Loaded features, name => feature object
         * @member {object}
         */
        this.features = {};

        /**
         * Loaded services
         * @member {object}
         */
        this.services = {};

        if (this.options.loadConfigFromOptions) {
            this.config = this.options.config;
        } else {
            let configLoader;

            if (this.options.configType === 'yaml') {
                configLoader = this.options.disableEnvAwareConfig
                    ? new ConfigLoader(
                          new YamlConfigProvider(path.join(this.configPath, this.options.configName + '.yaml')),
                          this
                      )
                    : ConfigLoader.createEnvAwareYamlLoader(
                          this.configPath,
                          this.options.configName,
                          this.env,
                          this,
                          configOverrider
                      );
            } else {
                configLoader = this.options.disableEnvAwareConfig
                    ? new ConfigLoader(
                          new JsonConfigProvider(path.join(this.configPath, this.options.configName + '.json')),
                          this
                      )
                    : ConfigLoader.createEnvAwareJsonLoader(
                          this.configPath,
                          this.options.configName,
                          this.env,
                          this,
                          configOverrider
                      );
            }

            /**
             * Configuration loader instance
             * @member {ConfigLoader}
             */
            this.configLoader = configLoader;

            await this.loadConfig_();
        }

        /**
         * Config loaded event.
         * @event ServiceContainer#configLoaded
         */
        await this.emit_('configLoaded', this.config);

        if (!_.isEmpty(this.config)) {
            await this._loadFeatures_();
        } else {            
            this.log('verbose', `Empty configuration! Config path: ${this.configPath}`);
            this.flushLogCache();
        }

        /**
         * App ready
         * @event ServiceContainer#ready
         */
        await this.emit_('ready', this);

        /**
         * Flag showing the app is started or not.
         * @member {bool}
         */
        this.started = true;

        return this;
    }

    /**
     * Stop the container
     * @fires ServiceContainer#stopping
     * @returns {Promise.<ServiceContainer>}
     */
    async stop_() {
        /**
         * App stopping
         * @event ServiceContainer#stopping
         */
        await this.emit_('stopping', this);

        this.log('verbose', `Stopping app [${this.name}] ...`);

        this.started = false;

        delete this.services;
        delete this.features;
        delete this._featureRegistry;

        delete this.config;
        delete this.configLoader;

        await this.emit_('stopped', this);

        this.allOff();
    }

    /**
     * @returns {ServiceContainer}
     */
    async loadConfig_() {
        let configVariables = this._getConfigVariables();

        /**
         * App configuration
         * @member {object}
         */
        this.config = await this.configLoader.load_(configVariables);

        return this;
    }

    /**
     * Translate a relative path of this app module to an absolute path
     * @param {array} args - Array of path parts
     * @returns {string}
     */
    toAbsolutePath(...args) {
        args = args.filter((arg) => arg != null);
        if (args.length === 0) {
            return this.workingPath;
        }

        return path.resolve(this.workingPath, ...args);
    }

    tryRequire(pkgName, local) {
        const obj = local ? require(pkgName) : _tryRequire(pkgName, this.workingPath);
        return esmCheck(obj);
    }

    /**
     * Try to require a package, if it's an esm module, import it.
     * @param {*} pkgName
     * @param {*} useDefault
     * @returns {*} 
     */
    async tryRequire_(pkgName, useDefault) {
        try {
            return this.tryRequire(pkgName);
        } catch (error) {
            if (error.code === 'ERR_REQUIRE_ESM') {
                const esmModule = await import(pkgName);
                if (useDefault) {
                    return esmModule.default;
                }
                return esmModule;
            }
            throw error;
        }
    }

    /**
     * Register a service
     * @param {string} name
     * @param {object} serviceObject
     * @param {boolean} override
     * @returns {ServiceContainer}
     */
    registerService(name, serviceObject, override) {
        if (name in this.services && !override) {
            throw new Error('Service "' + name + '" already registered!');
        }

        this.services[name] = serviceObject;
        this.log('verbose', `Service "${name}" registered.`);
        return this;
    }

    /**
     * Check whether a service exists
     * @param {*} name
     * @returns {boolean}
     */
    hasService(name) {
        return name in this.services;
    }

    /**
     * Get a service from module hierarchy
     * @param name
     * @returns {object}
     */
    getService(name) {
        return this.services[name];
    }

    /**
     * Check whether a feature is enabled in the app.
     * @param {string} feature
     * @returns {bool}
     */
    enabled(feature) {
        return this.features[feature]?.enabled || this.host?.enabled(feature) || false;
    }

    /**
     * Add more or overide current feature registry
     * @param {object} registry
     */
    addFeatureRegistry(registry) {
        // * is used as the fallback location to find a feature
        if (registry.hasOwnProperty('*')) {
            pushIntoBucket(this._featureRegistry, '*', registry['*']);
        }

        Object.assign(this._featureRegistry, _.omit(registry, ['*']));
    }

    /**
     * Helper method to log an exception
     * @param {*} level
     * @param {*} error
     * @param {*} summary
     * @returns {ServiceContainer}
     */
    logException(level, error, summary) {
        this.log(
            level,
            (summary ? summary + '\n' : '') + error.message,
            _.pick(error, ['name', 'status', 'code', 'info', 'stack', 'request'])
        );
        return this;
    }

    trace(...args) {
        return this.log('trace', ...args);
    }

    debug(...args) {
        return this.log('debug', ...args);
    }

    verbose(...args) {
        return this.log('verbose', ...args);
    }

    info(...args) {
        return this.log('info', ...args);
    }

    warn(...args) {
        return this.log('warn', ...args);
    }

    error(...args) {
        return this.log('error', ...args);
    }

    featureConfig(config, typeInfo, name) {
        return this.sanitize(config, typeInfo, name);
    }

    sanitize(config, typeInfo, name, category) {
        try {
            return Types.OBJECT.sanitize(config, { type: 'object', ...typeInfo }, this.i18n, name);
        } catch (err) {
            let message;

            if (err instanceof ValidationError) {
                message = ValidationError.formatError(err);
            } else {
                message = err.message;
            }
            throw new InvalidConfiguration(message, this, category ? `${category}::${name}` : name);
        }
    }

    _getConfigVariables() {
        const processInfo = {
            env: process.env,
            arch: process.arch, // The operating system CPU architecture， 'arm', 'arm64','x64', ...
            argv: process.argv,
            cwd: process.cwd(),
            pid: process.pid,
            platform: process.platform,
        };

        return {
            app: this,
            env: this.env,
            process: processInfo,
        };
    }

    _getFeatureFallbackPath() {
        return [path.resolve(__dirname, 'features'), this.featuresPath];
    }

    _sortFeatures(features) {
        if (features.length === 0) {
            return features;
        }

        const topoSort = new TopoSort();
        features.forEach(([feature]) => {
            topoSort.depends(feature.name, feature.depends);
        });

        const groups = arrayToObject(features, ([feature]) => feature.name);
        const keys = topoSort.sort();

        const sorted = [];
        keys.forEach((key) => {
            const feature = groups[key];
            if (feature) {
                sorted.push(feature);
            } else {
                if (!this.enabled(key)) {
                    throw new InvalidConfiguration(`A prerequisite feature "${key}" is not enabled.`, this);
                }
            }
        });

        return sorted;
    }

    flushLogCache() {
        if (this.runnable && !('logger' in this.config)) {
            const _makeLogger = (logLevel, channel) => ({
                log: makeLogger(consoleLogger, logLevel, channel),
                child: (arg1, arg2) => _makeLogger(arg2?.level || logLevel, arg1?.module),
            });
            this.logger = _makeLogger(this.options.logLevel);
            this.log = this._loggerLog;
            this._logCache.forEach((log) => this.logger.log(...log));
            this._logCache.length = 0;
        }
    }

    /**
     * Load features
     * @private
     * @returns {bool}
     */
    async _loadFeatures_() {
        try {
            // run config stage separately first
            let configStageFeatures = [];

            // load features
            _.each(this.config, (featureOptions, name) => {
                if (this.options.allowedFeatures && this.options.allowedFeatures.indexOf(name) === -1) {
                    //skip disabled features
                    return;
                }

                if (this.options.ignoreFeatures && this.options.ignoreFeatures.indexOf(name) !== -1) {
                    //ignore features, useful for worker to use the same config with server
                    return;
                }

                let feature;
                try {
                    feature = this._loadFeature(name);
                } catch (err) {
                    //ignore the first trial
                    //this.log('warn', err.message, { err });
                }

                if (feature && feature.stage === Feature.CONF) {
                    configStageFeatures.push([feature, featureOptions]);
                    delete this.config[name];
                }
            });

            if (configStageFeatures.length > 0) {
                await this._loadFeatureGroup_(configStageFeatures, Feature.CONF);

                //reload all features if any type of configuration feature exists
                return this._loadFeatures_();
            }
        } finally {
            // if no logger in config, use console logger
            this.flushLogCache();
        }

        await this.emit_('configFinalized', this.config);

        if (this.options.logConfig && (this.options.logLevel === 'debug' || this.options.logLevel === 'verbose')) {
            this.log('verbose', 'Finalized config:', this.config);
        }

        let featureGroups = {
            [Feature.INIT]: [],
            [Feature.SERVICE]: [],
            [Feature.PLUGIN]: [],
            [Feature.FINAL]: [],
        };

        // load features
        _.each(this.config, (featureOptions, name) => {
            if (this.options.allowedFeatures && this.options.allowedFeatures.indexOf(name) === -1) {
                //skip disabled features
                return;
            }

            let feature = this._loadFeature(name);

            if (!(feature.stage in featureGroups)) {
                throw new Error(`Invalid feature stage. Feature: ${name}, type: ${feature.stage}`);
            }

            featureGroups[feature.stage].push([feature, featureOptions]);
        });

        return eachAsync_(featureGroups, (group, stage) => this._loadFeatureGroup_(group, stage));
    }

    async _loadFeatureGroup_(featureGroup, groupStage) {
        featureGroup = this._sortFeatures(featureGroup);

        await this.emit_('before:' + groupStage);
        this.log('verbose', `Loading "${groupStage}" feature group ...`);

        await eachAsync_(featureGroup, async ([feature, options]) => {
            const { name, depends } = feature;
            await this.emit_('before:load:' + name);
            this.log('verbose', `Loading feature "${name}" ...`);

            depends && this._dependsOn(depends, name);

            await feature.load_(this, options, name);
            this.features[name].enabled = true;
            this.log('verbose', `Feature "${name}" loaded. [OK]`);

            await this.emit_('after:load:' + name);
        });
        this.log('verbose', `Finished loading "${groupStage}" feature group. [OK]`);

        await this.emit_('after:' + groupStage);
    }

    _dependsOn(features, fromFeature) {
        let hasNotEnabled = _.find(_.castArray(features), (feature) => !this.enabled(feature));

        if (hasNotEnabled) {
            throw new Error(`The "${hasNotEnabled}" feature depended by "${fromFeature}" feature is not enabled.`);
        }
    }

    /**
     * Load a feature object by name.
     * @private
     * @param {string} feature
     * @returns {object}
     */
    _loadFeature(feature) {
        let featureObject = this.features[feature];
        if (featureObject) return featureObject;

        let featurePath;

        if (this._featureRegistry.hasOwnProperty(feature)) {
            //load by registry entry
            let loadOption = this._featureRegistry[feature];

            if (Array.isArray(loadOption)) {
                if (loadOption.length === 0) {
                    throw new Error(`Invalid registry value for feature "${feature}".`);
                }

                featurePath = loadOption[0];
                featureObject = this.tryRequire(featurePath);

                if (loadOption.length > 1) {
                    //one module may contains more than one feature
                    featureObject = _.get(featureObject, loadOption[1]);
                }
            } else {
                featurePath = loadOption;
                featureObject = this.tryRequire(featurePath);
            }
        } else {
            //load by fallback paths
            let searchingPath = this._featureRegistry['*'];

            //reverse fallback stack
            let found = _.findLast(searchingPath, (p) =>
                FILE_EXT.find((ext) => {
                    featurePath = path.join(p, feature + ext);
                    return fs.existsSync(featurePath);
                })
            );

            if (!found) {
                throw new InvalidConfiguration(`Don't know where to load feature "${feature}".`, this, {
                    feature,
                    searchingPath,
                });
            }

            featureObject = this.tryRequire(featurePath);
        }        

        featureObject = typeof featureObject === 'function' ? featureObject(this) : featureObject;

        if (!Feature.validate(featureObject)) {
            throw new Error(`Invalid feature object loaded from "${featurePath}".`);
        }

        if (!featureObject.stage) {
            featureObject.stage = Feature.SERVICE;
        }

        featureObject.name = feature;
        this.features[feature] = featureObject;
        return featureObject;
    }
}

export default ServiceContainer;
