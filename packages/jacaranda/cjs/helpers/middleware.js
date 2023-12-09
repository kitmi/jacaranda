"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return _default;
    }
});
const _types = require("@kitmi/types");
/**
 * Decorator for adding middlewares to a function.
 * @param  {...any} middlewares
 * @returns
 */ function middleware(...middlewares) {
    return function(target, name, descriptor) {
        let targetFunction, isHof = false;
        if (arguments.length === 1 && typeof target === 'function') {
            targetFunction = target;
            isHof = true;
        } else if (descriptor && descriptor.value) {
            targetFunction = descriptor.value;
            descriptor.enumerable = true;
        } else {
            throw new _types.ApplicationError('Invalid usage of middleware decorator.');
        }
        if (middlewares.length > 0) {
            targetFunction.__metaMiddlewares = middlewares;
        }
        return isHof ? targetFunction : descriptor;
    };
}
const _default = middleware;

//# sourceMappingURL=middleware.js.map