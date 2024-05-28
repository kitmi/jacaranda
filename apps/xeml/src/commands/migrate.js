const { _, eachAsync_ } = require('@genx/july');
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
    app.log('verbose', `${app.name} migrate`);

    throwIfFileNotExist("modelPath", context.modelPath);
    throwIfFileNotExist("scriptPath", context.scriptPath);

    let reset = app.option('reset');

    if (reset) {
        await eachAsync_(Object.keys(context.schemas).reverse(), async (schemaName) => {            
            const db = app.db(schemaName);
    
            const Migrator = require(`../migration/${db.driver}`);
            const migrator = new Migrator(app, context, db);

            await migrator.reset_();    
        });
    }

    return eachAsync_(context.schemas, async (schemaConfig, schemaName) => {
        const db = app.db(schemaName);        
    
        const Migrator = require(`../migration/${db.driver}`);
        const migrator = new Migrator(app, context, db);

        await migrator.create_(schemaConfig.extraOptions);      

        await importDataFiles(migrator, '_init');  
    });
};
