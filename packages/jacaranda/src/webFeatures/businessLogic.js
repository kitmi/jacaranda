/**
 * Enable business feature
 * @module Feature_Business
 */

import path from 'node:path';
import { Feature } from '@kitmi/jacaranda';
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

        let businessClasses;

        app.bus = (businessName, schemaName, fromApp) => {
            if (fromApp) {
                let _app;

                if (fromApp.startsWith('/')) {
                    _app = app.server.getAppByRoute(fromApp);
                } else {
                    _app = app.server.getAppByAlias(fromApp);
                }

                return _app.bus(businessName, schemaName);
            }

            if (!businessClasses) {
                businessClasses = _get(app.registry, _path, require(path.join(app.sourcePath, _path)));
            }

            const businessClass = businessClasses[businessName];
            if (!businessClass) {
                throw new InvalidArgument(`Business class "${businessName}" not found.`);
            }

            return new businessClass(app, schemaName || defaultSchema);
        };
    },
};
