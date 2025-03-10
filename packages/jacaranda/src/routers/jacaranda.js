import { _, naming, text, hasMethod, eachAsync_, batchAsync_, get as _get, set as _set, replaceAll } from '@kitmi/utils';
import { loadControllers_ } from '../helpers/loadModuleFrom_';

/**
 * Jacaranda Restful API Spec (jacaranda) router.
 * @module Router_JaREST
 */

const appendId = (baseEndpoint, idName) => (idName ? `${baseEndpoint}/:${idName}` : baseEndpoint);

/**
 * Create a jaREST router.
 * @param {*} app
 * @param {string} baseRoute
 * @param {object} options
 * @property {string} [options.$controllerPath]
 * @property {object|array} [options.$middlewares]
 * @property {boolean} [options.$urlDasherize]
 * @example
 *  '<base path>': {
 *      jacaranda: {
 *          $controllerPath:
 *          $source: registry | runtime | direct | project
 *          $middlewares:
 *          $errorOptions
 *          $urlDasherize: false
 *          'controller To remap': '/special/:abc/url'
 *          ...
 *      }
 *  }
 *
 *  route                          http method    function of ctrl
 *  /:resource                     get            query_
 *  /:resource                     post           post_
 *  /:resource/:id                 get            get_
 *  /:resource/:id                 put            put_
 *  /:resource/:id                 patch          patch_
 *  /:resource/:id                 delete         delete_
 *  /:resource                     put            putMany_
 *  /:resource                     patch          patchMany_
 *  /:resource                     delete         deleteMany_
 */
const jaRestRouter = async (app, baseRoute, options) => {
    const settingGroups = _.castArray(options);

    await eachAsync_(settingGroups, async (options) => {
        const router = app.router.createRouter(baseRoute);

        const resourcesPath = options.$controllerPath || 'resources';
        const kebabify = options.$urlDasherize;

        app.useMiddleware(
            router,
            await (
                await app.getMiddlewareFactory_('jsonError')
            )(options.$errorOptions, app),
            'jsonError'
        );

        if (options.$middlewares) {
            await app.useMiddlewares_(router, options.$middlewares);
        }

        const controllers = await loadControllers_(app, options.$source, resourcesPath, options.$packageName);

        await batchAsync_(controllers, async (controller, entityNameWithPath) => {
            if (typeof controller === 'function') {
                controller = new controller(app);
            }

            // compatible with the api generator
            entityNameWithPath = replaceAll(entityNameWithPath, '__', '/');
            const pathNodes = entityNameWithPath.split('/');
            const entityName = pathNodes[pathNodes.length - 1];

            let baseEndpoint;
            if (entityNameWithPath in options) {
                baseEndpoint = text.ensureStartsWith(text.dropIfEndsWith(options[entityNameWithPath], '/'), '/');
            } else {
                const urlPath = pathNodes.map((p) => (kebabify ? naming.kebabCase(p) : p)).join('/');
                baseEndpoint = text.ensureStartsWith(urlPath, '/');
            }

            let idName = naming.camelCase(entityName) + 'Id';
            let endpointWithId = appendId(baseEndpoint, idName);

            //todo: add options

            async function addRoute_(methodName, httpMethod) {
                if (hasMethod(controller, methodName)) {
                    const _action = controller[methodName].bind(controller);
                    const _middlewares = controller[methodName].__metaMiddlewares;
                    await app.addRoute_(
                        router,
                        httpMethod,
                        baseEndpoint,
                        _middlewares ? [..._middlewares, _action] : _action
                    );
                }
            }

            async function addRouteWithId_(methodName, httpMethod) {
                if (hasMethod(controller, methodName)) {
                    const _action = (ctx) => controller[methodName](ctx, ctx.params[idName]);
                    const _middlewares = controller[methodName].__metaMiddlewares;
                    await app.addRoute_(
                        router,
                        httpMethod,
                        endpointWithId,
                        _middlewares ? [..._middlewares, _action] : _action
                    );
                }
            }

            await addRoute_('query_', 'get');
            await addRouteWithId_('get_', 'get');
            await addRoute_('post_', 'post');
            await addRouteWithId_('put_', 'put');
            await addRouteWithId_('patch_', 'patch');
            await addRouteWithId_('delete_', 'delete');

            await addRoute_('putMany_', 'put');
            await addRoute_('patchMany_', 'patch');
            await addRoute_('deleteMany_', 'delete');
        });

        app.addRouter(router);
    });
};

export default jaRestRouter;
