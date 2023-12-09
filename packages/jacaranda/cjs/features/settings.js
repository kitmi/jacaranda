/**
 * Enable customized settings
 * @module Feature_Settings
 *
 * "settings": {
 *     "key": 1,
 *     "env:development": {
 *         "key": 2
 *     },
 *     "stage:ppe": {
 *         "key": 3
 *     }
 * }
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
const _types = require("@kitmi/types");
const _utils = require("@kitmi/utils");
const _Feature = /*#__PURE__*/ _interop_require_default(require("../Feature"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const KEY_ENV = 'env:';
const KEY_STAGE = 'stage:';
const Stage = process.env.STAGE_ENV;
const _default = {
    /**
     * This feature is loaded at init stage
     * @member {string}
     */ stage: _Feature.default.INIT,
    /**
     * Load the feature
     * @param {App} app - The cli app module object
     * @param {object} settings - Customized settings
     * @returns {Promise.<*>}
     */ load_: function(app, settings) {
        let result = {};
        let envSettings;
        let stageSettings;
        _utils._.each(settings, (value, key)=>{
            if (key.startsWith(KEY_ENV)) {
                let envKey = key.substring(KEY_ENV.length);
                if (envKey === app.env) {
                    envSettings = value;
                    if (!(0, _utils.isPlainObject)(value)) {
                        throw new _types.InvalidConfiguration('Invalid env settings', app, `settings.${key}`);
                    }
                }
            } else if (Stage && key.startsWith(KEY_STAGE)) {
                let stageKey = key.substring(KEY_ENV.length);
                if (stageKey === Stage) {
                    stageSettings = value;
                    if (!(0, _utils.isPlainObject)(value)) {
                        throw new _types.InvalidConfiguration('Invalid stage settings', app, `settings.${key}`);
                    }
                }
            } else {
                result[key] = value;
            }
        });
        app.settings = Object.assign(result, envSettings, stageSettings);
    }
};

//# sourceMappingURL=settings.js.map