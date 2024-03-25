"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _serverInstall = /*#__PURE__*/ _interop_require_default(require("@kitmi/jacaranda/serverInstall"));
const _test = /*#__PURE__*/ _interop_require_default(require("./apps/test"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const modulesRegistry = {
    test: _test.default
};
(0, _serverInstall.default)({
    logLevel: 'verbose',
    logFeatures: true,
    logMiddlewareRegistry: true,
    registry: {
        apps: modulesRegistry
    }
});

//# sourceMappingURL=server-install.js.map