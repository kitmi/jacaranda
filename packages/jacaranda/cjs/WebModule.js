"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return _default;
    }
});
const _utils = require("@kitmi/utils");
const _ServiceContainer = /*#__PURE__*/ _interop_require_default(require("./ServiceContainer"));
const _ModuleBase = /*#__PURE__*/ _interop_require_default(require("./ModuleBase"));
const _Routable = /*#__PURE__*/ _interop_require_default(require("./Routable"));
const _defaultServerOpts = require("./defaultServerOpts");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
/**
 * Web application module class.
 * @class
 * @extends Routable(LibModule)
 */ class WebModule extends (0, _ModuleBase.default)((0, _Routable.default)(_ServiceContainer.default)) {
    /**
     * Require a module from the source path of an app module
     * @param {*} relativePath
     */ requireFromApp(appName, relativePath) {
        return this.server.requireFromApp(appName, relativePath);
    }
    /**
     * @param {WebServer} server
     * @param {string} name - The name of the app module.
     * @param {string} route - The base route of the app module.
     * @param {string} appPath - The path to load the app's module files
     * @param {object} [options] - The app module's extra options defined in its parent's configuration.
     */ constructor(server, name, route, appPath, options){
        super(server, name, appPath, {
            ..._defaultServerOpts.defaultWebModuleOpts,
            ...options
        });
        this.server = this.host;
        this.router = this.server.engine.createModuleRouter(this);
        /**
         * Mounting route.
         * @member {string}
         */ this.route = _utils.text.ensureStartsWith(_utils.text.dropIfEndsWith(route, '/'), '/');
    }
}
const _default = WebModule;

//# sourceMappingURL=WebModule.js.map