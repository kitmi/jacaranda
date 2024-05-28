const path = require('path');
const { getSchemaConnectors } = require('../utils/helpers');
const { fs, isDirEmpty } = require('@genx/sys');

/**
 * Pull schema from database (reverse engineering).
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
    app.log('verbose', `${app.name} pull`);

    let schemaName = app.option('schema');
    let override = app.option('override');

    let schemaToConnector = getSchemaConnectors(app, context.schemas);
    let connector = schemaToConnector[schemaName];

    if (!context.manifestPath) {
        throw new Error('Config "geml.manifestPath" for "pull" command is required.');
    }

    let targetPath = path.join(context.manifestPath, 'reverse');
    fs.ensureDirSync(targetPath);

    if (!override && !isDirEmpty(targetPath)) {
        throw new Error(`Target path "${targetPath}" is not empty. Use --override to force.`);
    }

    const ReserveEngineering = require(`../modeler/database/${connector.driver}/ReverseEngineering`);
    let modeler = new ReserveEngineering(context, app, connector);

    await modeler.reverse_(targetPath);
};
