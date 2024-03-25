/**
 * Middleware to check user logged in status based on passport
 * @module Middleware_PassportCheck
 */

import { HttpCode } from '@kitmi/types';

const middlewareName = 'passportCheck';

/**
 * Initialize ensureLoggedIn middleware
 * @param {object} options
 * @property {string} [options.loginUrl] - If given, will redirect to loginUrl if not loggedIn
 * @property {boolean} [options.successReturnToOrRedirect] - If given, will redirect to loginUrl if not loggedIn
 * @param {Routable} app
 */
const passportCheck = (options, app) => {
    const { successReturnToOrRedirect, loginUrl } = app.middlewareConfig(
        opt,
        {
            schema: {
                successReturnToOrRedirect: { type: 'boolean', default: false },
                loginUrl: { type: 'type', optional: true },
            },
        },
        middlewareName
    );

    app.requireServices(['passport']);

    return async (ctx, next) => {
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
    };
};

export default passportCheck;
