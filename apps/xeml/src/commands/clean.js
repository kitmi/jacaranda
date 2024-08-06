const path = require('node:path');
const fs = require('node:fs');
const { _, naming, batchAsync_ } = require('@kitmi/utils');
const del = require('del');
const Linker = require('../lang/Linker');
const { globSync } = require("glob");

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
    
    const jsonFiles = [ 
        path.join(modelService.config.schemaPath, '**/*.json'),        
    ];
    
    let deleted = await del(jsonFiles);
    deleted.forEach(file => app.log('info', `Deleted "${file}".`));

    await batchAsync_(schemaObjects, async (schema, schemaName) => {      
        deleted = await del([
            path.join(modelService.config.modelPath, schemaName, 'views', '*.json'),
        ]);
        deleted.forEach(file => app.log('info', `Deleted "${file}".`));
    });

    app.log('info', `Deleted intermediate files.`);   

    if (!jsonOnly) {
        return batchAsync_(schemaObjects, async (schema, schemaName) => {      
            app.log('verbose', `Removing out-dated files of schema "${schemaName}" ...`);   

            deleted = await del([                
                path.join(modelService.config.modelPath, naming.pascalCase(schemaName) + '.js'),                
                path.join(modelService.config.modelPath, schemaName, '*.js'),
                path.join(modelService.config.modelPath, schemaName, 'inputs', '*.js'),
                path.join(modelService.config.modelPath, schemaName, 'types', '*.js'),                
            ]);       
            deleted.forEach(file => app.log('info', `Deleted "${file}".`));

            const verFile = path.resolve(modelService.config.migrationPath, schemaName + ".ver.json");
            if (!fs.existsSync(verFile)) {
                return;
            }

            const files = globSync([
                path.join(modelService.config.modelPath, schemaName, 'activators', '*.js'),
                path.join(modelService.config.modelPath, schemaName, 'processors', '*.js'),
                path.join(modelService.config.modelPath, schemaName, 'validators', '*.js'),
            ]);

            const verContent = JSON.parse(fs.readFileSync(verFile, 'utf8'));

            const toDelete = [];
            
            await batchAsync_(files, async file => {
                const fp = path.resolve(file);
                // read first line, get the version number
                const content = fs.readFileSync(fp, 'utf8');
                const lines = content.split('\n', 2);
                const line1 = lines[0];
                const pos = line1.indexOf('v.');
                if (pos > 0) {
                    const ver = parseInt(line1.substring(pos + 2));                    
                    if (ver < verContent.version) {
                        toDelete.push(fp);
                    }
                } else {
                    toDelete.push(fp);                
                }
            });

            deleted = await del(toDelete);
            deleted.forEach(file => app.log('info', `Deleted "${file}".`));

            app.log('info', `Removed out-dated files of schema "${schemaName}".`);           
        });            
    }
};
