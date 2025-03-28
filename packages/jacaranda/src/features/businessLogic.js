/**
 * Enable business feature
 * @module Feature_Business
 */

import path from 'node:path';
import Feature from '../Feature';
import { _, get as _get } from '@kitmi/utils';
import { InvalidArgument } from '@kitmi/types';

export default {
    stage: Feature.SERVICE,

    load_: async function (app, options, name) {
        const { path: _path, defaultSchema } = app.featureConfig(
            options,
            {
                schema: {
                    path: { type: 'text', default: 'business' },
                    defaultSchema: { type: 'text', optional: true },
                },
            },
            name
        );

        let businessClasses = _get(app.registry, _path);
        if (!businessClasses) {
            businessClasses = require(path.join(app.sourcePath, _path));
        }

        app.bus = (businessName, schemaName, fromApp, ctx) => {
            if (ctx == null && fromApp?.request) {
                ctx = fromApp;
                fromApp = null;
            }

            if (fromApp) {
                let _app;

                if (typeof fromApp === 'object') {
                    _app = fromApp;
                } else if (fromApp.startsWith('/')) {
                    _app = app.server.getAppByRoute(fromApp);
                } else {
                    _app = app.server.getAppByAlias(fromApp);
                }

                return _app.bus(businessName, schemaName, null, ctx);
            }

            const businessClass = businessClasses[businessName];
            if (!businessClass) {
                throw new InvalidArgument(`Business class "${businessName}" not found.`);
            }

            const _schemaName = schemaName || defaultSchema;

            if (businessClass.length > 0) {
                return new businessClass(app, _schemaName, ctx);
            }

            // compatibility with those who don't extend from Business class
            const business = new businessClass();
            business.app = app;
            business.db = app.db(_schemaName);
            if (ctx) {
                business.db = business.db.forkWithCtx(ctx);
            }
            return business;
        };

        app.useMiddleware(app.router, async (ctx, next) => {
            ctx.bus = (businessName, schemaName, fromApp) => app.bus(businessName, schemaName, fromApp, ctx);
            await next();
            delete ctx.bus;
        });
    },
};
