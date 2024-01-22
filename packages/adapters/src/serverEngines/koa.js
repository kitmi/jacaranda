import http from 'node:http';
import { _, toBoolean, text } from '@kitmi/utils';

class KoaEngine {
    constructor(appModule) {
        this.app = appModule;
    }

    async init_(config) {
        const Koa = await this.app.tryRequire_('koa');
        const mounter = await this.app.tryRequire_('koa-mount');
        const Router = await this.app.tryRequire_('@koa/router');

        const koa = new Koa();

        //create a module router
        this.createModuleRouter = (appModule) => {
            console.log('createModuleRouter', appModule.name);

            const moduleEngine = new KoaEngine(appModule);
            const _koa = new Koa();

            //inject the appModule instance in the first middleware
            _koa.use((ctx, next) => {
                ctx.module = appModule;
                return next();
            });

            moduleEngine.koa = _koa;
            return moduleEngine;
        };

        //create a router instance
        this.createRouter = (baseRoute) => {
            console.log('createRouter', baseRoute);

            return !baseRoute || baseRoute === '/'
                ? new Router()
                : new Router({ prefix: text.dropIfEndsWith(baseRoute, '/') });
        };

        //mount a sub engine instance
        this.mount = (route, moduleRouter) => {
            this.koa.use(mounter(route, moduleRouter.koa));
        };

        this.koa = koa;
        this._initialize(config);
    }

    _initialize(options) {
        const koa = this.koa;
        const server = this.app;
        koa.proxy = options.trustProxy && toBoolean(options.trustProxy);

        if (options.subdomainOffset != null) {
            koa.subdomainOffset = options.subdomainOffset;
        }

        if (options.keys) {
            koa.keys = _.castArray(options.keys);
        }

        koa.on('error', (err, ctx) => {
            const info = { err, app: ctx.module.name };

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

        server.httpServer = http.createServer(koa.callback());

        let port = options.port;

        server.on('ready', async () => {
            return new Promise((resolve, reject) => {
                server.httpServer.listen(port, function (err) {
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
}

export default KoaEngine;
