import path from 'node:path';
import { naming, text, hasMethod, esmCheck, batchAsync_ } from '@kitmi/utils';
import { globSync } from 'glob';

/**
 * Simple RESTful router.
 * @module Router_REST
 */

/**
 * Create a RESTful router.
 * @param {*} app
 * @param {string} baseRoute
 * @param {object} options
 * @property {string} [options.$controllerPath]
 * @property {object} [options.$errorOptions]
 * @property {object|array} [options.$middlewares]
 * @example
 *  '<base path>': {
 *      REST: {
 *          $controllerPath:
 *          $errorOptions:
 *          $middlewares:
 *      }
 *  }
 *
 *  route                          http method    function of ctrl
 *  /:resource                     get            list
 *  /:resource                     post           create
 *  /:resource/:id                 get            detail
 *  /:resource/:id                 put            update
 *  /:resource/:id                 delete         remove
 */
const restRouter = async (app, baseRoute, options) => {
    let router = app.router.createRouter(baseRoute);

    let resourcePath = path.resolve(app.sourcePath, options.$controllerPath ?? 'resources');
    const kebabify = options.$urlDasherize;

    app.useMiddleware(router, await app.getMiddlewareFactory('jsonError')(options.$errorOptions, app), 'jsonError');

    if (options.$middlewares) {
        await app.useMiddlewares_(router, options.$middlewares);
    }

    let resourcesPath = path.join(resourcePath, '**', '*.js');
    let files = globSync(resourcesPath, { nodir: true });

    await batchAsync_(files, async (file) => {
        let relPath = path.relative(resourcePath, file);
        let batchUrl = text.ensureStartsWith(
            relPath
                .substring(0, relPath.length - 3)
                .split(path.sep)
                .map((p) => kebabify ? naming.kebabCase(p) : p)
                .join('/'),
            '/'
        );
        let singleUrl = batchUrl + '/:id';

        let controller = esmCheck(require(file));

        if (typeof controller === 'function') {
            controller = new controller(app);
        }

        if (hasMethod(controller, 'list')) {
            await app.addRoute_(router, 'get', batchUrl, (ctx) => controller.list(ctx));
        }

        if (hasMethod(controller, 'create')) {
            await app.addRoute_(router, 'post', batchUrl, (ctx) => controller.create(ctx));
        }

        if (hasMethod(controller, 'detail')) {
            await app.addRoute_(router, 'get', singleUrl, (ctx) => controller.detail(ctx));
        }

        if (hasMethod(controller, 'update')) {
            await app.addRoute_(router, 'put', singleUrl, (ctx) => controller.update(ctx));
        }

        if (hasMethod(controller, 'remove')) {
            await app.addRoute_(router, 'delete', singleUrl, (ctx) => controller.remove(ctx));
        }
    });

    app.addRouter(router);
};

export default restRouter;
