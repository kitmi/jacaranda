/**
 * Enable server specific config identified by host name.
 * @module Feature_ConfigByHostname
 */ "use strict";
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
const _config = require("@kitmi/config");
const _Feature = /*#__PURE__*/ _interop_require_default(require("../Feature"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const _default = {
    /**
     * This feature is loaded at configuration stage
     * @member {string}
     */ stage: _Feature.default.CONF,
    /**
     * Load the feature
     * @param {App} app - The cli app module object
     * @param {object} options - Options for the feature
     * @property {string} [options.fallbackName] - Fallback name if hostname not available
     * @returns {Promise.<*>}
     */ load_: async (app, options)=>{
        let hostName;
        try {
            hostName = (await (0, _sys.run_)('hostname')).trim();
        } catch (e) {
            app.log('warn', e.message || e);
        }
        if (!hostName) {
            throw new Error('Unable to read "hostname" from environment.');
        }
        let hostSpecConfigFile = _nodepath.default.join(app.configPath, app.configName + '.' + hostName + (app.options.configType === 'yaml' ? '.yaml' : '.json'));
        if (!_sys.fs.existsSync(hostSpecConfigFile)) {
            if (options.fallbackName) {
                hostName = options.fallbackName;
                let hostSpecConfigFileFb = _nodepath.default.join(app.configPath, app.configName + '.' + hostName + (app.options.configType === 'yaml' ? '.yaml' : '.json'));
                if (!_sys.fs.existsSync(hostSpecConfigFileFb)) {
                    throw new Error(`The specific config file for host [${hostName}] not found and the fallback config [${hostSpecConfigFileFb}] not found either.`);
                }
                hostSpecConfigFile = hostSpecConfigFileFb;
            } else {
                app.log('warn', `The specific config file for host [${hostName}] not found and no fallback setting. Use defaults.`);
                return;
            }
        }
        app.configLoader.provider = app.options.configType === 'yaml' ? new _config.YamlConfigProvider(hostSpecConfigFile) : new _config.JsonConfigProvider(hostSpecConfigFile);
        return app.loadConfig_();
    }
};

//# sourceMappingURL=configByHostname.js.map