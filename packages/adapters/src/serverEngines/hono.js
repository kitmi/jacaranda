import { _ } from '@kitmi/utils';

class HonoEngine {
    constructor(app) {
        this.app = app;
    }

    async init_(config) {
        const { Hono } = await this.app.tryRequire_('hono');        

        //create a hono instance and inject the appModule instance in the first middleware
        const createEngine = (engineWrapper) => {
            const hono = new Hono();

            //inject the appModule instance in the first middleware
            hono.use((ctx, next) => {
                ctx.app = engineWrapper.app;
                return next();
            });

            return hono;
        };

        //create an engine instance for a module
        this.createModuleEngine = (subApp) => {
            const subEngineWrapper = new KoaEngine(subApp);
            subEngineWrapper.koa = createEngine(subEngineWrapper);
        };

        //create a router instance
        this.createRouter = (baseRoute) => {
            return !baseRoute || baseRoute === '/'
                ? new Router()
                : new Router({ prefix: text.dropIfEndsWith(baseRoute, '/') });
        };

        //mount a sub engine instance
        this.mount = (route, childApp) => {
            this.hono.use(mounter(route, childApp.engine.koa));
        };

        this.hono = createEngine(this);
        this._initialize(config);
    }

    _initialize(options) {
        const koa = this.hono;
        const server = this.app;
        koa.proxy = options.trustProxy && toBoolean(options.trustProxy);

        if (options.subdomainOffset != null) {
            koa.subdomainOffset = options.subdomainOffset;
        }

        if (options.keys) {
            koa.keys = _.castArray(options.keys);
        }

        koa.on('error', (err, ctx) => {
            const info = { err, app: ctx.app.name };

            if (err.status && err.status < 500) {
                if (ctx.log) {
                    ctx.log.warn(info);
                } else {
                    ctx.app.log('warn', 'REQUEST ERROR', info);
                }

                return;
            }

            if (ctx.log) {
                ctx.log.error(info);
            } else {
                ctx.app.log('error', 'SERVER ERROR', info);
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
        this.hono.use(middleware);
    }

    attach(router) {
        this.hono.use(router.routes());
        this.hono.use(router.allowedMethods());
    }
}

export default HonoEngine;
