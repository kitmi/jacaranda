import { _, isPlainObject, ensureStartsWith } from '@kitmi/utils';
import { ApplicationError } from '@kitmi/types';

/**
 * Decorator for http method
 * @param {*} method
 * @param {*} middlewares
 * @returns {Function}
 */
function httpMethod(method, middlewares) {
    if (arguments.length === 3) {
        return httpMethod('get')(...Array.prototype.slice.call(arguments));
    }

    return function (target, name, descriptor) {
        let targetFunction,
            isHof = false;

        if (arguments.length === 1 && typeof target === 'function') {
            targetFunction = target;
            isHof = true;
        } else if (arguments.length === 1 && target.kind === 'method') {
            targetFunction = target.descriptor.value;
            target.descriptor.enumerable = true;
        } else if (descriptor && descriptor.value) {
            targetFunction = descriptor.value;
            descriptor.enumerable = true;
        } else {
            throw new ApplicationError('Invalid usage of httpMethod decorator.');
        }

        if (targetFunction) {
            if (typeof method === 'string') {
                let pos = method.indexOf(':/');

                if (pos !== -1) {
                    if (pos === 0) {
                        throw new Error('Invalid httpMethod decorator param: ' + method);
                    }

                    // like get:/, or post:/

                    //override actionName as route
                    targetFunction.__metaRoute = method.substring(pos + 1);
                    method = method.substring(0, pos).toLocaleLowerCase();
                }
            } else {
                method = 'get';
            }

            targetFunction.__metaHttpMethod = method;

            if (middlewares) {
                if (isPlainObject(middlewares)) {
                    targetFunction.__metaMiddlewares = _.map(middlewares, (options, name) => ({ name, options }));
                } else {
                    targetFunction.__metaMiddlewares = _.castArray(middlewares);
                }
            }
        }

        return isHof ? targetFunction : descriptor;
    };
}

const makeShortcut = (method) => (route, middlewares) =>
    httpMethod(route ? `${method}:${ensureStartsWith(route, '/')}` : method, middlewares);

// nestjs like decorators
export const Get = makeShortcut('get');
export const Post = makeShortcut('post');
export const Put = makeShortcut('put');
export const Delete = makeShortcut('del');

export default httpMethod;
