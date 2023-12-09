import { InvalidConfiguration } from '@kitmi/types';

/**
 * Passport initialization middleware, use the passport service exposed by other app to server.
 * @module Middleware_ServerPassport
 */

const middlewareName = 'middlewares.usePassport';

/**
 * Create a passport authentication middleware.
 * @param {object} opt - Passport options
 * @property {string} opt.strategy - Passport strategy
 * @property {object} [opt.options] - Passport strategy options
 * @property {object} [opt.customHandler] - Flag to use passport strategy customHandler
 * @param {Routable} app
 * @returns {KoaActionFunction}
 */
const usePassport = (opt, app) => {
    // if this app has no passport service, it will fallback to server
    if (app.getService('passport', true /* currentModuleOnly*/) != null) {
        throw new InvalidConfiguration('Passport middlewares has already been used if the passport service is enabled in this app.', app, middlewareName);
    }

    if (app.host == null) {
        throw new InvalidConfiguration('"usePassport" middleware can only be used in an app module.', app, middlewareName);
    }

    const passportService = app.host.getService('passport');

    if (!passportService) {
        throw new InvalidConfiguration('Passport feature is not enabled.', app, middlewareName);
    }

    return passportService.middlewares;
};

export default usePassport;
