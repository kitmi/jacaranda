const path = require('node:path');
const { fs } = require('@kitmi/sys');
const { startWorker } = require('@kitmi/jacaranda');
const { _, eachAsync_, isEmpty, baseName } = require('@kitmi/utils');
const { InvalidArgument } = require('@kitmi/types');
const Linker = require('../lang/Linker');
const { getPackageRoot } = require('../utils/helpers');
const XemlTypes = require('../lang/XemlTypes');
const { dataSource, dataModel } = require('@kitmi/data');
const { getSchemaDigest } = require('../utils/helpers');

/**
 * Export API from entity models and api schema.
 * @param {ServiceContainer} app
 * @returns {Promise}
 */
module.exports = async (app) => {
    app.log('verbose', `${app.name} export-api`);

    const outputPath = app.options.argv['o'];
    const projectId = parseInt(app.options.argv['project']);
    const modelService = app.getService('dataModel');
    const packageJsonFile = path.resolve('package.json');
    const packageJson = require(packageJsonFile);

    let targetModule = require(path.resolve(packageJson.main));

    app.registry.db = { ...app.registry.db, ...targetModule.databases };

    const schemaObjects = Linker.buildSchemaObjects(app, modelService.config);

    await eachAsync_(modelService.config.schemaSet, async (schemaConfig, schemaName) => {
        app.log('verbose', `Processing schema "${schemaName}" ...`);
        const schema = schemaObjects[schemaName];

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
        const schemaJSON = refinedSchema.toJSON();
        const digest = getSchemaDigest(schemaJSON);

        if (!isEmpty(dbModeler.warnings)) {
            Object.values(dbModeler.warnings).forEach((warning) => app.log('warn', warning));
        }

        const db = app.db(schemaName);
        const Metadata = db.entity(XemlTypes.MetadataEntity);
        const metadata = await Metadata.findOne_({
            $where: { name: schemaName },
        });

        if (metadata == null) {
            throw new InvalidArgument(`Schema "${schemaName}" metadata not found in database.`);
        }

        if (digest !== metadata.codeHash) {
            throw new Error(
                `Schema "${schemaName}" has been modified and is different from the current migration of database. Please rebuild the models and run the migration before exporting the API.`
            );
        }

        const ApiGenerator = require('../modeler/ApiGenerator');
        const apiGenerator = new ApiGenerator(modelService, schema.linker);

        const ApiExporter = require('../modeler/ApiExporter');
        const apiExporter = new ApiExporter(apiGenerator, modelService, schema.linker);                

        const context = {
            db,
            projectId,
            outputPath: path.resolve(outputPath, schemaName),
            groups: {},
            types: {},
        };

        apiExporter.cleanUpExportedApiFiles(context.outputPath);

        const processedPkgs = new Set();
        const pkgTables = [];
        const processPkg = (pkg, pkgPath) => {
            if (!processedPkgs.has(pkg)) {
                const pkgInfo = fs.readJsonSync(path.resolve(pkgPath, 'package.json'));
                const schemaPath = path.resolve(pkgPath, 'xeml', 'api');
                let type;
                let category;
                if (fs.existsSync(schemaPath)) { 
                    type = 'api';       
                    category = 'api';             
                } else {
                    type = 'xem';
                    category = 'aux';
                }
                apiGenerator.prepareApiCommonContext(schemaPath, context, pkg, true);
                processedPkgs.add(pkg);

                pkgTables.push({
                    project: projectId,
                    code: pkgInfo.name.replace(/\//g, '__').replace(/^@/, '_'),
                    name: pkgInfo.name,
                    version: pkgInfo.version,
                    desc: pkgInfo.description,
                    type,
                    category,
                    workDir: baseName(pkgPath),
                    status: 'active'
                });
            }
        };

        if (modelService.config.dependencies) {
            await eachAsync_(modelService.config.dependencies, async (pkg) => {
                const pkgPath = getPackageRoot(pkg);
                processPkg(pkg, pkgPath);

                const xemlConfigFile = path.join(pkgPath, 'conf', 'xeml.default.yaml');
                if (await fs.exists(xemlConfigFile)) {
                    await startWorker(
                        async (pkgApp) => {
                            const pkgModelService = pkgApp.getService('dataModel');
                            if (pkgModelService.config.apiExtends) {
                                pkgModelService.config.apiExtends.forEach((extPkg) => {
                                    const pkgPath = getPackageRoot(extPkg);
                                    processPkg(extPkg, pkgPath);
                                });
                            }

                            apiExporter.exportApi(refinedSchema, context, pkg);
                        },
                        {
                            workerName: `xeml:${pkg}`,
                            workingPath: pkgPath,
                            configPath: './conf',
                            configName: 'xeml',
                            configType: 'yaml',
                            disableEnvAwareConfig: false,
                            throwOnError: true,
                            verbose: true,

                            registry: {
                                features: {
                                    dataModel,
                                    dataSource,
                                },
                            },
                        }
                    );
                }
            });
        }

        apiExporter.exportApiContext(context);

        const modulesFilePath = path.resolve(context.outputPath, '_modules.json');
        fs.ensureFileSync(modulesFilePath);
        fs.writeFileSync(modulesFilePath, JSON.stringify(pkgTables, null, 2));
    });
};
