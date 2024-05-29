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
const _default = {
    stage: _Feature.default.INIT,
    packages: (server, { type })=>{
        const Engine = server.requireModule(`@kitmi/adapters::${type}`);
        return Engine.packages;
    },
    load_: async function(server, options, name) {
        const { type, middlewares, ..._options } = server.featureConfig(options, {
            schema: {
                type: {
                    type: 'text'
                },
                middlewares: [
                    {
                        type: 'text',
                        optional: true
                    },
                    {
                        type: 'array',
                        optional: true
                    },
                    {
                        type: 'object',
                        optional: true
                    }
                ]
            },
            keepUnsanitized: true
        }, name);
        const Engine = server.requireModule(`@kitmi/adapters::${type}`);
        server.engine = new Engine(server);
        if (!(0, _utils.isEmpty)(middlewares)) {
            server.once('before:Plugins', async ()=>{
                await server.useMiddlewares_(server.engine, middlewares);
            });
        }
        await server.engine.init_(_options);
    }
};

//# sourceMappingURL=engine.js.map