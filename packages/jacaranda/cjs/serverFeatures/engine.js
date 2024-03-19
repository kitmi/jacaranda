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
const _Feature = /*#__PURE__*/ _interop_require_default(require("../Feature"));
const _utils = require("@kitmi/utils");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function _default(server, options) {
    const { type, middlewares, ..._options } = options;
    const Engine = server.tryRequire('@kitmi/adapters')[type];
    return {
        stage: _Feature.default.INIT,
        packages: Engine.packages,
        load_: async function(server) {
            server.engine = new Engine(server);
            if (!(0, _utils.isEmpty)(middlewares)) {
                server.once('before:Plugins', ()=>{
                    server.useMiddlewares_(server.engine, middlewares);
                });
            }
            await server.engine.init_(_options);
        }
    };
}

//# sourceMappingURL=engine.js.map