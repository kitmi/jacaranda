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
        '@koa/router'
    ],
    load_: async function(server, options, name) {
        options = server.featureConfig(options ?? {}, {
            schema: {
                subdomainOffset: {
                    type: 'integer',
                    optional: true,
                    mod: [
                        [
                            '~min',
                            2
                        ]
                    ]
                },
                httpPort: {
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
                        elementSchema: {
                            type: 'text'
                        },
                        mod: [
                            [
                                '~minLength',
                                1
                            ]
                        ]
                    }
                ]
            }
        }, name);
        const { koa: KoaEngine } = app.tryRequire('@kitmi/adapters');
        server.engine = new KoaEngine(server);
        await server.engine.init_(options);
    }
};

//# sourceMappingURL=koa.js.map