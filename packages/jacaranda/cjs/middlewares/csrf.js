/**
 * Cross-Site Request Forgery (CSRF) middleware
 * @module Middleware_Csrf
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
const DEFAULT_OPTS = {
    invalidSessionSecretMessage: 'Invalid session secret',
    invalidSessionSecretStatusCode: 403,
    invalidTokenMessage: 'Invalid CSRF token',
    invalidTokenStatusCode: 403,
    excludedMethods: [
        'GET',
        'HEAD',
        'OPTIONS'
    ],
    disableQuery: false
};
const csrf = async (options, app)=>{
    const CSRF = await app.tryRequire_('koa-csrf');
    const csrf = new CSRF({
        ...DEFAULT_OPTS,
        ...options
    });
    return csrf;
};
const _default = csrf;

//# sourceMappingURL=csrf.js.map