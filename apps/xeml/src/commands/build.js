const path = require('node:path');
const { fs } = require("@kitmi/sys");
const { _, eachAsync_ } = require('@kitmi/utils');

const Linker = require('../lang/Linker');

const { getSchemaConnectors } = require('../utils/helpers');

/**
 * Build database scripts and entity models from oolong files.
 * @param {ServiceContainer} app
 * @returns {Promise}
 */
module.exports = async (app) => {
    app.log('verbose', `${app.name} build`);    

    const modelService = app.getService('model');

    const schemaObjects = Linker.buildSchemaObjects(app, modelService.config);   

    let schemaToConnector = modelService.getConnectors();

    return eachAsync_(modelService.config.schemaSet, async (deploymentSetting, schemaName) => {      
        app.log('verbose', `Processing schema "${schemaName}" ...`);   
        
        let schema = schemaObjects[schemaName];

        if (!schema) {
            throw new Error(`Schema "${schemaName}" not found in xeml entry files."`);
        }

        let connector = schemaToConnector[schemaName];

        let DbModeler = require(`../modeler/database/${connector.driver}/Modeler`);
        let dbModeler = new DbModeler(context, schema.linker, connector, deploymentSetting.extraOptions);
        let refinedSchema = dbModeler.modeling(schema, schemaToConnector);

        if (context.saveIntermediate) {
            let jsFile = path.resolve(context.gemlPath, schemaName + ".model.json");
            fs.writeFileSync(jsFile, JSON.stringify(refinedSchema.toJSON(), null, 4));
        }

        const DaoModeler = require('../modeler/Dao');
        let daoModeler = new DaoModeler(context, schema.linker, connector);

        return daoModeler.modeling_(refinedSchema);
    });  
};
