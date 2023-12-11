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
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
class KoaEngine {
    async init_(config) {
        const Koa = await this.app.tryRequire_('koa');
        const mounter = await this.app.tryRequire_('koa-mount');
        const Router = await this.app.tryRequire_('@koa/router');
        //create a koa instance and inject the appModule instance in the first middleware
        const createEngine = (engineWrapper)=>{
            const koa = new Koa();
            //inject the appModule instance in the first middleware
            koa.use((ctx, next)=>{
                ctx.appModule = engineWrapper.app;
                return next();
            });
            return koa;
        };
        //create a sub engine instance and inject the appModule instance in the first middleware
        this.createSubEngine = (subApp)=>{
            const subEngineWrapper = new KoaEngine(subApp);
            subEngineWrapper.koa = createEngine(subEngineWrapper);
        };
        //create a router instance
        this.createRouter = (baseRoute)=>{
            return !baseRoute || baseRoute === '/' ? new Router() : new Router({
                prefix: _utils.text.dropIfEndsWith(baseRoute, '/')
            });
        };
        //mount a sub engine instance
        this.mount = (route, childApp)=>{
            this.koa.use(mounter(route, childApp.engine.koa));
        };
        this.koa = createEngine(this);
        this._initialize(config);
    }
    _initialize(options) {
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
                app: ctx.appModule.name
            };
            if (err.status && err.status < 500) {
                if (ctx.log) {
                    ctx.log.warn(info);
                } else {
                    ctx.appModule.log('warn', 'REQUEST ERROR', info);
                }
                return;
            }
            if (ctx.log) {
                ctx.log.error(info);
            } else {
                ctx.appModule.log('error', 'SERVER ERROR', info);
            }
        });
        server.httpServer = _nodehttp.default.createServer(koa.callback());
        let port = options.port;
        server.on('ready', async ()=>{
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
    constructor(app){
        this.app = app;
    }
}
const _default = KoaEngine;

//# sourceMappingURL=koa.js.map