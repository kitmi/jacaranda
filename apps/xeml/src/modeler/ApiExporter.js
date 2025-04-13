const path = require('node:path');
const { _, naming, dropIfEndsWith, isEmpty, splitFirst } = require('@kitmi/utils');
const { fs } = require('@kitmi/sys');
const { sync: deleteSync } = require('del');
const yaml = require('yaml');
const { DATASET_FIELD_KEYS, fieldMetaToModifiers } = require('./util/transformers');

/**
 * API information exporter
 * @class
 */
class ApiExporter {
    /**
     * @param {ApiGenerator} apiGenerator
     * @param {object} modelService
     * @param {XemlLinker} linker - Xeml linker
     */
    constructor(apiGenerator, modelService, linker) {
        this.apiGenerator = apiGenerator;
        this.modelService = modelService;
        this.linker = linker;
    }

    exportApi(schema, context, pkg) {
        const schemaPath = path.join(path.dirname(schema.linker.getModulePathById(schema.xemlModule.id)), 'api');
        const apiDefFilesSet = this.apiGenerator.prepareApiCommonContext(schemaPath, context, pkg, true);

        context.schema = schema;
        context.pkg = pkg;

        for (const datasetFile of apiDefFilesSet) {
            if (datasetFile.startsWith('__')) {
                continue;
            }

            let resourceName;

            if (datasetFile.endsWith('.default.yaml')) {
                resourceName = path.basename(datasetFile, '.default.yaml').substring(1);
                if (apiDefFilesSet.has(resourceName + '.yaml')) {
                    this.linker.log('warn', `"${datasetFile}" is ignored because "${resourceName}.yaml" exists.`);
                    continue;
                }
            } else {
                resourceName = path.basename(datasetFile, '.yaml');
            }

            const resources = yaml.parse(fs.readFileSync(path.join(schemaPath, datasetFile), 'utf8'));
            _.each(resources, (resourceInfo, baseEndpoint) => {
                this._exportResourceApi(context, resourceName, baseEndpoint, resourceInfo);
            });
        }
    }

    exportApiContext(context) {
        const groups = [];
        _.each(context.groups, (groupInfo, name) => {
            groups.push({ project: context.projectId, name, ...groupInfo });
        });

        const groupsFilePath = path.join(context.outputPath, '_groups.json');
        fs.ensureFileSync(groupsFilePath);
        fs.writeFileSync(groupsFilePath, JSON.stringify(groups, null, 2));

        _.each(context.responses, ({ $extend, ...responsesTable }, group) => {
            // handle response type
            _.each(responsesTable, (info, code) => {
                info.body = this._processResponseBody(context, group, code, info.body);
            });
        });

        const responses = [];
        _.each(context.responses, ({ $extend, ...responsesTable }, group) => {
            const extendedTable = context.responses[$extend];
            responsesTable = { ...extendedTable, ...responsesTable };

            _.each(responsesTable, ({ description, body, ...info }, code) => {
                const entry = {
                    '@group': { project: context.projectId, name: group },
                    ...info,
                    'desc': description,
                    'httpCode': parseInt(code),
                };
                if (body.isReference) {
                    entry['@bodyType'] = body.type;
                } else {
                    entry[':bodyType'] = body.type;
                    if (body.references) {
                        entry.references = body.references;
                    }
                    if (body.spec) {
                        entry.spec = body.spec;
                    }
                }
                responses.push(entry);
            });
        });

        const responsesFilePath = path.join(context.outputPath, '_responses.json');
        fs.ensureFileSync(responsesFilePath);
        fs.writeFileSync(responsesFilePath, JSON.stringify(responses, null, 2));

        if (!isEmpty(context.types)) {
            const typesFilePath = path.join(context.outputPath, '_types.json');
            fs.ensureFileSync(typesFilePath);
            fs.writeFileSync(typesFilePath, JSON.stringify(Object.values(context.types), null, 2));
        }
    }

    cleanUpExportedApiFiles(outputPath) {
        deleteSync(path.resolve(outputPath, '**', '*.json'));
        this.linker.log('info', 'Cleaned up exported API information under: ' + outputPath);
    }

    _processResponseBody(context, responseOwnerName, httpCode, collectionSchema, callingEntity) {
        let dataType;

        if (typeof collectionSchema === 'object') {
            const { $specOf, $extend, ...others } = collectionSchema;
            let spec;

            if ($specOf) {
                const keys = Object.keys($specOf);
                if (keys.length !== 1) {
                    throw new Error('Invalid $specOf syntax: ' + JSON.stringify($specOf));
                }
                const ref = keys[0];
                spec = this._exportPlainObjectSchema(context, $specOf[ref], true, callingEntity);

                dataType = this._exportReferencedMetadata(context, ref);
            } else if ($extend) {
                dataType = this._exportReferencedMetadata(context, $extend);
            }

            const { schema: metadata } = this._exportPlainObjectSchema(context, others);

            let typeInfo;

            if ($specOf) {
                if (!isEmpty(metadata)) {
                    metadata.$extend = dataType.name;
                    typeInfo = { type: 'object', schema: metadata };
                } else {
                    typeInfo = { type: dataType.name };
                }
            } else {
                if (dataType) {
                    metadata.$extend = dataType.name;
                }
                typeInfo = { type: 'object', schema: metadata };
            }

            const bodyInfo = {
                isReference: false,
                type: {
                    project: context.projectId,
                    name: `${naming.pascalCase(responseOwnerName)}${httpCode}ResponseBody`,
                    sourcePackage: context.pkg,
                    typeInfo,
                },
            };

            if (spec) {
                spec.references.push(dataType.name);
                _.each(spec.schema, (v) => {
                    spec.references.push(v.type);
                });
                bodyInfo.spec = _.mapValues(spec.schema, (typeInfo) => (typeInfo.type));
                bodyInfo.references = _.uniq(spec.references);
            }

            if ($extend) {
                metadata.$extend = dataType.name;
                bodyInfo.references = [dataType.name];
            }

            return bodyInfo;
        }

        dataType = this._exportReferencedMetadata(context, collectionSchema);

        return {
            isReference: true,
            type: {
                project: dataType.project,
                sourcePackage: dataType.sourcePackage,
                name: dataType.name,
            },
        };
    }

    _exportResourceApi(context, resourceName, baseEndpoint, resourceInfo) {
        if (!baseEndpoint.startsWith('/')) {
            throw new Error("Base endpoint should start with '/'.");
        }

        baseEndpoint = dropIfEndsWith(baseEndpoint, '/');

        const { description, group, endpoints } = resourceInfo;

        const groupInfo = context.groups?.[group];

        if (groupInfo == null) {
            throw new Error(
                `Group "${group}" not found in "xeml/api/__groups.yaml" or extended packages' groups defintion.`
            );
        }

        const locals = {
            baseEndpoint,
            group,
            resourceName,
            description,
        };

        const apiRoutes = [];
        let rootRoute;

        _.each(endpoints, (endpointInfo, endpoint) => {
            if (endpoint.startsWith('/')) {
                const apiRoute = {
                    'route': locals.baseEndpoint + endpoint,
                    'sourcePackage': context.pkg,
                    '@group': {
                        project: context.projectId,
                        name: locals.group,
                    },
                    ':endpoints': [],
                };
                apiRoutes.push(apiRoute);

                const paramName = endpoint.substring(2, endpoint.length - 1);

                // routes with id
                _.each(endpointInfo, (endpointInfo, endpoint) => {
                    const _endpoint = this._exportResourceEndpoint(context, locals, endpoint, endpointInfo, paramName);
                    apiRoute[':endpoints'].push(_endpoint);
                });

                return;
            }

            if (!rootRoute) {
                rootRoute = {
                    'route': locals.baseEndpoint,
                    'sourcePackage': context.pkg,
                    '@group': {
                        project: context.projectId,
                        name: locals.group,
                    },
                    ':endpoints': [],
                };
            }

            rootRoute[':endpoints'].push(this._exportResourceEndpoint(context, locals, endpoint, endpointInfo));
        });

        rootRoute.children = apiRoutes;

        const routesFilePath = path.join(context.outputPath, resourceName + '-routes.json');
        fs.ensureFileSync(routesFilePath);
        fs.writeFileSync(routesFilePath, JSON.stringify(rootRoute, null, 2));

        this.linker.log('info', 'Generated API routes: ' + routesFilePath);
    }

    _exportResourceEndpoint(context, locals, method, endpointInfo, subRouteParam) {
        const { description, request, responses, implementation } = endpointInfo;

        const apiEndpoint = {
            method: method.toUpperCase(),
            desc: description,
            implementation,
        };

        const localContext = {
            entities: new Set(),
            businesses: new Set(),
            variables: new Set(),
            subRouteParam,
            endpointName: `${naming.pascalCase(locals.resourceName)}${naming.pascalCase(method)}`,
        };

        const apiRequests = [];
        const apiResponses = [];

        if (request) {
            const { headers, query, params, body } = request;

            if (body) {
                apiRequests.push(this._exportRequestData(context, localContext, 'body', body));
            }

            if (query) {
                apiRequests.push(this._exportRequestData(context, localContext, 'query', query));
            }

            apiRequests.push(...this._exportRequestVariables(context, localContext, headers, 'headers'));
            apiRequests.push(...this._exportRequestVariables(context, localContext, params, 'params'));
        }

        if (responses) {
            _.each(responses, ({ description, body, ...info }, code) => {
                const _body = this._processResponseBody(
                    context,
                    localContext.subRouteParam ? (localContext.endpointName + 'One') : localContext.endpointName,
                    code,
                    body,
                    locals.resourceName
                );
                const entry = {
                    ...info,
                    desc: description,
                    httpCode: parseInt(code),
                };
                if (_body.isReference) {
                    entry['@bodyType'] = _body.type;
                } else {
                    entry[':bodyType'] = _body.type;
                    if (_body.references) {
                        entry.references = _body.references;
                    }
                    if (_body.spec) {
                        entry.spec = _body.spec;
                    }
                }
                apiResponses.push(entry);
            });
        }

        apiEndpoint.requestVariables = apiRequests;
        apiEndpoint.responses = apiResponses;

        return apiEndpoint;
    }

    _exportRequestData(context, localContext, source, collectionSchema) {
        let dataType;

        if (typeof collectionSchema === 'object') {
            const { $extend, ...others } = collectionSchema;
            if ($extend) {
                dataType = this._exportReferencedMetadata(context, $extend);
            }

            const { schema: metadata } = this._exportPlainObjectSchema(context, others);

            const requestVar = {
                source,
                'name': source,
                ':type': {
                    project: context.projectId,
                    name: `${localContext.endpointName}${naming.pascalCase(source)}`,
                    sourcePackage: context.pkg,
                    typeInfo: { type: 'object', schema: metadata },
                },
            };

            if ($extend) {
                metadata.$extend = dataType.name;
                requestVar.references = [dataType.name];
            }

            return requestVar;
        }

        dataType = this._exportReferencedMetadata(context, collectionSchema);

        return {
            source,
            'name': source,
            '@type': {
                project: dataType.project,
                sourcePackage: dataType.sourcePackage,
                name: dataType.name,
            },
        };
    }

    _exportRequestVariables(context, localContext, collection, source) {
        const variables = [];

        if (collection) {
            _.each(collection, (_typeInfo, key) => {
                const localName = naming.camelCase(key);
                const { typeInfo, references } = this._exportRequestSourceMetadata(context, _typeInfo);

                const requestVar = {
                    source,
                    name: localName,
                };

                if (typeInfo.isReference) {
                    requestVar['@type'] = {
                        project: context.projectId,
                        name: typeInfo.type,
                        sourcePackage: typeInfo.sourcePackage,
                    };
                } else {
                    requestVar[':type'] = {
                        project: context.projectId,
                        name: `${localContext.endpointName}${naming.pascalCase(source)}`,
                        sourcePackage: context.pkg,
                        typeInfo,
                    };

                    if (references && references.length > 0) {
                        requestVar.references = references;
                    }
                }

                variables.push(requestVar);
            });
        }

        return variables;
    }

    _exportPlainObjectSchema(context, object, isSpec, callingEntity) {
        const _typeInfo = {};
        const _references = new Set();
        _.each(object, (v, k) => {
            if (isSpec && typeof v !== 'string') {
                throw new Error('The value of $specOf metadata should be a type reference.');
            }
            const { typeInfo, references } = this._exportRequestSourceMetadata(context, v, callingEntity);
            _typeInfo[k] = typeInfo;
            references && references.forEach((r) => _references.add(r));
        });

        return {
            schema: _typeInfo,
            references: Array.from(_references),
        };
    }

    _exportRequestSourceMetadata(context, typeInfo, callingEntity) {
        if (typeof typeInfo === 'string') {
            let dataType = this._exportReferencedMetadata(context, typeInfo, callingEntity);

            return {
                references: [dataType.name],
                typeInfo: { type: dataType.name, sourcePackage: dataType.sourcePackage, isReference: true },
            };
        }

        const { type, ...others } = typeInfo;
        const references = [];

        if (type == null) {
            console.log(typeInfo);
        }

        if (type[0] === '$') {
            let dataType = this._exportReferencedMetadata(context, type);

            typeInfo = { type: dataType.name, ...others };
        }

        const result = this._transformTypeInfo(typeInfo);
        return {
            typeInfo: result,
            references,
        };
    }

    _transformTypeInfo(typeInfo) {
        const postProcessors = fieldMetaToModifiers(typeInfo);
        const extra =
            postProcessors.length > 0
                ? { post: typeInfo?.post ? postProcessors.concat(typeInfo.post) : postProcessors }
                : {};

        return {
            ..._.pick(typeInfo, DATASET_FIELD_KEYS),
            ...extra,
        };
    }

    _exportReferencedMetadata(context, type, callingEntity) {
        const dataType = context.types[type];
        if (dataType) {
            return dataType;
        }

        if (type.startsWith('$dataset.')) {
            const [entityName, datasetName] = type.substring(9).split('.');
            const EntityModel = context.db.entity(entityName);
            const typeName = `${naming.pascalCase(entityName)}${naming.pascalCase(datasetName)}Data`;
            return (context.types[type] = {
                project: context.projectId,
                name: typeName,
                sourcePackage: EntityModel.meta.packagePath,
                typeInfo: { type: 'object', ...EntityModel.datasetSchema(datasetName) },
            });
        }

        if (type.startsWith('$entity.')) {
            const [entityName, fieldName] = type.substring(8).split('.');
            const EntityModel = context.db.entity(entityName);

            if (fieldName) {
                const typeName = `${naming.pascalCase(entityName)}_${fieldName}`;

                return (context.types[type] = {
                    project: context.projectId,
                    name: typeName,
                    sourcePackage: EntityModel.meta.packagePath,
                    typeInfo: this._transformTypeInfo(EntityModel.meta.fields[fieldName]),
                });
            }

            return (context.types[type] = {
                project: context.projectId,
                name: naming.pascalCase(entityName),
                sourcePackage: EntityModel.meta.packagePath,
                typeInfo: {
                    type: 'object',
                    schema: _.mapValues(EntityModel.meta.fields, (v) => this._transformTypeInfo(v)),
                },
            });
        }

        if (type.startsWith('$view.')) {
            const [entityName, viewName] = type.substring(6).split('.');
            const EntityModel = context.db.entity(entityName);
            const typeName = `${naming.pascalCase(entityName)}${naming.pascalCase(viewName)}View`;

            const viewInfo = EntityModel.meta.views?.[viewName];
            if (viewInfo == null) {
                throw new Error(`Entity "${entityName}" does not define "${viewName}" view.`);
            }

            return (context.types[type] = {
                project: context.projectId,
                name: typeName,
                sourcePackage: EntityModel.meta.packagePath,
                typeInfo: this._parseViewSchema(context, entityName, viewInfo),
            });
        }

        if (type.startsWith('$type.')) {
            const typeName = type.substring(6);
            const typeInfo = context.sharedTypes[typeName];
            if (typeInfo == null) {
                throw new Error(`Type "${typeName}" does not exist in types definition of any dependent package.`);
            }

            const { sourcePackage, $args, ..._info } = typeInfo;
            const _typeInfo = {
                project: context.projectId,
                name: naming.pascalCase(typeName),
                sourcePackage: sourcePackage,
                typeInfo: _info,
            };

            if ($args) {
                _typeInfo.hasArgs = true;
                _typeInfo.args = $args;
            }

            return (context.types[type] = _typeInfo);
        }

        if (type.startsWith('$default.')) {
            const defaultKeywords = type.substring(9);

            const EntityModel = context.db.entity(callingEntity);
            if (EntityModel == null) {
                throw new Error(`Entity "${callingEntity}" not found in schema when parsing type: ` + type);
            }

            let viewInfo;

            if (defaultKeywords === 'listView') {
                viewInfo = { $select: ['*'] };
            } else if (defaultKeywords === 'detailView') {
                viewInfo = { $select: ['*'] };
            } else if (defaultKeywords === 'deletedView') {
                viewInfo = { $select: [EntityModel.meta.keyField] };
            } else {
                throw new Error(`Unsupported default keyword: ${defaultKeywords}, type: ` + type);
            }

            const typeName = `${naming.pascalCase(callingEntity)}${naming.pascalCase(defaultKeywords)}`;

            return (context.types[type] = {
                project: context.projectId,
                name: typeName,
                sourcePackage: EntityModel.meta.packagePath,
                typeInfo: this._parseViewSchema(context, callingEntity, viewInfo),
            });
        }

        if (type === '$any') {
            return (context.types[type] = {
                project: context.projectId,
                name: 'Anything',
                sourcePackage: '@xgent/xem-commons',
                typeInfo: { type: 'any' },
            });
        }

        throw new Error(`Unsupported reference: ${type}`);
    }

    _parseViewSchema(context, entityName, viewInfo) {
        const selectedFields = viewInfo.$select;
        let schema = {};

        const EntityModel = context.db.entity(entityName);

        selectedFields.forEach((fieldName) => {
            schema = {
                ...schema,
                ...this._parseEntityFieldsSchema(EntityModel, fieldName),
            };
        });

        return {
            type: 'object',
            schema,
        };
    }

    _parseEntityFieldsSchema(EntityModel, fieldName) {
        if (fieldName === '*') {
            return _.mapValues(EntityModel.meta.fields, (v) => this._transformTypeInfo(v));
        }

        if (fieldName.indexOf('.') !== -1) {
            const [anchor, _fieldName] = splitFirst(fieldName, '.');
            const assocInfo = EntityModel.meta.associations[anchor];
            const _EntityModel = EntityModel.db.entity(assocInfo.entity);

            if (assocInfo.type === 'belongsTo' || assocInfo.type === 'refersTo') {
                const fieldInfo = EntityModel.meta.fields[anchor];
                const anchorTypeInfo = this._parseEntityFieldsSchema(_EntityModel, _fieldName);
                if (fieldInfo.optional) {
                    anchorTypeInfo.optional = true;
                }

                return {
                    [`:${anchor}`]: anchorTypeInfo,
                };
            } else if (assocInfo.list) {
                return {
                    [`:${anchor}`]: {
                        type: 'array',
                        element: this._parseEntityFieldsSchema(_EntityModel, _fieldName),
                    },
                };
            }

            return {
                [`:${anchor}`]: { ...this._parseEntityFieldsSchema(_EntityModel, _fieldName), optional: true },
            };
        }

        return {
            [fieldName]: this._transformTypeInfo(EntityModel.meta.fields[fieldName]),
        };
    }
}

module.exports = ApiExporter;
