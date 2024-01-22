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
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const _default = {
    stage: _Feature.default.INIT,
    packages: [
        'hono',
        '@hono/node-server'
    ],
    load_: async function(app, options, name) {
        options = server.featureConfig(options ?? {}, {
            schema: {
                trustProxy: {
                    type: 'boolean',
                    optional: true
                },
                subdomainOffset: {
                    type: 'integer',
                    optional: true,
                    post: [
                        [
                            '~min',
                            2
                        ]
                    ]
                },
                port: {
                    type: 'integer',
                    optional: true,
                    default: 2331
                },
                keys: [
                    {
                        type: 'text'
                    },
                    {
                        type: 'array',
                        optional: true,
                        element: {
                            type: 'text'
                        },
                        post: [
                            [
                                '~minLength',
                                1
                            ]
                        ]
                    }
                ]
            }
        }, name);
        const { hono: HonoEngine } = server.tryRequire('@kitmi/adapters');
        server.addMiddlewaresRegistry({});
        server.engine = new HonoEngine(server);
        await server.engine.init_(options);
    }
};

//# sourceMappingURL=hono.js.map