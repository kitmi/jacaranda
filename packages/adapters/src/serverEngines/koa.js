import http from 'node:http';
import { _, toBoolean, text } from '@kitmi/utils';

class KoaEngine {
    static packages = ['koa', 'koa-mount', '@koa/router'];

    constructor(appModule) {
        this.app = appModule;
    }

    async init_(config) {
        const options = this.app.featureConfig(
            config,
            {
                schema: {
                    trustProxy: { type: 'boolean', optional: true },
                    subdomainOffset: { type: 'integer', optional: true, post: [['~min', 2]] },
                    port: { type: 'integer', optional: true, default: 2331 },
                    keys: [
                        {
                            type: 'text',
                        },
                        {
                            type: 'array',
                            optional: true,
                            element: { type: 'text' },
                            post: [['~minLength', 1]],
                        },
                    ],
                },
            },
            'engine'
        );

        const Koa = await this.app.tryRequire_('koa');
        const mounter = await this.app.tryRequire_('koa-mount');
        const Router = await this.app.tryRequire_('@koa/router');

        const _initEngine = (engine, isServerDefault) => {
            const koa = new Koa();

            //inject the appModule instance in the first middleware
            if (!isServerDefault) {
                koa.use((ctx, next) => {
                    ctx.module = engine.app;
                    return next();
                });
            }

            //create a router instance
            engine.createRouter = (baseRoute) => {
                return !baseRoute || baseRoute === '/'
                    ? new Router()
                    : new Router({ prefix: text.dropIfEndsWith(baseRoute, '/') });
            };

            //mount a sub engine instance
            engine.mount = (route, moduleRouter) => {
                koa.use(mounter(route, moduleRouter.koa));
            };

            engine.koa = koa;
        };

        //create a module router
        this.createModuleRouter = (appModule, isServerDefault) => {
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

        server.once('ready', async () => {
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
