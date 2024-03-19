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
const _jacaranda = require("@kitmi/jacaranda");
const _test = /*#__PURE__*/ _interop_require_default(require("./apps/test"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const modulesRegistry = {
    test: _test.default
};
const server = (0, _jacaranda.serve)({
    configType: 'yaml',
    logLevel: 'verbose',
    logFeatures: true,
    logMiddlewareRegistry: true,
    modulesRegistry
});
const _default = server;

//# sourceMappingURL=server.js.map