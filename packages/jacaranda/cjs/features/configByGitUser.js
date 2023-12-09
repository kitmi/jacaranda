/**
 * Enable developer specific config identified by git user name.
 * @module Feature_ConfigByGitUser
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
     * @property {string} [options.fallbackName] - Fallback username for git user not available
     * @returns {Promise.<*>}
     */ load_: async (app, options)=>{
        let devName;
        try {
            devName = (await (0, _sys.run_)('git config --global user.email')).trim();
        } catch (e) {
            app.log('warn', e.message || e);
        }
        if (!devName || devName === '') {
            if (options.fallbackName) {
                devName = options.fallbackName;
            } else {
                app.log('warn', 'Unable to read "user.email" of git config and no fallback option is configured.');
                return;
            }
        }
        devName = devName.substring(0, devName.indexOf('@'));
        const devConfigFile = _nodepath.default.join(app.configPath, app.configName + '.' + devName + (app.options.configType === 'yaml' ? '.yaml' : '.json'));
        if (!_sys.fs.existsSync(devConfigFile)) {
            app.log('warn', `Developer specific config file "${devConfigFile}" does not exist and will use defaults.`);
            return;
        }
        app.configLoader.provider = app.options.configType === 'yaml' ? new _config.YamlConfigProvider(devConfigFile) : new _config.JsonConfigProvider(devConfigFile);
        return app.loadConfig_();
    }
};

//# sourceMappingURL=configByGitUser.js.map