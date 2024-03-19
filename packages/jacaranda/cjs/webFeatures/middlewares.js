/**
 * Enable middlewares
 * @module Feature_Middlewares
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
     * This feature is loaded at plugin stage
     * @member {string}
     */ stage: _Feature.default.PLUGIN,
    /**
     * Load the feature
     * @param {Routable} app - The app module object
     * @param {*} middlewares - Middlewares and options
     * @returns {Promise.<*>}
     */ load_: async function(app, middlewares) {
        if (app.router == null) {
            // if mount to server level
            app.createServerModuleRouter();
        }
        await app.useMiddlewares_(app.router, middlewares);
    }
};

//# sourceMappingURL=middlewares.js.map