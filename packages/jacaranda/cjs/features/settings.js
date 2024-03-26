/**
 * Enable customized settings
 * @module Feature_Settings
 * @example
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
const _runtime = /*#__PURE__*/ _interop_require_wildcard(require("../runtime"));
const _ServiceContainer = require("../ServiceContainer");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
const KEY_ENV = 'env:';
const KEY_STAGE = 'stage:';
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
        const Stage = _runtime.default.get(_runtime.K_ENV)?.STAGE;
        let result = {};
        let envSettings;
        let stageSettings;
        _utils._.each(settings, (value, key)=>{
            if (key.startsWith(KEY_ENV)) {
                let envKey = key.substring(KEY_ENV.length);
                if (envKey === (0, _ServiceContainer.getNodeEnv)()) {
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