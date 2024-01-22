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
        'koa',
        'koa-mount',
        '@koa/router',
        'koa-body',
        'koa-compress',
        'koa-etag',
        'koa-static'
    ],
    load_: async function(server, options, name) {
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
        const { koa: KoaEngine } = server.tryRequire('@kitmi/adapters');
        server.addMiddlewaresRegistry({
            'koa-body': 'koa-body',
            'koa-compress': 'koa-compress',
            'koa-etag': 'koa-etag'
        });
        server.engine = new KoaEngine(server);
        await server.engine.init_(options);
    }
};

//# sourceMappingURL=koa.js.map