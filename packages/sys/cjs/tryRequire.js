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
const _nodemodule = require("node:module");
const _nodepath = /*#__PURE__*/ _interop_require_default(require("node:path"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function tryRequireBy(packageName, mainModule, throwWhenNotFound) {
    try {
        if (typeof mainModule === 'string') {
            const require2 = (0, _nodemodule.createRequire)(mainModule.endsWith('/') || mainModule.endsWith('\\') ? mainModule : mainModule + _nodepath.default.sep);
            return require2(packageName);
        }
        return mainModule.require(packageName);
    } catch (error) {
        if (error.code === 'MODULE_NOT_FOUND') {
            if (throwWhenNotFound) {
                let pkgPaths = packageName.split('/');
                let npmPkgName = pkgPaths[0];
                if (npmPkgName.startsWith('.')) {
                    //path
                    throw error;
                }
                if (npmPkgName.startsWith('@') && pkgPaths.length > 1) {
                    npmPkgName += '/' + pkgPaths[1];
                }
                let pos1 = error.message.indexOf("'");
                let realModuleName = error.message.substr(pos1 + 1);
                let pos2 = realModuleName.indexOf("'");
                realModuleName = realModuleName.substr(0, pos2);
                if (realModuleName === packageName) {
                    throw new Error(`Module "${packageName}" not found. Try run "npm install ${npmPkgName}" to install the dependency.`);
                }
                throw error;
            }
            return undefined;
        }
        throw error;
    }
}
/**
 * Try require a package module and show install tips if not found.
 * @alias helpers.tryRequire
 * @param {String} packageName
 * @param {String} [basePath] - Base path to find the module
 * @returns {Object}
 */ function tryRequire(packageName, basePath) {
    if (packageName.startsWith('@') || _nodepath.default.isAbsolute(packageName) || // not a path
    packageName.indexOf(_nodepath.default.sep) === -1 && !packageName.startsWith('.')) {
        try {
            return require(packageName);
        } catch (error) {
            if (error.code !== 'MODULE_NOT_FOUND') {
                throw error;
            }
        }
    }
    basePath != null || (basePath = process.cwd());
    return tryRequireBy(packageName, require.main, basePath == null) || tryRequireBy(packageName, basePath, true);
}
const _default = tryRequire;

//# sourceMappingURL=tryRequire.js.map