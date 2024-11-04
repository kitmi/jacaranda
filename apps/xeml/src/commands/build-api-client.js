const path = require('node:path');
const { fs, cmd } = require("@kitmi/sys");
const { _, eachAsync_, isEmpty, sleep_ } = require('@kitmi/utils');
const { InvalidArgument } = require('@kitmi/types');
const Linker = require('../lang/Linker');
const { getVersionInfo, getSchemaDigest, writeVersionInfo } = require('../utils/helpers');

/**
 * Build database scripts and entity models from oolong files.
 * @param {ServiceContainer} app
 * @returns {Promise}
 */
module.exports = async (app) => {
    app.log('verbose', `${app.name} build-api-client`);    

    const modelService = app.getService('dataModel');

    const schemaObjects = Linker.buildSchemaObjects(app, modelService.config);   

    await eachAsync_(modelService.config.schemaSet, async (schemaConfig, schemaName) => {      
        app.log('verbose', `Processing schema "${schemaName}" ...`);   
        
        let schema = schemaObjects[schemaName];

        if (!schema) {
            throw new InvalidArgument(`Schema "${schemaName}" not found in xeml entry files."`, {
                schemaName,
                schemaPath: path.resolve(modelService.config.schemaPath)
            });
        }

        // cannot use db here, because the db model is not yet built
        const connector = modelService.getConnector(schemaName);

        const DbModeler = require(`../modeler/database/${connector.driver}/Modeler`);
        const dbModeler = new DbModeler(modelService, schema.linker, connector, schemaConfig.options);
        const refinedSchema = await dbModeler.modeling_(schema, true);

        const DaoModeler = require('../modeler/Dao');
        let daoModeler = new DaoModeler(modelService, schema.linker, connector);

        const verContent = getVersionInfo(modelService, schemaName);
        return daoModeler.buildApiClient(refinedSchema, verContent);
    });  

    app.logger.flush();
};
