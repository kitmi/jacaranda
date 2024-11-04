/**
 * Enable dataModel feature
 * @module Feature_DataModel
 */

import { Feature } from '@kitmi/jacaranda';
import { _ } from '@kitmi/utils';

export default {
    stage: Feature.SERVICE,

    depends: ['dataSource'],

    load_: async function (app, options, name) {
        const config = app.featureConfig(
            options,
            {
                schema: {
                    schemaPath: { type: 'text', optional: true, default: 'xeml' },
                    sourcePath: { type: 'text', optional: true, default: 'src' },
                    modelPath: { type: 'text', optional: true, default: 'src/models' },
                    migrationPath: { type: 'text', optional: true, default: './migrations' },
                    manifestPath: { type: 'text', optional: true, default: './manifests' },
                    schemaSet: {
                        type: 'object',
                        valueSchema: {
                            type: 'object',
                            schema: {
                                dataSource: { type: 'text' },
                                options: { type: 'object', optional: true },
                            },
                        },
                    },
                    dependencies: {
                        type: 'object',
                        optional: true,
                    },
                    useJsonSource: { type: 'boolean', optional: true },
                    saveIntermediate: { type: 'boolean', optional: true },
                },
            },
            name
        );

        const connectors = _.mapValues(config.schemaSet, (repoConfig, name) => {
            let connector = app.getService(repoConfig.dataSource);
            if (!connector) {
                throw new Error(`Data source connector [${repoConfig.dataSource}] not found for schema "${name}".`);
            }
            return connector;
        });

        const service = {
            config,
            getConnectors: () => connectors,
            getConnector: (schemaName) => connectors[schemaName],
        };

        app.registerService(name, service);
    },
};
