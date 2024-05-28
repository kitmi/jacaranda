const path = require('path');
const { _, naming, eachAsync_ } = require('@genx/july');
const del = require('del');
const { throwIfFileNotExist } = require('../utils/helpers');
const Linker = require('../lang/Linker');


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
    app.log('verbose', `${app.name} clean`);

    throwIfFileNotExist("gemlPath", context.gemlPath);

    const schemaObjects = Linker.buildSchemaObjects(app, context);

    const jsonOnly = app.option('json-only');
    
    const jsonFiles = path.join(context.gemlPath, '**/*.json');
    await del(jsonFiles);
    app.log('info', `Deleted intermediate files.`);   

    if (!jsonOnly) {
        return eachAsync_(schemaObjects, async (schema, schemaName) => {      
            app.log('verbose', `Removing auto-generated files of schema "${schemaName}" ...`);   

            await del([
                path.join(context.manifestPath, schemaName,  '*.js'),
                path.join(context.manifestPath, schemaName,  '*.json'),
                path.join(context.modelPath, naming.pascalCase(schemaName) + '.js'),
                path.join(context.modelPath, schemaName, 'base', '*.js'),
                path.join(context.modelPath, schemaName, 'inputs', '*.js'),
                path.join(context.modelPath, schemaName, 'types', '*.js'),
            ]);

            app.log('info', `Removed auto-generated files of schema "${schemaName}".`);           
        });            
    }
};
