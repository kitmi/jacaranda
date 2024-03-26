"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, /**
 * General cloud storage feature
 * @module Feature_Storage
 */ "default", {
    enumerable: true,
    get: function() {
        return _default;
    }
});
const _jacaranda = require("@kitmi/jacaranda");
const _drivers = /*#__PURE__*/ _interop_require_wildcard(require("./drivers"));
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
const mapOfProviderToDriver = {
    digitalocean: 'S3v2',
    aws: 'S3v3',
    azure: 'Azure'
};
const _default = {
    stage: _jacaranda.Feature.SERVICE,
    groupable: true,
    packages: (app, { provider })=>{
        const Driver = _drivers[mapOfProviderToDriver[provider]];
        return Driver.packages;
    },
    /**
     * Load the feature
     * @param {App} app - The app module object
     * @param {object} options - Options for the feature
     * @property {string} options.provider - Cloud storage vendor.
     * @property {object} options.options - Storage driver options.
     * @returns {Promise.<*>}
     *
     * @example
     *
     * provider: 'digitalocean',
     * options: {
     *
     * }
     */ load_: async function(app, options, name) {
        const { provider, options: providerOptions } = app.featureConfig(options, {
            schema: {
                provider: {
                    type: 'text',
                    enum: Object.keys(mapOfProviderToDriver)
                },
                options: {
                    type: 'object',
                    optional: true
                }
            }
        }, name);
        const Driver = _drivers[mapOfProviderToDriver[provider]];
        const service = new Driver(app, providerOptions);
        app.registerService(name, service);
    }
};

//# sourceMappingURL=index.js.map