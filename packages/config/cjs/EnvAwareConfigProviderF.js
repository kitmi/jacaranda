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
const _utils = require("@kit/utils");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function defaultOverrider(defConfig, envConfig) {
    return {
        ...defConfig,
        ...envConfig
    };
}
/**
 * Environment-aware config provider factory
 * @param {string} EXT - File extension name, e.g. ".json"
 * @param {class} PROVIDER - Config provider class
 * @param {string} [DEFAULT_FLAG="default"] - Default flag
 */ const EnvAwareConfigProviderF = (EXT, PROVIDER, DEFAULT_FLAG = 'default')=>{
    class _class {
        /**
         * Start loading the config files
         * @memberof EnvAwareConfigProvider
         * @returns {Promise.<object>}
         */ async load_(logger, noThrow) {
            const defConfig = await this._defConfigProvider.load_(logger, noThrow);
            const envConfig = await this._envConfigProvider.load_(logger, true);
            this.config = this._overrider(defConfig, envConfig);
            if (logger && !_utils._.isEmpty(envConfig)) {
                logger.log('info', `Configuration is overrided by environment-specific [env=${this._envFlag}] settings.`);
            }
            return this.config;
        }
        /**
         * Start saving the config to files
         * @memberof EnvAwareConfigProvider
         * @returns {Promise.<*>}
         */ async save_() {
            await this._envConfigProvider.save_();
        }
        /**
         * Update config item by dotted path.
         * @memberof EnvAwareConfigProvider
         * @param {string} key - The path of config item, e.g. "item.subItem.key" refers to { item: { subItem: { key: "*" } } }
         * @param {*} value - New value of config item
         * @returns {JsonConfigProvider}
         */ setItem(key, value) {
            _utils._.set(this.config, key, value);
            this._envConfigProvider.setItem(key, value);
            return this;
        }
        /**
         * Get config item by dotted path.
         * @memberof EnvAwareConfigProvider
         * @param {string} key
         * @param {*} defaultValue
         * @returns {*}
         */ getItem(key, defaultValue) {
            return _utils._.get(this.config, key, defaultValue);
        }
        /**
         * Environment-aware config provider
         * @constructs EnvAwareConfigProvider
         * @param {string} configDir - The base directory of config files
         * @param {string} baseName - The basename of the config file
         * @param {string} [envFlag="development"] - Environment flag
         */ constructor(configDir, baseName, envFlag = 'development', overrider){
            /**
             * The raw default config
             * @type {object}
             * @private
             */ this._defConfigProvider = new PROVIDER(_nodepath.default.join(configDir, baseName + '.' + DEFAULT_FLAG + EXT));
            /**
             * The environment specific config
             * @type {object}
             * @public
             */ this._envConfigProvider = new PROVIDER(_nodepath.default.join(configDir, baseName + '.' + envFlag + EXT));
            this._envFlag = envFlag;
            this._overrider = overrider || defaultOverrider;
            /**
             * The loaded config
             * @type {object}
             * @public
             */ this.config = undefined;
        }
    }
    return _class;
};
const _default = EnvAwareConfigProviderF;

//# sourceMappingURL=EnvAwareConfigProviderF.js.map