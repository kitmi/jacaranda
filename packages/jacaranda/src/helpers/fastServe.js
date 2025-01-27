import serve from './serve';
import { _, replaceAll } from '@kitmi/utils';

export default function fastServe(modules, { logger, engine, middlewares, ...features } = {}) {
    const { routes, registry: moduleRegistry } = _.reduce(
        modules,
        (result, module, route) => {
            const moduleName = replaceAll(route, '/', '_') + 'Module';
            result.routes[route] = moduleName;
            result.registry[moduleName] = module;
            return result;
        },
        { routes: {}, registry: {} }
    );

    const { config: middlewareConfig, registry: middlewareRegistry } = middlewares.reduce(
        (result, middleware) => {
            if (typeof middleware === 'string') {
                result.config.push(middleware);
                return result;
            }

            const [name, fn, config] = middleware;

            result.config.push(config ? [name, config] : name);
            result.registry[name] = fn;
            return result;
        },
        {
            config: [],
            registry: {},
        }
    );

    return serve({
        loadConfigFromOptions: true,
        logLevel: logger?.level ?? 'verbose',
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
            routing: {
                '/': {
                    module: {
                        $source: 'registry',
                        $middlewares: ['jsonError', ...middlewareConfig],
                        ...routes,
                    },
                },
            },
            ...features,
        },
        registry: {
            controllers: {
                modules: moduleRegistry,
            },
            middlewares: middlewareRegistry,
        },
    });
}
