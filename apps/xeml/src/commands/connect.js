const { _, eachAsync_, get, set } = require('@genx/july');
const { fs } = require('@genx/sys');
const npmInstall_ = require('../utils/npmInstall_');

const dependencies = {
    "mysql": [ "mysql2" ],
    "mongodb": [ "mongodb" ],
    "rabbitmq": [ "amqplib" ],
};

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
    app.log('verbose', `${app.name} connect`);

    const schemaName = app.option('schema');
    const dataSourceType = app.option('dbms');
    const dataSourceName = app.option('ds');
    const connection = app.option('conn');  
    
    const config = await fs.readJson(context.configFullPath);
    const dsConfig = get(config, ['dataSource', dataSourceType, dataSourceName]);
    if (dsConfig != null) {
        throw new Error(`Data source "${dataSourceType}.${dataSourceName}" already exists.`);
    }

    set(config, ['dataSource', dataSourceType, dataSourceName], {
        connection,
        logStatement: true
    });    

    set(config, ['settings', 'geml', 'schemas', schemaName, "dataSource"], `${dataSourceType}.${dataSourceName}`);
    await fs.writeJson(context.configFullPath, config, { spaces: 4 });
    app.log('info', `Data source for schema "${schemaName}" is added into ${context.configFullPath}`);

    await npmInstall_(app, app.workingPath, dependencies[dataSourceType]);
};
