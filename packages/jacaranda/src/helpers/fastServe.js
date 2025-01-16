import serve from './serve';
import { _, replaceAll } from '@kitmi/utils';

export default function fastServe(modules, { logger, engine, middlewares, ...features } = {}) {
    const { routes, registry } = _.reduce(
        modules,
        (result, module, route) => {
            const moduleName = replaceAll(route, '/', '_') + 'Module';
            result.routes[route] = moduleName;
            result.registry[moduleName] = module;
            return result;
        },
        { routes: {}, registry: {} }
    );

    return serve({
        loadConfigFromOptions: true,
        config: {
            logger: {
                level: 'verbose',
                ...logger,
            },
            engine: {
                type: 'koa',
                port: 3388,
                ...engine,
            },
            middlewareFactory: {
                moduleMiddlewares: {
                    ...middlewares,
                    body: {
                        multipart: true,
                        jsonLimit: '15mb',
                        formidable: {
                            hashAlgorithm: 'md5',
                        },
                    },
                },
            },
            routing: {
                '/': {
                    module: {
                        $source: 'registry',
                        $middleware: ['moduleMiddlewares', 'jsonError'],
                        ...routes,
                    },
                },
            },
            ...features,
        },
        registry: {
            controllers: {
                modules: registry,
            },
        },
    });
}
