const path = require('path');
const { fs } = require('@genx/sys');
const copyFileFromTemplate_ = require('../utils/copyFileFromTemplate_');
const npmInstall_ = require('../utils/npmInstall_');

const gxDataPkg = 'genx-tech/gx-data#v2';
const gxModelPkg = 'genx-tech/gx-model#v2';

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
    app.log('verbose', `${app.name} init`);

    const schemaName = app.commandLine.option('schema');

    let workingPath = app.workingPath;

    let configFile = path.join(workingPath, 'conf', `app.default.json`);
    if (!fs.existsSync(configFile)) {
        configFile = path.join(workingPath, 'conf', `server.default.json`);
        if (!fs.existsSync(configFile)) {
            throw new Error('Either "conf/app.default.json" or "conf/server.default.json" not found.');
        }
    }    

    const config = await fs.readJson(configFile);
    if (config.settings?.geml) {
        throw new Error(`"geml" setting has already exist in ${configFile}`);
    }

    config.settings = {
        ...config.settings,
        geml: {
            gemlPath: "geml",
            modelPath: "src/models",
            scriptPath: "src/scripts",
            manifestPath: "manifests"
        }
    };

    await fs.writeJson(configFile, config, { spaces: 4 });
    app.log('info', `"geml" setting is added into ${configFile}`);

    const gemlPath = path.join(workingPath, 'geml', 'entities');
    await fs.ensureDir(gemlPath);

    const schemaSource = path.resolve(__dirname, 'init/sample.geml');
    const entitySource = path.resolve(__dirname, 'init/test.geml');

    const schemaFile = path.join(workingPath, 'geml', `${schemaName}.geml`);
    const entityFile = path.join(workingPath, 'geml', 'entities', 'test.geml');

    await copyFileFromTemplate_(schemaSource, schemaFile, { schemaName });
    app.log('info', `Created ${schemaFile}`);

    await fs.copyFile(entitySource, entityFile);
    app.log('info', `Created ${entityFile}`);

    await npmInstall_(app, workingPath, [gxDataPkg]);
    await npmInstall_(app, workingPath, ['-D', gxModelPkg]);    
};
