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
const _nodehttp = /*#__PURE__*/ _interop_require_default(require("node:http"));
const _utils = require("@kitmi/utils");
function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
class KoaEngine {
    async init_(config) {
        const options = this.app.featureConfig(config, {
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
        }, 'engine');
        const Koa = await this.app.tryRequire_('koa');
        const mounter = await this.app.tryRequire_('koa-mount');
        const Router = await this.app.tryRequire_('@koa/router');
        const _initEngine = (engine, isServerDefault)=>{
            const koa = new Koa();
            //inject the appModule instance in the first middleware
            if (!isServerDefault) {
                koa.use((ctx, next)=>{
                    ctx.module = engine.app;
                    return next();
                });
            }
            //create a router instance
            engine.createRouter = (baseRoute)=>{
                return !baseRoute || baseRoute === '/' ? new Router() : new Router({
                    prefix: _utils.text.dropIfEndsWith(baseRoute, '/')
                });
            };
            //mount a sub engine instance
            engine.mount = (route, moduleRouter)=>{
                koa.use(mounter(route, moduleRouter.koa));
            };
            engine.koa = koa;
        };
        //create a module router
        this.createModuleRouter = (appModule, isServerDefault)=>{
            const moduleEngine = new KoaEngine(appModule);
            _initEngine(moduleEngine, isServerDefault);
            return moduleEngine;
        };
        _initEngine(this);
        this._initializeServerEngine(options);
    }
    _initializeServerEngine(options) {
        const koa = this.koa;
        const server = this.app;
        koa.proxy = options.trustProxy && (0, _utils.toBoolean)(options.trustProxy);
        if (options.subdomainOffset != null) {
            koa.subdomainOffset = options.subdomainOffset;
        }
        if (options.keys) {
            koa.keys = _utils._.castArray(options.keys);
        }
        koa.on('error', (err, ctx)=>{
            const info = {
                err,
                app: ctx.module.name
            };
            if (err.status && err.status < 500) {
                if (ctx.log) {
                    ctx.log.warn(info);
                } else {
                    ctx.module.log('warn', 'REQUEST ERROR', info);
                }
                return;
            }
            if (ctx.log) {
                ctx.log.error(info);
            } else {
                ctx.module.log('error', 'SERVER ERROR', info);
            }
        });
        server.httpServer = _nodehttp.default.createServer(koa.callback());
        let port = options.port;
        server.once('ready', async ()=>{
            return new Promise((resolve, reject)=>{
                server.httpServer.listen(port, function(err) {
                    if (err) {
                        return reject(err);
                    }
                    let address = server.httpServer.address();
                    let host;
                    if (address.family === 'IPv6' && address.address === '::') {
                        host = '127.0.0.1';
                    } else {
                        host = address.address;
                    }
                    server.host = `${host}:${address.port}`;
                    server.port = address.port;
                    server.log('info', `A koa http service is listening on port [${address.port}] ...`);
                    resolve();
                });
            });
        });
    }
    use(middleware) {
        this.koa.use(middleware);
    }
    attach(router) {
        this.koa.use(router.routes());
        this.koa.use(router.allowedMethods());
    }
    constructor(appModule){
        this.app = appModule;
    }
}
_define_property(KoaEngine, "packages", [
    'koa',
    'koa-mount',
    '@koa/router'
]);
const _default = KoaEngine;

//# sourceMappingURL=koa.js.map