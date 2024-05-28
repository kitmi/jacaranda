/**
 * Enable app customized env variables
 * @module Feature_Env
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
const _Feature = /*#__PURE__*/ _interop_require_default(require("../Feature"));
const _runtime = /*#__PURE__*/ _interop_require_wildcard(require("../runtime"));
const _utils = require("@kitmi/utils");
const _types = require("@kitmi/types");
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
const _default = {
    /**
     * This feature is loaded at init stage
     * @member {string}
     */ stage: _Feature.default.INIT,
    /**
     * Load the feature
     * @param {App} app - The cli app module object
     * @param {object} envSettings - Customized env settings
     * @property {array} [envSettings.expose] - Expose env variables from process.env into runtime
     * @property {object} [envSettings.add] - Add env variables
     * @returns {void}
     */ load_: function(app, envSettings, name) {
        let { expose, add } = app.featureConfig(envSettings, {
            schema: {
                expose: {
                    type: 'array',
                    optional: true
                },
                add: {
                    type: 'object',
                    optional: true
                }
            }
        }, name);
        //todo: encrypt sensitive env variables
        expose = new Set(expose || []);
        expose.add('NODE_ENV');
        expose.add('STAGE_ENV');
        if (add?.NODE_ENV) {
            throw new _types.InvalidConfiguration('NODE_ENV cannot be added', app, `${name}.add.NODE_ENV`);
        }
        const exposed = _utils._.pick(process.env, Array.from(expose));
        _runtime.default.register(_runtime.K_ENV, {
            ...exposed,
            ...add
        });
    }
};

//# sourceMappingURL=env.js.map