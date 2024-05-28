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
        const require2 = (0, _nodemodule.createRequire)(mainModule.endsWith('/') || mainModule.endsWith('\\') ? mainModule : mainModule + _nodepath.default.sep);
        return require2(packageName);
    } catch (error) {
        if (error.code === 'MODULE_NOT_FOUND') {
            if (throwWhenNotFound) {
                let pkgPaths = packageName.split('/');
                let npmPkgName = pkgPaths[0];
                if (npmPkgName.startsWith('.')) {
                    //path
                    throw error;
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
    // relative path
    const isRelative = packageName.indexOf(_nodepath.default.sep) > 0 && packageName.startsWith('.');
    if (isRelative) {
        packageName = _nodepath.default.resolve(basePath ?? '', packageName);
    }
    if (packageName.startsWith('@') || _nodepath.default.isAbsolute(packageName)) {
        try {
            return require(packageName);
        } catch (error) {
            if (error.code !== 'MODULE_NOT_FOUND') {
                throw error;
            }
        }
    }
    basePath != null || (basePath = process.cwd());
    return tryRequireBy(packageName, basePath, true);
}
const _default = tryRequire;

//# sourceMappingURL=tryRequire.js.map