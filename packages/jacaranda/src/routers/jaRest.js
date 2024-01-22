import path from 'node:path';
import { globSync } from 'glob';
import { _, naming, text, hasMethod, esmCheck, batchAsync_ } from '@kitmi/utils';

/**
 * Jacaranda Restful API Spec (jaREST) router.
 * @module Router_JaREST
 */

const appendId = (baseEndpoint, idName) => (idName ? `${baseEndpoint}/:${idName}` : baseEndpoint);

/**
 * Create a jaREST router.
 * @param {*} app
 * @param {string} baseRoute
 * @param {object} options
 * @property {string} [options.resourcesPath]
 * @property {object|array} [options.middlewares]
 * @example
 *  '<base path>': {
 *      jaREST: {
 *          $controllerPath:
 *          $middlewares:
 *          $errorOptions
 *          'controller To remap': '/special/:abc/url'
 *          ...
 *      }
 *  }
 *
 *  route                          http method    function of ctrl
 *  /:resource                     get            find
 *  /:resource                     post           create
 *  /:resource/:id                 get            findOne
 *  /:resource/:id                 patch          updateOne
 *  /:resource/:id                 put            replaceOne
 *  /:resource/:id                 delete         deleteOne 
 *  /:resource                     put            replaceMany
 *  /:resource                     patch          updateMany
 *  /:resource                     delete         deleteMany
 */
const jaRestRouter = async (app, baseRoute, options) => {
    let router = app.engine.createRouter(baseRoute);

    let resourcePath = path.resolve(app.sourcePath, options.$controllerPath || 'resources');

    app.useMiddleware(router, await app.getMiddlewareFactory('jsonError')(options.$errorOptions, app), 'jsonError');

    if (options.$middlewares) {
        await app.useMiddlewares_(router, options.$middlewares);
    }

    let resourcesPath = path.join(resourcePath, '**/*.js');
    let files = globSync(resourcesPath);

    await batchAsync_(files, async filepath => {
        let controller = esmCheck(require(filepath));

        if (typeof controller === 'function') {
            controller = new controller(app);
        }

        const relativePath = path.relative(resourcePath, filepath);
        const dirPath = path.dirname(relativePath);
        const entityName = path.basename(relativePath, '.js');
        const entithNameWithPath = path.join(dirPath, entityName);

        let baseEndpoint;
        if (entithNameWithPath in options) {
            baseEndpoint = text.ensureStartsWith(text.dropIfEndsWith(options[entithNameWithPath], '/'), '/');
        } else {
            const urlPath = entithNameWithPath
                .split('/')
                .map((p) => naming.kebabCase(p))
                .join('/');
            baseEndpoint = text.ensureStartsWith(urlPath, '/');
        }

        let idName = naming.camelCase(entityName) + 'Id';
        let endpointWithId = appendId(baseEndpoint, idName);

        async function addRoute_(methodName, httpMethod) {
            if (hasMethod(controller, methodName)) {
                const _action = controller[methodName].bind(controller);
                const _middlewares = controller[methodName].__metaMiddlewares;
                await app.addRoute_(router, httpMethod, baseEndpoint, _middlewares ? [..._middlewares, _action] : _action);
            }
        }

        async function addRouteWithId_(methodName, httpMethod) {
            if (hasMethod(controller, methodName)) {
                const _action = (ctx) => controller[methodName](ctx, ctx.params[idName]);
                const _middlewares = controller[methodName].__metaMiddlewares;
                await app.addRoute_(router, httpMethod, endpointWithId, _middlewares ? [..._middlewares, _action] : _action);
            }
        }

        await addRoute_('find', 'get');
        await addRoute_('create', 'post');
        await addRoute_('replaceMany', 'put');
        await addRoute_('updateMany', 'patch');
        await addRoute_('deleteMany', 'delete');

        await addRouteWithId_('findOne', 'get');
        await addRouteWithId_('replaceOne', 'put');
        await addRouteWithId_('updateOne', 'patch');
        await addRouteWithId_('deleteOne', 'delete');        
    });

    app.addRouter(router);
};

export default jaRestRouter;
