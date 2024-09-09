require('@swc-node/register'); // required for requiring esm modules at line 31
const path = require('node:path');
const { _, eachAsync_, isEmpty } = require('@kitmi/utils');
const Linker = require('../lang/Linker');
const { importDataFiles, getVersionInfo, getSchemaDigest } = require('../utils/helpers');

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

    let targetModule = require(path.resolve(packageJson.main));

    app.registry.db = { ...app.registry.db, ...targetModule.databases };

    if (reset) {      
        await eachAsync_(modelService.config.schemaSet, async (schemaConfig, schemaName) => {
            const db = app.db(schemaName);        
        
            const Migrator = require(`../migration/${db.driver}`);
            const migrator = new Migrator(app, modelService, db);
    
            await migrator.reset_();    
        });

        return eachAsync_(modelService.config.schemaSet, async (schemaConfig, schemaName) => {
            const db = app.db(schemaName);        
        
            const Migrator = require(`../migration/${db.driver}`);
            const migrator = new Migrator(app, modelService, db);
    
            await migrator.create_(schemaConfig.options);      
    
            await importDataFiles(migrator, '_init');  
        });
    } 

    const schemaObjects = Linker.buildSchemaObjects(app, modelService.config);   

    return eachAsync_(modelService.config.schemaSet, async (schemaConfig, schemaName) => {
        const db = app.db(schemaName);      

        const schema = schemaObjects[schemaName];

        if (!schema) {
            throw new InvalidArgument(`Schema "${schemaName}" not found in xeml entry files."`, {
                schemaName,
                schemaPath: path.resolve(modelService.config.schemaPath)
            });
        }
        
        const verContent = getVersionInfo(modelService, schemaName);
        
        const DbModeler = require(`../modeler/database/${db.connector.driver}/Modeler`);
        const dbModeler = new DbModeler(modelService, schema.linker, db.connector, schemaConfig.options);

        const refinedSchema = await dbModeler.modeling_(schema, true);
        const schemaJSON = refinedSchema.toJSON();
        const digest = getSchemaDigest(schemaJSON);

        if (digest !== verContent.digest) {
            throw new Error(`Schema "${schemaName}" has been modified. Please rebuild the models.`);
        }

        const versionDir = await dbModeler.buildMigration_(db, schemaName, verContent, refinedSchema);

        if (versionDir === false) {
            app.log('info', `The current version of database structure of "${schemaName}" is up to date.`);
            return;
        }

        if (!isEmpty(dbModeler.warnings)) {
            Object.values(dbModeler.warnings).forEach(warning => app.log('warn', warning));
        }

        dbModeler.writeMetadata(verContent, schemaJSON, versionDir, true);
    
        const Migrator = require(`../migration/${db.driver}`);
        const migrator = new Migrator(app, modelService, db);
    
        await migrator.up_(versionDir);   
        
        migrator.dbScriptPath = path.join(migrator.scriptPath, versionDir);
        await importDataFiles(migrator, '_init');  
    });    
};
