/**
 * Enable passport feature
 * @module Feature_Passport
 */

import path from 'node:path';
import { batchAsync_, esmCheck } from '@kitmi/utils';
import Feature from '../Feature';
import { tryLoadFrom_ } from '../helpers/loadModuleFrom_';

export default {
    /**
     * This feature is loaded at service stage
     * @member {string}
     */
    stage: Feature.SERVICE,

    packages: ['koa-passport', 'passport'],

    /**
     * Load the feature
     * @param {Routable} app - The app module object
     * @param {object} options - Passport settings
     * @property {bool} [options.useSession=false] - Use session or not, default: false
     *
     * @property {object} options.init - Passport initialization settings
     * @property {string} [options.init.userProperty='user'] - User property name, default: user
     * @property {bool} [options.init.compat=false] - Backwards compatibility with old strategies, default: false
     *
     * @property {array} options.strategies - Passport strategies, e.g. [ 'local', 'facebook' ]
     * @property {bool|string} options.shareToServer - Expose the passport servcie to whole server
     * @returns {Promise.<*>}
     */
    load_: async function (app, options, name) {
        const { strategies, useSession, init, shareToServer } = app.featureConfig(
            options,
            {
                schema: {
                    strategies: {
                        type: 'array',
                        element: { type: 'text' },
                    },
                    useSession: { type: 'bool', default: false },
                    init: {
                        type: 'object',
                        optional: true,
                        schema: {
                            userProperty: { type: 'text', default: 'user' },
                            compat: { type: 'bool', default: false },
                        },
                    },
                    shareToServer: [
                        { type: 'text', optional: true },
                        { type: 'bool', optional: true, default: false },
                    ],
                },
            },
            name
        );

        const KoaPassport = (await app.tryRequire_('koa-passport', true)).KoaPassport;
        const passport = new KoaPassport();

        const initializeMiddleware = passport.initialize(init);

        passport.middleware = async (ctx, next) => {
            if (ctx.isAuthenticated != null) {
                return next();
            } 

            await initializeMiddleware(ctx, () => {
                if (useSession) {
                    return passport.session()(ctx, next);
                }

                return next();
            });            
        };        

        passport.hasStrategy = (name) => {
            return name in passport._strategies;
        };

        app.registerService(name, passport);

        if (shareToServer && app.host != null) {
            app.host.registerService(typeof shareToServer === 'string' ? shareToServer : name, passport);
        }

        return batchAsync_(strategies, async (strategy) => {
            const strategyInitiator = await tryLoadFrom_(app, 'Passport strategy', {
                'registry': {
                    name: strategy,
                    path: 'passports'
                },
                'project': {
                    name: strategy,
                    path: path.join(app.sourcePath, 'passports')
                }
            });
            
            return strategyInitiator(app, passport);
        });
    },
};
