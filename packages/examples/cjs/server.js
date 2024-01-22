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
const server = (0, _jacaranda.serve)({
    configType: 'yaml',
    logLevel: 'verbose',
    logFeatures: true,
    logMiddlewareRegistry: true,
    traceMiddlewares: true
});
const _default = server;

//# sourceMappingURL=server.js.map