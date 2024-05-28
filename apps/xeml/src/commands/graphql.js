const { _, eachAsync_ } = require('@genx/july');
const { throwIfFileNotExist, getSchemaConnectors } = require('../utils/helpers');
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
    app.log('verbose', `${app.name} graphql`);

    throwIfFileNotExist("gemlPath", context.gemlPath);

    const schemaObjects = Linker.buildSchemaObjects(app, context);

    if (_.isEmpty(context.schemas)) {
        throw new Error(`Missing schema data source setting. Please run "${app.name} connect" to configure data source first.`);
    }

    let schemaToConnector = getSchemaConnectors(app, context.schemas);

    return eachAsync_(context.schemas, async (deploymentSetting, schemaName) => {      
        app.log('verbose', `Processing schema "${schemaName}" ...`);   
        
        let schema = schemaObjects[schemaName];

        if (!schema) {
            throw new Error(`Schema "${schemaName}" not found in model source."`);
        }

        let connector = schemaToConnector[schemaName];

        const skipGeneration = true;

        let DbModeler = require(`../modeler/database/${connector.driver}/Modeler`);
        let dbModeler = new DbModeler(context, schema.linker, connector, deploymentSetting.extraOptions);
        let refinedSchema = dbModeler.modeling(schema, schemaToConnector, skipGeneration);

        const GraphQLModeler = require('../modeler/GraphQL');
        let graphQLModeler = new GraphQLModeler(context, schema.linker, connector);

        return graphQLModeler.modeling_(refinedSchema);
    });            
};
