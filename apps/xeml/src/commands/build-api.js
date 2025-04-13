const path = require('node:path');
const { cmd } = require('@kitmi/sys');
const { _, eachAsync_, isEmpty, sleep_ } = require('@kitmi/utils');
const { InvalidArgument } = require('@kitmi/types');
const Linker = require('../lang/Linker');
const { getPackageRoot } = require('../utils/helpers');


/**
 * Build API from entity model and api schema.
 * @param {ServiceContainer} app
 * @returns {Promise}
 */
module.exports = async (app) => {
    app.log('verbose', `${app.name} build-api`);

    const modelService = app.getService('dataModel');
    const packageJsonFile = path.resolve('package.json');
    const packageJson = require(packageJsonFile);

    const schemaObjects = Linker.buildSchemaObjects(app, modelService.config);

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
        const refinedSchema = await dbModeler.modeling_(schema, true);

        if (!isEmpty(dbModeler.warnings)) {
            Object.values(dbModeler.warnings).forEach((warning) => app.log('warn', warning));
        }

        const ApiGenerator = require('../modeler/ApiGenerator');
        const apiGenerator = new ApiGenerator(modelService, schema.linker);

        const context = { groups: {} };

        if (modelService.config.apiExtends) {
            modelService.config.apiExtends.forEach((pkg) => {
                const pkgPath = getPackageRoot(pkg);
                const schemaPath = path.resolve(pkgPath, 'xeml', 'api');
                apiGenerator.prepareApiCommonContext(schemaPath, context, pkg);
            });
        }

        return apiGenerator.generateApi(refinedSchema, context, packageJson.name);
    });

    app.logger.flush();

    await sleep_(1000);

    try {
        await cmd.runLive_('pnpm', ['prettier']);
    } catch (e) {
        app.logError(e);
    }
};
