/**
 * Enable data source feature
 * @module Feature_DataSource
 */

import { Feature } from '@kitmi/jacaranda';
import { _ } from '@kitmi/utils';

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
        //const { Connector } = app.tryRequire('@genx/data');

        dataSources = app.featureConfig(dataSources, {
            type: 'object',
            valueSchema: {
                type: 'object',
                valueSchema: {
                    type: 'object',
                    schema: {
                        connection: { type: 'text' },
                        logStatements: { type: 'boolean', optional: true },
                    },
                },
            },
        }, name);

        /*

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
                
                let connectorService = Connector.createConnector(dbms, connectionString, { logger: loggerProxy, ...other });
                app.registerService(serviceName, connectorService);

                app.on('stopping', (elegantStoppers) => {
                    elegantStoppers.push(connectorService.end_());
                });
            });            
        });        
        */
    },
};
