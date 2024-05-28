/**
 * Passport initialization middleware, required to initialize Passport service.
 * @module Middleware_PassportAuth
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return _default;
    }
});
const middlewareName = 'passportAuth';
/**
 * Create a passport authentication middleware.
 * @param {object} opt - Passport options
 * @property {string} opt.strategy - Passport strategy
 * @property {object} [opt.options] - Passport strategy options
 * @param {Routable} app
 * @returns {KoaActionFunction}
 */ const passportAuth = (opt, app)=>{
    const { strategy, options } = app.middlewareConfig(opt, {
        schema: {
            strategy: {
                type: 'text'
            },
            options: {
                type: 'object',
                optional: true
            }
        }
    }, middlewareName);
    app.requireServices([
        'passport'
    ]);
    const passportService = app.getService('passport');
    return passportService.authenticate(strategy, options);
};
const _default = passportAuth;

//# sourceMappingURL=passportAuth.js.map