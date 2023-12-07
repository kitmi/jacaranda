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
    EnvAwareJsonConfigProvider: function() {
        return EnvAwareJsonConfigProvider;
    },
    EnvAwareYamlConfigProvider: function() {
        return EnvAwareYamlConfigProvider;
    },
    default: function() {
        return _default;
    }
});
const _utils = require("@kitmi/utils");
const _JsonConfigProvider = /*#__PURE__*/ _interop_require_default(require("./JsonConfigProvider.js"));
const _YamlConfigProvider = /*#__PURE__*/ _interop_require_default(require("./YamlConfigProvider.js"));
const _EnvAwareConfigProviderF = /*#__PURE__*/ _interop_require_default(require("./EnvAwareConfigProviderF.js"));
const _defaultSyntax = /*#__PURE__*/ _interop_require_default(require("./defaultSyntax.js"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const EnvAwareJsonConfigProvider = (0, _EnvAwareConfigProviderF.default)('.json', _JsonConfigProvider.default);
const EnvAwareYamlConfigProvider = (0, _EnvAwareConfigProviderF.default)('.yaml', _YamlConfigProvider.default);
class ConfigLoader {
    /**
     * Create an environment aware JSON config loader
     * @param {string} configDir
     * @param {string} baseName
     * @param {string} envFlag
     * @param {Logger} logger
     * @param {function} overrider
     * @param {object} postProcessors
     */ static createEnvAwareJsonLoader(configDir, baseName, envFlag, logger, overrider, postProcessors) {
        return new ConfigLoader(new EnvAwareJsonConfigProvider(configDir, baseName, envFlag, overrider), logger, postProcessors);
    }
    /**
     * Create an environment aware YAML config loader
     * @param {string} configDir
     * @param {string} baseName
     * @param {string} envFlag
     * @param {Logger} logger
     * @param {function} overrider
     * @param {object} postProcessors
     */ static createEnvAwareYamlLoader(configDir, baseName, envFlag, logger, overrider, postProcessors) {
        return new ConfigLoader(new EnvAwareYamlConfigProvider(configDir, baseName, envFlag, overrider), logger, postProcessors);
    }
    /**
     * Start loading the config files and override existing
     * @param {object} variables - variables
     * @returns {Promise.<object>}
     */ async load_(variables) {
        const oldData = this.data;
        await this.reload_(variables);
        if (oldData) {
            this.data = _utils._.defaults(this.data, oldData);
        }
        return this.data;
    }
    /**
     * Reload config
     * @returns {Promise.<object>}
     */ async reload_(variables) {
        this.data = await this.provider.load_(this.logger, true);
        if (this.autoPostProcess) this.postProcess(variables);
        return this.data;
    }
    /**
     * PostProcess the loaded config
     * @param {object} variables - variables
     */ postProcess(variables) {
        const queue = [
            this.data
        ];
        this._l = this.postProcessors.prefix.length;
        variables = {
            ...variables,
            $this: this.data
        };
        const interpolateElement = (coll, key, val)=>{
            if (typeof val === 'string') {
                coll[key] = this._tryProcessStringValue(val, variables);
            } else if (_utils._.isPlainObject(val) || _utils._.isArray(val)) {
                queue.push(val);
            }
        };
        let offset = 0;
        while(queue.length > offset){
            const node = queue[offset];
            if (_utils._.isPlainObject(node)) {
                _utils._.forOwn(node, (value, key)=>{
                    interpolateElement(node, key, value);
                });
            } else {
                const l = node.length;
                for(let i = 0; i < l; i++){
                    interpolateElement(node, i, node[i]);
                }
            }
            offset++;
        }
    }
    _tryProcessStringValue(strVal, variables) {
        if (strVal.startsWith(this.postProcessors.prefix)) {
            const colonPos = strVal.indexOf(':');
            if (colonPos > this._l) {
                const token = strVal.substring(this._l, colonPos);
                const operator = this.postProcessors.processors[token];
                if (operator) {
                    return operator(strVal.substr(colonPos + 1), variables);
                }
                throw new Error('Unsupported post processor: ' + token);
            }
            throw new Error('Invalid post processor syntax: ' + strVal);
        }
        return strVal;
    }
    /**
     * The config loader
     * @constructs ConfigLoader
     * @extends EventEmitter
     * @example
     *   let fileSource = new JsonConfigProvider('path/to/config.json');
     *   let config = new ConfigLoader(fileSource);
     *   await config.load_()...;
     *
     *   let dbSource = new DbConfigProvider(config.data.dbConnection);
     *   config.provider = dbSource;
     *   await config.reload_()...;
     *
     *   // same as: let envAwareLoader = new ConfigLoader(
     *   //    new (EnvAwareConfigProviderF('.json', JsonConfigProvider, 'default'))('config/dir', 'app', 'production')
     *   // );
     *   let envAwareLoader = ConfigLoader.createEnvAwareJsonLoader('config/dir', 'app', 'production');
     *
     *   // Loader will load config/dir/app.default.json first,
     *   // and then load config/dir/app.production.json,
     *   // and finally override the default.
     *   let cfg = await envAwareLoader.load_();
     */ constructor(configProvider, logger, postProcessors){
        /**
         * The config data source provider
         * @type {object}
         * @public
         **/ this.provider = configProvider;
        /**
         * The config data
         * @type {object}
         * @public
         **/ this.data = undefined;
        /**
         * Whether to do string post process automatically after loading
         * @type {boolean}
         * @public
         */ this.autoPostProcess = true;
        /**
         * Logger with log(level, message, meta) function.
         * @type {Logger}
         * @public
         */ this.logger = logger;
        /**
         * Post processors
         * @private
         */ this.postProcessors = postProcessors != null ? _utils._.defaultsDeep(postProcessors, _defaultSyntax.default) : _defaultSyntax.default;
    }
}
const _default = ConfigLoader;

//# sourceMappingURL=ConfigLoader.js.map