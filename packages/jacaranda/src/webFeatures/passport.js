/**
 * Enable passport feature
 * @module Feature_Passport
 */

import path from 'node:path';
import { batchAsync_, esmCheck } from '@kitmi/utils';
import Feature from '../Feature';

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
     * @param {object} config - Passport settings
     * @property {bool} [config.useSession=false] - Use session or not, default: false
     *
     * @property {object} config.init - Passport initialization settings
     * @property {string} [config.init.userProperty='user'] - User property name, default: user
     *
     * @property {array} config.strategies - Passport strategies, e.g. [ 'local', 'facebook' ]
     * @property {array} config.shareToServer - Expose the passport servcie to while server
     * @returns {Promise.<*>}
     */
    load_: function (app, options, name) {
        const { strategies, useSession, init, shareToServer } =
            app.featureConfig(
                options,
                {
                    schema: {
                        strategies: {
                            type: 'array',
                            element: { type: 'text' },
                        },
                        useSession: { type: 'bool', default: false },
                        init: { type: 'object', optional: true },
                        shareToServer: { type: 'bool', default: false },
                    },
                },
                name
            );

        const KoaPassport = app.tryRequire('koa-passport').KoaPassport;
        const passport = new KoaPassport();

        let initializeMiddleware = passport.initialize(init);

        passport.middlewares = useSession
            ? [initializeMiddleware, passport.session()]
            : initializeMiddleware;

        app.on('before:' + Feature.FINAL, async () => {
            await app.useMiddlewares_(app.router, passport.middlewares);
        });

        passport.hasStrategy = (name) => {
            return name in passport._strategies;
        };

        app.registerService(name, passport);

        if (shareToServer && app.host != null) {
            app.host.registerService(name, passport);
        }

        return batchAsync_(strategies, async (strategy) => {
            const strategyScript = path.join(
                app.sourcePath,
                'passports',
                strategy
            );
            const strategyInitiator = esmCheck(require(strategyScript));
            return strategyInitiator(app, passport);
        });
    },
};
