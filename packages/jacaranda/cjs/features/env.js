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
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
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
     * @returns {Promise.<*>}
     */ load_: function(app, envSettings) {
        Object.assign(process.env, envSettings);
    }
};

//# sourceMappingURL=env.js.map