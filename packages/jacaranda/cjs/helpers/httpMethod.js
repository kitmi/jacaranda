"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    Delete: function() {
        return Delete;
    },
    Get: function() {
        return Get;
    },
    Post: function() {
        return Post;
    },
    Put: function() {
        return Put;
    },
    default: function() {
        return _default;
    }
});
const _utils = require("@kitmi/utils");
const _types = require("@kitmi/types");
/**
 * Decorator for http method
 * @param {*} method
 * @param {*} middlewares
 * @returns
 */ function httpMethod(method, middlewares) {
    if (arguments.length === 3) {
        return httpMethod('get')(...Array.prototype.slice.call(arguments));
    }
    return function(target, name, descriptor) {
        let targetFunction, isHof = false;
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
            throw new _types.ApplicationError('Invalid usage of httpMethod decorator.');
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
                if ((0, _utils.isPlainObject)(middlewares)) {
                    targetFunction.__metaMiddlewares = _utils._.map(middlewares, (options, name)=>({
                            name,
                            options
                        }));
                } else {
                    targetFunction.__metaMiddlewares = _utils._.castArray(middlewares);
                }
            }
        }
        return isHof ? targetFunction : descriptor;
    };
}
const makeShortcut = (method)=>(route, middlewares)=>httpMethod(route ? `${method}:${(0, _utils.ensureStartsWith)(route, '/')}` : method, middlewares);
const Get = makeShortcut('get');
const Post = makeShortcut('post');
const Put = makeShortcut('put');
const Delete = makeShortcut('del');
const _default = httpMethod;

//# sourceMappingURL=httpMethod.js.map