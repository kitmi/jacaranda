/**
 * Enable model feature
 * @module Feature_DataModel
 */

import { Feature } from '@kitmi/jacaranda';
import { _ } from '@kitmi/utils';

export default {
    stage: Feature.SERVICE,

    load_: async function (app, options, name) {
        const config = app.featureConfig(options, {
            schema: {
                schemaPath: { type: 'text', optional: true, default: 'schema' },
                modelPath: { type: 'text', optional: true, default: 'src/models' },
                migrationPath: { type: 'text', optional: true, default: 'src/migrations' },
                schemaSet: {
                    type: 'object',
                    valueSchema: {
                        type: 'object',
                        schema: {
                            dataSource: { type: 'text' },
                        },
                    },
                },
                dependencies: {
                    type: 'object',
                    optional: true,
                },
            },
        }, name);

        const service = {
            config,
            getConnectors: () => {
                return _.mapValues(config.schemaSet, (repoConfig, name) => {
                    let connector = app.getService(repoConfig.dataSource);
                    if (!connector) {
                        throw new Error(`Data source connector [${repoConfig.dataSource}] not found for schema "${name}".`);
                    } 
                    return connector;
                });
            }
        };

        app.registerService(name, service);
    },
};
