const path = require('node:path');
const { _, eachAsync_, isEmpty } = require('@kitmi/utils');
const { fs } = require('@kitmi/sys');
const { globSync } = require('glob');

/**
 * Build database scripts and entity models from oolong files.
 * @param {ServiceContainer} app
 * @returns {Promise}
 */
module.exports = async (app) => {
    app.log('verbose', `${app.name} import-api`);

    const fromPath = app.options.argv['from'];

    const modelService = app.getService('dataModel');
    const packageJsonFile = path.resolve('package.json');
    const packageJson = require(packageJsonFile);

    let targetModule = require(path.resolve(packageJson.main));

    app.registry.db = { ...app.registry.db, ...targetModule.databases };

    await eachAsync_(modelService.config.schemaSet, async (_schemaConfig, schemaName) => {
        const db = app.db(schemaName);

        const schemaPath = path.resolve(fromPath, schemaName);

        const apiExportFiles = globSync('*.json', { nodir: true, cwd: schemaPath });
        const apiExportFilesSet = new Set(apiExportFiles);

        if (apiExportFilesSet.size === 0) {
            app.log('warn', `No API export files found in "${schemaPath}".`);
            return;
        }

        if (!apiExportFilesSet.has('_groups.json')) {
            throw new Error(`"_groups.json" file not found in "${schemaPath}".`);
        }

        const groups = await fs.readJson(path.join(schemaPath, '_groups.json'));
        if (isEmpty(groups)) {
            throw new Error(`"_groups.json" file is empty in "${schemaPath}".`);
        }

        let types;

        if (apiExportFilesSet.has('_types.json')) {
            types = await fs.readJson(path.join(schemaPath, '_types.json'));
        }

        const projectId = groups[0].project;

        const ApiGroup = db.entity('apiGroup');
        const ApiDataType = db.entity('apiDataType');
        const ApiRoute = db.entity('apiRoute');
        const ApiEndpoint = db.entity('apiEndpoint');
        const ApiRequest = db.entity('apiRequest');
        const ApiResponse = db.entity('apiResponse');
        const Module = db.entity('module');

        await ApiGroup.deleteMany_({ $where: { project: projectId } });
        await ApiDataType.deleteMany_({ $where: { project: projectId } });

        const context = {
            ApiGroup,
            ApiDataType,
            ApiRoute,
            ApiEndpoint,
            ApiRequest,
            ApiResponse,
            Module,
            groups: {},
            types: {},
            modules: {},
        };

        if (apiExportFilesSet.has('_modules.json')) {
            const modules = await fs.readJson(path.join(schemaPath, '_modules.json'));
            await eachAsync_(modules, async (moduleInfo) => {
                await Module.create_(moduleInfo, { $ignore: true });
                context.modules[moduleInfo.name] = moduleInfo.code;
            });
        }

        await eachAsync_(groups, async (group) => {
            const {
                data: { id: groupId },
            } = await ApiGroup.create_(group, { $getCreated: ['id'] });
            context.groups[group.name] = groupId;
        });

        if (types) {
            await eachAsync_(types, async (type) => {
                const {
                    data: { id: typeId },
                } = await ApiDataType.create_(type, { $getCreated: ['id'] });
                context.types[type.name] = typeId;
            });
        }

        for (const datasetFile of apiExportFilesSet) {
            if (datasetFile.startsWith('_')) {
                continue;
            }

            app.log('info', `Importing API information from "${datasetFile}"...`);
            const routeInfo = await fs.readJson(path.join(schemaPath, datasetFile));
            await processRoute_(app, context, routeInfo);
        }
    });

    app.log('info', `All API information imported.`);
};

async function processRoute_(app, ctx, { children, ...route }) {
    const { ApiDataType, ApiRoute, ApiEndpoint, ApiRequest, ApiResponse, types, modules } = ctx;
    const { ':endpoints': endpoints, sourcePackage, ...routeInfo } = route;
    const moduleCode = modules[sourcePackage];
    if (moduleCode == null) {
        throw new Error(`Module "${sourcePackage}" not found.`);
    }
    routeInfo.module = moduleCode;

    const {
        data: { id: routeId },
    } = await ApiRoute.create_(routeInfo, { $getCreated: ['id'] });

    await eachAsync_(endpoints, async ({ requestVariables, responses, ...endpoint }) => {
        endpoint.route = routeId;
        const {
            data: { id: endpointId },
        } = await ApiEndpoint.create_(endpoint, { $getCreated: ['id'] });
        if (requestVariables?.length) {
            await eachAsync_(requestVariables, async ({ ':type': dataType, references, ...variable }) => {
                if (references && !dataType) {
                    throw new Error(`Api request data error: references should only come with custom data type.`);
                }

                if (dataType) {
                    const {
                        data: { id: typeId },
                    } = await ApiDataType.create_(dataType, { $getCreated: ['id'] });

                    if (references) {
                        await eachAsync_(references, async (ref) => {
                            const refTypeId = types[ref];
                            if (refTypeId == null) {
                                throw new Error('Request data type refers to an unexist data type: ' + ref);
                            }

                            await ApiDataType.addChildNode_(typeId, refTypeId);
                        });
                    }
                    types[dataType.name] = typeId;
                    variable.type = typeId;
                }

                variable.endpoint = endpointId;
                await ApiRequest.create_(variable);
            });
        }

        if (responses?.length) {
            await eachAsync_(responses, async ({ ':bodyType': dataType, references, ...response }) => {
                if (references && !dataType) {
                    throw new Error(`Api response data error: references should only come with custom data type.`);
                }

                if (dataType) {
                    const {
                        data: { id: typeId },
                    } = await ApiDataType.create_(dataType, { $getCreated: ['id'] });

                    if (references) {
                        await eachAsync_(references, async (ref) => {
                            const refTypeId = types[ref];
                            if (refTypeId == null) {
                                throw new Error('Request data type refers to an unexist data type: ' + ref);
                            }

                            await ApiDataType.addChildNode_(typeId, refTypeId);
                        });
                    }
                    types[dataType.name] = typeId;
                    response.bodyType = typeId;
                }

                response.endpoint = endpointId;                
                await ApiResponse.create_(response);
            });
        }
    });

    if (children) {
        await eachAsync_(children, async (childRouteInfo) => {
            const childRouteId = await processRoute_(app, ctx, childRouteInfo);
            app.log('info', 'Done child', { childRouteId });
            await ApiRoute.addChildNode_(routeId, childRouteId);
        });
    }

    return routeId;
}
