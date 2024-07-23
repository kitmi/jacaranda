/**
 * Middleware to check user logged in status based on passport
 * @module Middleware_PassportCheck
 */

import { HttpCode } from '@kitmi/types';
import { connect } from '@kitmi/jacaranda';

/**
 * Initialize ensureLoggedIn middleware
 * @param {object} opt
 * @property {string} [opt.passportService] - Passport service name
 * @property {string} [opt.loginUrl] - If given, will redirect to loginUrl if not loggedIn
 * @property {boolean} [opt.successReturnToOrRedirect] - If given, will redirect to loginUrl if not loggedIn
 * @param {Routable} app
 */
const passportCheck = (opt, app, name) => {
    const { passportService, successReturnToOrRedirect, loginUrl } = app.middlewareConfig(
        opt,
        {
            schema: {
                passportService: { type: 'text', optional: true, default: 'passport' },
                successReturnToOrRedirect: { type: 'boolean', default: false },
                loginUrl: { type: 'type', optional: true },
            },
        },
        name
    );

    app.requireServices([passportService]);
    const service = app.getService(passportService);

    return connect(service.middleware, async (ctx, next) => {
        if (ctx.isAuthenticated()) {
            return next();
        }

        if (successReturnToOrRedirect && ctx.session) {
            ctx.session.returnTo = ctx.originalUrl || ctx.url;
        }

        if (!loginUrl) {
            ctx.throw(HttpCode.UNAUTHORIZED, 'authentication required');
        }

        return ctx.redirect(loginUrl);
    });
};

export default passportCheck;
