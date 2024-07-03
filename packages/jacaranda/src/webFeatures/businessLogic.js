/**
 * Enable business feature
 * @module Feature_Business
 */

import path from 'node:path';
import { Feature } from '@kitmi/jacaranda';
import { _ } from '@kitmi/utils';
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
                }
            },
            name
        );

        let businessClasses;

        app.bus = (businessName, schemaName, fromApp) => {
            let _app;

            if (fromApp) {
                if (fromApp.startsWith('/')) {
                    _app = app.server.getAppByRoute(fromApp);
                } else {
                    _app = app.server.getAppByAlias(fromApp);
                }

                return _app.bus(businessName, schemaName);
            }
            
            if (!businessClasses) {
                businessClasses = app.tryRequire(path.resolve(app.sourcePath, _path), true);
            }            

            const businessClass = businessClasses[businessName];
            if (!businessClass) {
                throw new InvalidArgument(`Business class "${businessName}" not found.`);
            }

            return new businessClass(app, schemaName || defaultSchema);
        };
    },
};
