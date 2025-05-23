const path = require('node:path');
const { fs, cmd } = require('@kitmi/sys');
const { _, eachAsync_, isEmpty, sleep_ } = require('@kitmi/utils');
const { InvalidArgument } = require('@kitmi/types');
const Linker = require('../lang/Linker');
const { getVersionInfo, getSchemaDigest, writeVersionInfo } = require('../utils/helpers');

/**
 * Build database scripts and entity models from xeml files.
 * @param {ServiceContainer} app
 * @returns {Promise}
 */
module.exports = async (app) => {
    app.log('verbose', `${app.name} build`);

    const modelService = app.getService('dataModel');

    const schemaObjects = Linker.buildSchemaObjects(app, modelService.config);

    const duplicateEntities = new Set();

    await eachAsync_(modelService.config.schemaSet, async (schemaConfig, schemaName) => {
        app.log('verbose', `Processing schema "${schemaName}" ...`);

        let schema = schemaObjects[schemaName];

        if (!schema) {
            throw new InvalidArgument(`Schema "${schemaName}" not found in xeml entry files."`, {
                schemaName,
                schemaPath: path.resolve(modelService.config.schemaPath),
            });
        }

        // cannot use db here, because the db model is not yet built
        const connector = modelService.getConnector(schemaName);

        const DbModeler = require(`../modeler/database/${connector.driver}/Modeler`);
        const dbModeler = new DbModeler(modelService, schema.linker, connector, schemaConfig.options);
        const refinedSchema = await dbModeler.modeling_(schema, false, duplicateEntities);
        Object.keys(refinedSchema.entities).forEach((entityName) => duplicateEntities.add(entityName));

        const schemaJSON = refinedSchema.toJSON();

        if (!isEmpty(dbModeler.warnings)) {
            Object.values(dbModeler.warnings).forEach((warning) => app.log('warn', warning));
        }

        const digest = getSchemaDigest(schemaJSON);
        const verContent = getVersionInfo(modelService, schemaName);

        if (!verContent.digest || verContent.digest !== digest) {
            verContent.digest = digest;
            verContent.version = verContent.version + 1;
            writeVersionInfo(modelService, schemaName, verContent);

            app.log('info', `Schema "${schemaName}" updated to version ${verContent.version}.`);
        }

        const migrationDir = path.join('postgres', schemaName);
        dbModeler.writeMetadata(verContent, schemaJSON, migrationDir);

        if (modelService.config.saveIntermediate) {
            let jsFile = path.resolve(modelService.config.schemaPath, schemaName + '.model.json');
            fs.writeFileSync(jsFile, JSON.stringify(schemaJSON, null, 4));
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
