import { ApplicationError } from '@kitmi/types';

/**
 * Decorator for adding middlewares to a function.
 * @param  {...any} middlewares
 * @returns
 */
function middleware(...middlewares) {
    return function (target, name, descriptor) {
        let targetFunction,
            isHof = false;

        if (arguments.length === 1 && typeof target === 'function') {
            targetFunction = target;
            isHof = true;
        } else if (descriptor && descriptor.value) {
            targetFunction = descriptor.value;
            descriptor.enumerable = true;
        } else {
            throw new ApplicationError('Invalid usage of middleware decorator.');
        }

        if (middlewares.length > 0) {
            targetFunction.__metaMiddlewares = middlewares;
        }

        return isHof ? targetFunction : descriptor;
    };
}

export default middleware;
