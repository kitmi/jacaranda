require('@swc-node/register');
const path = require('node:path');
const { _, eachAsync_, esmCheck } = require('@kitmi/utils');
const { requireFrom } = require('@kitmi/sys');
const { importDataFiles } = require('../utils/helpers');

/**
 * Build database scripts and entity models from oolong files.
 * @param {ServiceContainer} app
 * @returns {Promise}
 */
module.exports = async (app) => {
    app.log('verbose', `${app.name} migrate`);

    let reset = app.options.argv['reset'];

    const modelService = app.getService('dataModel');
    const packageJsonFile = path.resolve('package.json');
    const packageJson = require(packageJsonFile);    

    let targetModule;

    try {
        targetModule = requireFrom(packageJson.name, process.cwd());        
    } catch (error) {
        if (error.code !== 'MODULE_NOT_FOUND') {
            throw error;
        }

        targetModule = require(path.resolve(packageJson.main));
    }    

    app.registry.db = { ...app.registry.db, ...targetModule.databases };

    if (reset) {
        await eachAsync_(Object.keys(modelService.config.schemaSet).reverse(), async (schemaName) => {            
            const db = app.db(schemaName);
    
            const Migrator = require(`../migration/${db.driver}`);
            const migrator = new Migrator(app, modelService, db);

            await migrator.reset_();    
        });
    }

    return eachAsync_(modelService.config.schemaSet, async (schemaConfig, schemaName) => {
        const db = app.db(schemaName);        
    
        const Migrator = require(`../migration/${db.driver}`);
        const migrator = new Migrator(app, modelService, db);

        await migrator.create_(schemaConfig.options);      

        try {
            await importDataFiles(migrator, '_init');  
        } catch (e) {
            app.logError(e);
        }
    });
};
