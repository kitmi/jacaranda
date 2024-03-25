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
const _utils = require("@kitmi/utils");
const _types = require("@kitmi/types");
const _helpers = require("../helpers");
/**
 * Rule based router.
 * @module Router_Rule
 */ /**
 * Create a rule-based router.
 * @param {Routable} app
 * @param {string} baseRoute
 * @param {object} options
 * @example
 * '<base path>': {
 *     rule: {
 *         $middlewares: {} | [],
*          // type 1, default is "get", methods mapped to one action
*          '<sub route>': '<controller with relative path>.<action>',
*
*          // type 2, different methods mapped to different method
*          '<sub route>': {
*             '<method>': '<controller with relative path>.<action>'
*          },
*
*          // type 3, with middleware
*          '<sub route>': {
*              '<method>': {
*                 '<middleware name>': { //middleware options }
*              }
*          },
*
*          // type 4, all methods mapped to one action
*          '<method>:/<sub route>': '<controller with relative path>.<action>'
*
*          // type 5, all methods mapped to one action
*          '<method>:/<sub route>': {
*              '<middleware name>': { //middleware options }
*          }
 *     }
 * }
 */ async function load_(app, baseRoute, options) {
    let router = app.router.createRouter(baseRoute);
    if (options.$middlewares) {
        await app.useMiddlewares_(router, options.$middlewares);
    }
    await (0, _utils.eachAsync_)(options, async (methods, subRoute)=>{
        if (subRoute[0] === '$') {
            return;
        }
        let pos = subRoute.indexOf(':/');
        if (pos !== -1) {
            if (pos === 0) {
                throw new _types.InvalidConfiguration('Invalid route rule syntax: ' + subRoute, app, `routing[${baseRoute}].rule.rules`);
            }
            // like get:/, or post:/
            let embeddedMethod = subRoute.substr(0, pos).toLocaleLowerCase();
            subRoute = subRoute.substr(pos + 2);
            methods = {
                [embeddedMethod]: methods
            };
        }
        subRoute = _utils.text.ensureStartsWith(subRoute, '/');
        if (typeof methods === 'string' || Array.isArray(methods)) {
            methods = {
                get: methods
            };
        }
        await (0, _utils.eachAsync_)(methods, async (middlewares, method)=>{
            if (!_helpers.supportedMethods.has(method) && method !== 'all') {
                throw new _types.InvalidConfiguration('Unsupported http method: ' + method, app, `routing[${baseRoute}].rule.rules[${subRoute}]`);
            }
            await app.addRoute_(router, method, subRoute, middlewares);
        });
    });
    app.addRouter(router);
}
const _default = load_;

//# sourceMappingURL=rule.js.map