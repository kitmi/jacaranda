/**
 * Enable middleware registry
 * @module Feature_MiddlewareRegistry
 *
 * @example
 *   "middlewareRegistry": {
 *       //middleware name
 *       "middleware1": "path/to/middleware1", // middleware1 = require("path/to/middleware1");
 *       "middleware2": [ "path/to/middleware2", "object path" ] // middleware2 = _.get(require("path/to/middleware2"), "object path")
 *   },
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
     */ stage: _Feature.default.CONF,
    /**
     * Load the feature
     * @param {App} app - The app module object
     * @param {object} registry - Middleware registry, key is middleware name, value is middleware module path
     * @returns {Promise.<*>}
     */ load_: (app, registry)=>{
        app.addMiddlewaresRegistry(registry);
    }
};

//# sourceMappingURL=middlewareRegistry.js.map