/**
 * Enable dataSource feature
 * @module Feature_DataSource
 */

import { Feature } from '@kitmi/jacaranda';
import { _ } from '@kitmi/utils';
import * as drivers from '../drivers';

export default {
    /**
     * This feature is loaded at service stage
     * @member {string}
     */
    stage: Feature.SERVICE,

    /**
     * Load the feature
     * @param {ServiceContainer} app - The app module object
     * @param {object} dataSources - Datasource settings
     * @returns {Promise.<*>}
     */
    load_: async (app, dataSources, name) => {
        dataSources = app.featureConfig(dataSources, {
            type: 'object',
            valueSchema: {
                type: 'object',
                valueSchema: {
                    type: 'object',
                    schema: {
                        connection: { type: 'text' },
                        logStatement: { type: 'boolean', optional: true },
                        logConnection: { type: 'boolean', optional: true },
                    },
                    keepUnsanitized: true,
                },
            },
        }, name);

        _.forOwn(dataSources, (dataSource, dbms) => {
            _.forOwn(dataSource, (config, connectorName) => {
                let serviceName = dbms + '.' + connectorName;

                if (!config.connection) {
                    throw new InvalidConfiguration(
                        `Missing connection config for data source "${serviceName}".`,
                        app,
                        `dataSource.${dbms}.${connectorName}`
                    );
                }
                
                let { connection: connectionString, ...other } = config;  

                if (!(dbms in drivers)) {
                    throw new Error(`Unsupported connector driver: "${dbms}"!`);
                }

                const Connector = drivers[dbms].Connector;
                other.connectorName = connectorName;
                
                const connectorService = new Connector(app, connectionString, other);
                app.registerService(serviceName, connectorService);

                app.on('stopping', async () => {
                   await connectorService.end_();
                });
            });            
        });   
    },
};
