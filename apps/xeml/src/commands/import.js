const { throwIfFileNotExist, importDataFiles } = require('../utils/helpers');

/**
 * Build database scripts and entity models from oolong files.
 * @param {ServiceContainer} app
 * @param {object} context 
 * @property {string} context.gemlPath
 * @property {string} context.modelPath         
 * @property {string} context.scriptPath
 * @property {string} context.manifestPath
 * @property {bool} context.useJsonSource
 * @property {bool} context.saveIntermediate
 * @property {object} context.schemas   
 * @returns {Promise}
 */
module.exports = async (app, context) => {
    app.log('verbose', `${app.name} import`);

    throwIfFileNotExist("modelPath", context.modelPath);
    throwIfFileNotExist("scriptPath", context.scriptPath);

    let schemaName = app.option('schema');
    let dataset = app.option('dataset');
    let ignoreDuplicate = app.option('ignore');

    let schemaConfig = context.schemas[schemaName];
    if (!schemaConfig) {
        throw new Error(`Schema "${schemaName}" not found in geml config.`);
    }

    const db = app.db(schemaName);        
    
    const Migrator = require(`../migration/${db.driver}`);
    const migrator = new Migrator(app, context, db);

    await importDataFiles(migrator, dataset, ignoreDuplicate);  
};
