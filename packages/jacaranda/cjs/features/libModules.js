/**
 * Load lib modules
 * @module Feature_LibModules
 *
 * @example
 *
 *  'libModules': {
 *      '<name>': {
 *          npmModule: false, // whether is a npm module
 *          options: { // module options
 *          },
 *          settings: { // can override module defined settings
 *          }
 *      }
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
const _nodepath = /*#__PURE__*/ _interop_require_default(require("node:path"));
const _utils = require("@kitmi/utils");
const _sys = require("@kitmi/sys");
const _types = require("@kitmi/types");
const _Feature = /*#__PURE__*/ _interop_require_default(require("../Feature"));
const _LibModule = /*#__PURE__*/ _interop_require_default(require("../LibModule"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const _default = {
    /**
     * This feature is loaded at plugin stage.
     * @member {string}
     */ stage: _Feature.default.PLUGIN,
    /**
     * Load the feature.
     * @param {App} app - The app module object.
     * @param {object} entries - Lib module entries.
     * @returns {Promise.<*>}
     */ load_: async (app, entries)=>{
        return (0, _utils.batchAsync_)(entries, async (config, name)=>{
            let options = {
                env: app.env,
                logLevel: app.options.logLevel,
                ...config.options
            };
            let appPath;
            if (config.npmModule) {
                appPath = app.toAbsolutePath('node_modules', name);
            } else {
                appPath = _nodepath.default.join(app.libModulesPath, name);
            }
            let exists = await _sys.fs.pathExists(appPath) && await (0, _sys.isDir_)(appPath);
            if (!exists) {
                throw new _types.InvalidConfiguration(`Lib [${name}] not exists.`, app, `libModules.${name}`);
            }
            let lib = new _LibModule.default(app, name, appPath, options);
            lib.once('configLoaded', ()=>{
                if (!_utils._.isEmpty(config.settings)) {
                    lib.config.settings = {
                        ...lib.config.settings,
                        ...config.settings
                    };
                    app.log('verbose', `Lib settings of [${lib.name}] is overrided.`);
                }
            });
            let relativePath = _nodepath.default.relative(app.workingPath, appPath);
            app.log('verbose', `Loading lib [${lib.name}] from "${relativePath}" ...`);
            await lib.start_();
            app.registerLib(lib);
            app.log('verbose', `Lib [${lib.name}] is loaded.`);
        });
    }
};

//# sourceMappingURL=libModules.js.map