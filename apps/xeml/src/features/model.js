const { Feature } = require('@kitmi/jacaranda');
const { _ } = require('@kitmi/utils');
const { throwIfFileNotExist } = require('../utils/helpers');

module.exports = {
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

        throwIfFileNotExist('schemaPath', config.schemaPath);

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
