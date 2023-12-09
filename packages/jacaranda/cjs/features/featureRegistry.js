/**
 * Enable customized feature loading source, from npm modules or other location
 * @module Feature_FeatureRegistry
 *
 * @example
 *  featureRegistry: {
 *    "*": "fallback path",
 *    "feature1": "feature1 file path", // feature1 = require("feature1 file path");
 *    "feature2": [ "feature2 file path", "object path" ] // feature2 = _.get(require("feature2 file path"), "object path")
 *  }
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
     * @param {object} registry - Feature loading source registry
     * @returns {Promise.<*>}
     */ load_: (app, registry)=>{
        app.addFeatureRegistry(registry);
    }
};

//# sourceMappingURL=featureRegistry.js.map