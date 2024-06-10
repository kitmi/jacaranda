const path = require('node:path');
const { _, naming, eachAsync_ } = require('@kitmi/utils');
const del = require('del');
const Linker = require('../lang/Linker');

/**
 * Build database scripts and entity models from oolong files.
 * @param {ServiceContainer} app
 * @returns {Promise}
 */
module.exports = async (app) => {
    app.log('verbose', `${app.name} clean`);

    const modelService = app.getService('dataModel');

    const schemaObjects = Linker.buildSchemaObjects(app, modelService.config);   

    const jsonOnly = app.options.argv['json-only'];
    
    const jsonFiles = path.join(modelService.config.schemaPath, '**/*.json');
    await del(jsonFiles);
    app.log('info', `Deleted intermediate files.`);   

    if (!jsonOnly) {
        return eachAsync_(schemaObjects, async (schema, schemaName) => {      
            app.log('verbose', `Removing auto-generated files of schema "${schemaName}" ...`);   

            await del([
                path.join(modelService.config.manifestPath, schemaName,  '*.js'),
                path.join(modelService.config.modelPath, naming.pascalCase(schemaName) + '.js'),
                path.join(modelService.config.modelPath, schemaName, '*.js'),
                path.join(modelService.config.modelPath, schemaName, 'inputs', '*.js'),
                path.join(modelService.config.modelPath, schemaName, 'types', '*.js'),
            ]);

            app.log('info', `Removed auto-generated files of schema "${schemaName}".`);           
        });            
    }
};
