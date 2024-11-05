/**
 * Enable db feature
 * @module Feature_Db
 */

import { Feature } from '@kitmi/jacaranda';
import { _ } from '@kitmi/utils';
import { InvalidArgument, InvalidConfiguration, ApplicationError } from '@kitmi/types';

export default {
    stage: Feature.SERVICE,

    load_: async function (app, options, name) {
        const config = app.featureConfig(
            options,
            {
                valueSchema: {
                    type: 'object',
                    schema: {
                        dataSource: { type: 'text' },
                        fromServer: { type: 'boolean', optional: true },
                        fromLib: { type: 'text', optional: true },
                    },
                },
            },
            name
        );

        let defaultDb = app.settings.defaultDb;
        let dbClasses = {};

        app.db = (dbName) => {
            dbName || (dbName = defaultDb);

            if (!dbName) {
                throw new InvalidArgument(
                    '"dbName" is required or "app.settings.defaultDb" should be set as a default value.'
                );
            }

            let db = dbClasses[dbName];

            if (db == null) {
                const dbConfig = config[dbName];
                if (dbConfig == null) {
                    throw new InvalidConfiguration(
                        `Configuration for db [${dbName}] not found.`,
                        app,
                        `db.[${dbName}]`
                    );
                }
                let connector;
                let sourceApp;

                if (dbConfig.fromServer) {
                    if (app.isServer) {
                        throw new InvalidConfiguration(
                            '"fromServer" should not be used in the server app itself.',
                            app,
                            `db.[${dbName}].fromServer`
                        );
                    }

                    sourceApp = app.server;
                    connector = sourceApp.getService(dbConfig.dataSource, true);
                } else if (dbConfig.fromLib) {
                    if (dbConfig.fromLib === app.name) {
                        throw new InvalidConfiguration(
                            '"fromLib" should not be used in the source libModule itself.',
                            app,
                            `db.[${dbName}].fromLib`
                        );
                    }

                    sourceApp = (app.server ? app.server : app).getLib(dbConfig.fromLib);
                    connector = sourceApp.getService(dbConfig.dataSource, true);
                } else {
                    sourceApp = app;
                    connector = sourceApp.getService(dbConfig.dataSource);
                }

                if (!connector) {
                    throw new InvalidConfiguration(
                        `Data source [${dbConfig.dataSource}] not found.`,
                        sourceApp,
                        `db.[${dbName}].dataSource`
                    );
                }

                const DbModel = sourceApp.registry?.db?.[dbName];
                if (DbModel == null) {
                    throw new ApplicationError(
                        `"${dbName}" cannot be found in "registry.db" of app "${sourceApp.name}".`
                    );
                }

                if (DbModel.meta.schemaName !== dbName) {
                    throw new ApplicationError(
                        `"${DbModel.meta.schemaName}" is not matching with the dbName "${dbName}". Please rebuild the model and make sure you configured the correct schema name.`
                    );
                }

                db = new DbModel(app, connector);
                dbClasses[dbName] = db;
            }

            return db;
        };
    },
};
