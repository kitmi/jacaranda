const path = require('node:path');
const { fs, cmd } = require("@kitmi/sys");
const { _, eachAsync_, isEmpty, sleep_ } = require('@kitmi/utils');
const { hash } = require('@kitmi/feat-cipher');
const Linker = require('../lang/Linker');

/**
 * Build database scripts and entity models from oolong files.
 * @param {ServiceContainer} app
 * @returns {Promise}
 */
module.exports = async (app) => {
    app.log('verbose', `${app.name} build`);    

    const modelService = app.getService('dataModel');

    const schemaObjects = Linker.buildSchemaObjects(app, modelService.config);   

    await eachAsync_(modelService.config.schemaSet, async (deploymentSetting, schemaName) => {      
        app.log('verbose', `Processing schema "${schemaName}" ...`);   
        
        let schema = schemaObjects[schemaName];

        if (!schema) {
            throw new Error(`Schema "${schemaName}" not found in xeml entry files."`);
        }

        const connector = modelService.getConnector(schemaName);

        let DbModeler = require(`../modeler/database/${connector.driver}/Modeler`);
        let dbModeler = new DbModeler(modelService, schema.linker, connector, deploymentSetting.options);
        let refinedSchema = dbModeler.modeling(schema);

        if (!isEmpty(dbModeler.warnings)) {
            Object.values(dbModeler.warnings).forEach(warning => app.log('warn', warning));
        }

        const stringifiedContent = JSON.stringify(refinedSchema.toJSON(), null, 4);
        const digest = hash('sha256', stringifiedContent);

        const verFile = path.resolve(modelService.config.migrationPath, schemaName + ".ver.json");
        const verContent = fs.existsSync(verFile) ? JSON.parse(fs.readFileSync(verFile, 'utf8')) : { version: 0 };
        
        if (!verContent.digest || verContent.digest !== digest) {
            verContent.digest = digest;
            verContent.version = verContent.version + 1;
            fs.writeFileSync(verFile, JSON.stringify(verContent, null, 4));
            app.log('info', `Schema "${schemaName}" updated to version ${verContent.version}.`);
        }        

        if (modelService.config.saveIntermediate) {
            let jsFile = path.resolve(modelService.config.schemaPath, schemaName + ".model.json");
            fs.writeFileSync(jsFile, stringifiedContent);
        }

        const DaoModeler = require('../modeler/Dao');
        let daoModeler = new DaoModeler(modelService, schema.linker, connector);

        return daoModeler.modeling_(refinedSchema, verContent);
    });  

    app.logger.flush();

    await sleep_(1000);

    try {
        await cmd.runLive_('pnpm', ['prettier']);
    } catch (e) {
        app.logError(e);
    }
};
