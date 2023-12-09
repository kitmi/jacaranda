/**
 * Enable custom config identified by config path.
 * @module Feature_CustomConfig
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
const _config = require("@kitmi/config");
const _types = require("@kitmi/types");
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
     * @param {string} configPath - Custom config file path
     * @returns {Promise.<*>}
     */ load_: async (app, configPath, name)=>{
        const isJson = configPath.endsWith('.json');
        if (isJson) {
            app.configLoader.provider = new _config.JsonConfigProvider(_nodepath.default.resolve(configPath));
        } else {
            const isYaml = configPath.endsWith('.yaml');
            if (isYaml) {
                app.configLoader.provider = new _config.YamlConfigProvider(_nodepath.default.resolve(configPath));
            } else {
                throw new _types.InvalidConfiguration(`Unsupported config file type: ${configPath}`, app, name);
            }
        }
        return app.loadConfig_();
    }
};

//# sourceMappingURL=customConfig.js.map