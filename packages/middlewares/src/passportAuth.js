/**
 * Passport initialization middleware, required to initialize Passport service.
 * @module Middleware_PassportAuth
 */

/**
 * Create a passport authentication middleware.
 * @param {object} opt - Passport options
 * @property {string} [opt.passportService] - Passport service name
 * @property {string} opt.strategy - Passport strategy
 * @property {object} [opt.options] - Passport strategy options
 * @param {Routable} app
 * @returns {KoaActionFunction}
 */
const passportAuth = (opt, app) => {
    const { passportService, strategy, options } = app.middlewareConfig(
        opt,
        {
            schema: {
                passportService: { type: 'text', optional: true, default: 'passport' },
                strategy: { type: 'text' },
                options: { type: 'object', optional: true },
            },
        },
        'passportAuth'
    );

    app.requireServices([passportService]);

    const service = app.getService(passportService);

    return service.authenticate(strategy, options);
};

export default passportAuth;
