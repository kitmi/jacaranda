const path = require('node:path');
const { _, naming, baseName, splitFirst, replaceAll } = require('@kitmi/utils');
const { fs } = require('@kitmi/sys');
const swig = require('swig-templates');

const JsLang = require('./util/ast');
const { globSync } = require('glob');
const { sync: deleteSync } = require('del');
const yaml = require('yaml');
const { DATASET_FIELD_KEYS, fieldMetaToModifiers } = require('./util/transformers');

/**
 * API generation based on xeml and api schema.
 * @class
 */
class ApiGenerator {
    /**
     * @param {object} modelService
     * @param {XemlLinker} linker - Xeml linker
     * @param {Connector} connector
     */
    constructor(modelService, linker) {
        this.modelService = modelService;
        this.linker = linker;
    }

    _processTypeInfo(typeInfo) {
        const postProcessors = fieldMetaToModifiers(typeInfo);
        const extra =
            postProcessors.length > 0
                ? { post: typeInfo?.post ? postProcessors.concat(typeInfo.post) : postProcessors }
                : {};

        return JsLang.astValue({
            ..._.pick(typeInfo, DATASET_FIELD_KEYS),
            ...extra,
        });
    }

    prepareApiCommonContext(schemaPath, context, pkg, forExporting) {
        const apiDefFiles = globSync('*.yaml', { nodir: true, cwd: schemaPath });
        const apiDefFilesSet = new Set(apiDefFiles);

        if (apiDefFilesSet.size === 0) {
            return apiDefFilesSet;
        }

        // todo: typeSpecialize
        /*
        const typeSpecialize = (typeInfo, argsMap) => {
            if (typeInfo.$refArg) {
                return argsMap[typeInfo.$refArg];
            }

            return _.mapValues(typeInfo, (v) => typeSpecialize(v, argsMap));
        };
        */

        // process __types.yaml for type definitions
        if (apiDefFilesSet.has('__types.yaml')) {
            const types = yaml.parse(fs.readFileSync(path.join(schemaPath, '__types.yaml'), 'utf8'));
            const sharedTypes = {};

            // check if any type has $args property, change the type to a function

            _.each(types, (type, typeName) => {
                let typeInfo = type;

                /*
                if (type.$args) {
                    const { $args, ..._type } = type;

                    typeInfo = (variables) => {
                        if ($args.find((arg) => !(arg in variables))) {
                            throw new Error(
                                `Specialization argument "${arg}" is required for type constructor "${typeName}".`
                            );
                        }
                        return typeSpecialize(_type, variables);
                    };
                }
                */

                if (forExporting) {
                    typeInfo.sourcePackage = pkg;
                }

                sharedTypes[typeName] = typeInfo;
            });

            context.sharedTypes = { ...context.sharedTypes, ...sharedTypes };
            apiDefFilesSet.delete('__types.yaml');
        }

        // process __groups.yaml for group definitions
        if (apiDefFilesSet.has('__groups.yaml')) {
            const groups = yaml.parse(fs.readFileSync(path.join(schemaPath, '__groups.yaml'), 'utf8'));
            for (let key in groups) {
                if (key in context.groups) {
                    throw new Error(
                        `Group "${key}" already exists in "xeml/api/__groups.yaml" of package "${context.groups[key].sourcePackage}".`
                    );
                }
                groups[key].sourcePackage = pkg;
            }
            context.groups = { ...context.groups, ...groups };
            apiDefFilesSet.delete('__groups.yaml');
        }

        // process __responses.yaml for response definitions
        if (apiDefFilesSet.has('__responses.yaml')) {
            const responses = yaml.parse(fs.readFileSync(path.join(schemaPath, '__responses.yaml'), 'utf8'));
            for (let key in responses) {
                if (!(key in context.groups)) {
                    throw new Error(
                        `Unknown group "${key}" apprears in response definition. schema path: ` + schemaPath
                    );
                }

                const { $extend } = responses[key];
                if ($extend != null && !($extend in context.groups)) {
                    throw new Error(
                        `Unknown group "${$extend}" apprears in response's $extend definition. schema path: ` +
                            schemaPath
                    );
                }
            }
            context.responses = { ...context.responses, ...responses };
            apiDefFilesSet.delete('__responses.yaml');
        }

        return apiDefFilesSet;
    }

    _parseEntityDatasetSchema(schema) {
        const _datasetEntries = new Set();

        //generate validator config
        _.forOwn(schema.entities, (entity, entityInstanceName) => {
            const entityPath = path.dirname(entity.linker.getModulePathById(entity.xemlModule.id));

            // read <entity>-schema-<inputSetName>.yaml
            const prefix = `${entityInstanceName}-schema-`;
            const pattern = `${prefix}*.yaml`;
            const datasetFiles = globSync(pattern, { nodir: true, cwd: entityPath });

            datasetFiles.forEach((datasetFile) => {
                const inputSetName = path.basename(datasetFile, '.yaml').substring(prefix.length);

                _datasetEntries.add(`${entityInstanceName}.${inputSetName}`);
            });
        });

        return _datasetEntries;
    }

    _generateDefaultApiSchema(context, schemaPath, apiDefFilesSet) {
        const apiSchemaTemplate = path.resolve(__dirname, 'dao', 'api-config.yaml.swig');
        const datasets = this._parseEntityDatasetSchema(context.schema);

        _.each(context.schema.entities, (entity, entityName) => {
            if (entity.xemlModule.id.startsWith('./..')) {
                return;
            }
            const locals = {
                resourceName: entityName,
                resourcePascalName: naming.pascalCase(entityName),
                keyField: entity.key,
                keyFieldPlaceholder: `{${entity.key}}`,
            };

            // check whether entity has a list view
            if (entity.views?.list) {
                locals.listViewOrDefault = `$view.${entityName}.list`;
            } else {
                locals.listViewOrDefault = `$default.listView`;
            }

            if (entity.views?.created) {
                locals.newViewOrDefault = `$view.${entityName}.created`;
            } else {
                locals.newViewOrDefault = `$default.detailView`;
            }

            if (entity.views?.detail) {
                locals.detailViewOrDefault = `$view.${entityName}.detail`;
            } else {
                locals.detailViewOrDefault = `$default.detailView`;
            }

            if (entity.views?.deleted) {
                locals.deleteViewOrDefault = `$view.${entityName}.deleted`;
            } else {
                locals.deleteViewOrDefault = `$default.deletedView`;
            }

            // check whether entity has a new dataset
            if (datasets.has(`${entityName}.new`)) {
                locals.newDatasetOrDefault = `$dataset.${entityName}.new`;
            } else {
                locals.newDatasetOrDefault = `$any`;
            }

            if (datasets.has(`${entityName}.update`)) {
                locals.updateDatasetOrDefault = `$dataset.${entityName}.update`;
            } else {
                locals.updateDatasetOrDefault = `$any`;
            }

            const apiSchema = swig.renderFile(apiSchemaTemplate, locals);

            const schemaFile = '_' + entityName + '.default.yaml';
            const schemaFilePath = path.join(schemaPath, schemaFile);
            fs.ensureFileSync(schemaFilePath);
            fs.writeFileSync(schemaFilePath, apiSchema);
            this.linker.log('info', 'Generated default API schema: ' + schemaFile);
            apiDefFilesSet.add(schemaFile);
        });
    }

    _cleanUpGeneratedApiFiles(context) {
        if (context.groups) {
            for (let key in context.groups) {
                const groupInfo = context.groups[key];
                if (groupInfo.moduleSource === 'project') {
                    const groupPath = path.join(this.modelService.config.sourcePath, groupInfo.controllerPath);

                    deleteSync(path.join(groupPath, '*.js'));
                }
                this.linker.log('info', 'Cleaned up API controllers under: ' + groupInfo.controllerPath);
            }
        }
    }

    generateApi(schema, context, pkg) {
        const schemaPath = path.join(path.dirname(schema.linker.getModulePathById(schema.xemlModule.id)), 'api');
        deleteSync(path.join(schemaPath, '*.default.yaml'));

        const apiDefFilesSet = this.prepareApiCommonContext(schemaPath, context, pkg);

        context.schema = schema;

        this._cleanUpGeneratedApiFiles(context);
        this._generateDefaultApiSchema(context, schemaPath, apiDefFilesSet);

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
                this._generateResourceApi(context, resourceName, baseEndpoint, resourceInfo);
            });
        }

        // generate index file for all groups
        if (context.groups) {
            for (let key in context.groups) {
                const groupInfo = context.groups[key];
                if (groupInfo.moduleSource === 'project') {
                    const groupPath = path.join(this.modelService.config.sourcePath, groupInfo.controllerPath);

                    const apiFiles = globSync('**/*.js', { nodir: true, cwd: groupPath }).filter(
                        (f) => f !== 'index.js'
                    );

                    if (apiFiles.length > 0) {
                        // filter out index.js and sort the rest and make an export list
                        const exportList = apiFiles.sort().map((f) => {
                            const name = baseName(f, true);
                            const localName = replaceAll(name, '/', '__');
                            return `export { default as ${localName} } from './${name}';`;
                        });

                        // override index.js
                        const indexFilePath = path.join(groupPath, 'index.js');
                        fs.ensureFileSync(indexFilePath);
                        fs.writeFileSync(indexFilePath, exportList.join('\n'));
                    }
                }
            }
        }
    }

    _generateResourceApi(context, resourceName, baseEndpoint, resourceInfo) {
        if (!baseEndpoint.startsWith('/')) {
            throw new Error("Base endpoint should start with '/'.");
        }

        const resourceClassName = naming.pascalCase(resourceName);
        const { description, group, endpoints } = resourceInfo;

        const groupInfo = context.groups?.[group];

        if (groupInfo == null) {
            throw new Error(
                `Group "${group}" not found in "xeml/api/__groups.yaml" or extended packages' groups defintion.`
            );
        }

        const locals = {
            baseEndpoint,
            className: resourceClassName,
            resourceName,
            description,
            methods: [],
        };

        _.each(endpoints, (endpointInfo, endpoint) => {
            // todo: other form of api
            if (endpoint.startsWith('/')) {
                const paramName = endpoint.substring(2, endpoint.length - 1);

                // routes with id
                _.each(endpointInfo, (endpointInfo, endpoint) => {
                    this._generateResourceEndpoint(context, locals, endpoint, endpointInfo, paramName);
                });

                return;
            }

            this._generateResourceEndpoint(context, locals, endpoint, endpointInfo);
        });

        locals.methods = locals.methods.join('\n\n');

        const classTemplate = path.resolve(__dirname, 'dao', 'api-controller.js.swig');
        const classCode = swig.renderFile(classTemplate, locals);

        const resourceFilePath = path.join(
            this.modelService.config.sourcePath,
            groupInfo.controllerPath,
            baseEndpoint
                .split('/')
                .filter((p) => p)
                .map((p) => naming.camelCase(p))
                .join('/') + '.js'
        );
        fs.ensureFileSync(resourceFilePath);
        fs.writeFileSync(resourceFilePath, classCode);

        this.linker.log('info', 'Generated API controller: ' + resourceFilePath);
    }

    _ensureEntity(localContext, entityName, codeBucket) {
        if (!localContext.entities.has(entityName)) {
            codeBucket.push(`const ${naming.pascalCase(entityName)} = this.$m('${entityName}', null, ctx);`);
            localContext.entities.add(entityName);
        }
    }

    _ensureVar(localContext, varName, codeBucket) {
        if (!localContext.variables.has(varName)) {
            codeBucket.push(`let ${varName};`);
            localContext.variables.add(varName);
        }
    }

    _getReferencedMetadata(context, localContext, type, codeBucket) {
        if (type.startsWith('$dataset.')) {
            const [entityName, datasetName] = type.substring(9).split('.');
            this._ensureEntity(localContext, entityName, codeBucket);
            return JsLang.astVarRef(`${naming.pascalCase(entityName)}.datasetSchema('${datasetName}')`);
        }

        if (type.startsWith('$entity.')) {
            const [entityName, fieldName] = type.substring(8).split('.');
            this._ensureEntity(localContext, entityName, codeBucket);
            if (fieldName) {
                return JsLang.astVarRef(`${naming.pascalCase(entityName)}.meta.fields['${fieldName}']`);
            }

            return JsLang.astVarRef(`{ type: 'object', schema: ${naming.pascalCase(entityName)}.meta.fields }`);
        }

        if (type.startsWith('$view.')) {
            const [entityName, viewName] = type.substring(6).split('.');
            this._ensureEntity(localContext, entityName, codeBucket);
            return JsLang.astVarRef(`${naming.pascalCase(entityName)}.meta.views['${viewName}']`);
        }

        if (type.startsWith('$type.')) {
            const typeName = type.substring(6);
            return JsLang.astValue(context.sharedTypes[typeName]);
        }

        if (type === '$any') {
            return JsLang.astValue({ type: 'any' });
        }

        throw new Error(`Unsupported reference: ${type}`);
    }

    _processPlainObjectMetadata(context, localContext, object, codeBucket) {
        return JsLang.astValue(
            _.mapValues(object, (v) => this._getRequestSourceMetadata(context, localContext, v, codeBucket))
        );
    }

    _getRequestSourceMetadata(context, localContext, typeInfo, codeBucket) {
        if (typeof typeInfo === 'string') {
            return this._getReferencedMetadata(context, localContext, typeInfo, codeBucket);
        }

        const { type, ...others } = typeInfo;

        if (type[0] === '$') {
            return JsLang.astObjectCreate(
                JsLang.astSpread(this._getReferencedMetadata(context, localContext, type, codeBucket)),
                ...JsLang.astValue(others).properties
            );
        }

        return this._processTypeInfo(typeInfo);
    }

    _extractRequestData(context, localContext, localName, collection, source, codeBucket) {
        if (typeof collection === 'object') {
            const { $extend, ...others } = collection;
            if ($extend) {
                const baseMetadata = this._getReferencedMetadata(context, localContext, $extend, codeBucket);
                codeBucket.push(
                    `const ${localName} = Types.OBJECT.sanitize(${source}, ${JsLang.astToCode(baseMetadata)});`
                );

                const metadata = this._processPlainObjectMetadata(context, localContext, others, codeBucket);

                codeBucket.push(
                    `const ${localName}_ = Types.OBJECT.sanitize(${source}, { type: 'object', schema: ${JsLang.astToCode(
                        metadata
                    )} });`,
                    `Object.assign(${localName}, ${localName}_)`
                );

                return;
            }

            const metadata = this._processPlainObjectMetadata(context, localContext, others, codeBucket);
            codeBucket.push(
                `const ${localName} = Types.OBJECT.sanitize(${source}, { type: 'object', schema: ${JsLang.astToCode(
                    metadata
                )} });`
            );
            return;
        }

        const dataCode = this._getReferencedMetadata(context, localContext, collection, codeBucket);
        const typeInfo = JsLang.astToCode(dataCode);
        codeBucket.push(`const ${localName} = Types.OBJECT.sanitize(${source}, ${typeInfo});`);
    }

    _extractTrustVariables(context, localContext, collection, source, codeBucket) {
        if (collection) {
            if (!Array.isArray(collection)) {
                throw new Error(`Variable source "${source}" should be an array of keys.`);
            }

            collection.forEach((key) => {
                const localName = naming.camelCase(replaceAll(key, '.', '-'));

                if (localContext.variables.has(localName)) {
                    throw new Error(`Variable "${localName}" conflicts with local context.`);
                }

                codeBucket.push(`const ${localName} = _.get(${source}, '${key}');`);
            });
        }
    }

    _extractRequestVariables(context, localContext, collection, source, codeBucket) {
        if (collection) {
            _.each(collection, (typeInfo, key) => {
                const localName = naming.camelCase(key);
                const processsedTypeInfo = this._getRequestSourceMetadata(context, localContext, typeInfo, codeBucket);
                let varDef = 'const ';

                if (localContext.variables.has(localName)) {
                    varDef = '';
                }

                if (source === 'ctx.params' && key === localContext.subRouteParam) {
                    codeBucket.push(
                        `${varDef}${localName} = typeSystem.sanitize(${key}, ${JsLang.astToCode(processsedTypeInfo)});`
                    );
                } else {
                    codeBucket.push(
                        `${varDef}${localName} = typeSystem.sanitize(${source}['${key}'], ${JsLang.astToCode(
                            processsedTypeInfo
                        )});`
                    );
                }
            });
        }
    }

    _translateViewArg(callingEntity, method, viewPart) {
        if (callingEntity) {
            if (method === 'create_') {
                return `$getCreated: { ${viewPart} }`;
            }

            if (method === 'updateOne_') {
                return `$getUpdated: { ${viewPart} }`;
            }

            if (method === 'deleteOne_') {
                return `$getDeleted: { ${viewPart} }`;
            }
        }

        return viewPart;
    }

    _translateArg(context, localContext, arg, callingEntity, method) {
        if (arg.startsWith('$local.')) {
            return arg.substring(7);
        } else if (arg.startsWith('$view.')) {
            const [entityName, calling] = splitFirst(arg.substring(6), '.');
            let [viewName, argsString] = splitFirst(calling, '(');

            if (!context.schema.entities[entityName].views?.[viewName]) {
                throw new Error(`View "${viewName}" not found in entity "${entityName}", arg: ${arg}`);
            }

            let where = '';

            if (argsString) {
                const endOfArg = argsString.lastIndexOf(')');
                if (endOfArg === -1) {
                    throw new Error('Invalid args invoking syntax: ' + arg);
                }

                argsString = argsString.substring(0, endOfArg);
                const args = argsString
                    .split(',')
                    .map((a) => this._translateArg(context, localContext, a.trim(), callingEntity));
                if (args.length > 1) {
                    throw new Error('$view can only support one argument as $where: ' + arg);
                }

                if (args.length > 0) {
                    where = `$where: ${args[0]}, `;
                }
            }

            if (callingEntity) {
                let viewPart = `$view: '${viewName}'`;
                return `{ ${where}${this._translateViewArg(callingEntity, method, viewPart)} }`;
            }

            return `{ ${where}$view: '${viewName}' }`;
        } else if (arg.startsWith('$default.')) {
            let [defaultKeywords, argsString] = splitFirst(arg.substring(9), '(');
            if (!callingEntity) {
                throw new Error(`The calling entity name is required for: ` + arg);
            }

            const entity = context.schema.entities[callingEntity];
            if (entity == null) {
                throw new Error(`Entity "${callingEntity}" not found in schema when parsing arg: ` + arg);
            }

            let viewReplacement;

            if (defaultKeywords === 'listView') {
                viewReplacement = "$select: ['*']";
            } else if (defaultKeywords === 'detailView') {
                viewReplacement = "$select: ['*']";
            } else if (defaultKeywords === 'deletedView') {
                viewReplacement = `$select: ['${entity.key}']`;
            } else {
                throw new Error(`Unsupported default keyword: ${defaultKeywords}, arg: ` + arg);
            }

            viewReplacement = this._translateViewArg(callingEntity, method, viewReplacement);

            if (argsString) {
                const endOfArg = argsString.lastIndexOf(')');
                if (endOfArg === -1) {
                    throw new Error('Invalid args invoking syntax: ' + arg);
                }

                argsString = argsString.substring(0, endOfArg);
                const args = argsString
                    .split(',')
                    .map((a) => this._translateArg(context, localContext, a.trim(), callingEntity));
                if (args.length > 1) {
                    throw new Error(`$default.${defaultKeywords} can only support one argument as $where: ` + arg);
                }

                if (args.length > 0) {
                    if (args[0] === entity.key) {
                        return `{ $where: { ${entity.key} }, ${viewReplacement} }`;
                    }
                    return `{ $where: ${args[0]}, ${viewReplacement} }`;
                }
            }

            return `{ ${viewReplacement} }`;
        }

        throw new Error(`Unsupported argument: ${arg}`);
    }

    _parseMethodArgs(context, localContext, calling, callingEntity) {
        let [method, argsString] = splitFirst(calling, '(');
        const endOfArg = argsString.lastIndexOf(')');

        if (endOfArg === -1) {
            throw new Error('Invalid business invoking syntax: ' + line);
        }

        argsString = argsString.substring(0, endOfArg);
        const args = argsString
            .split(',')
            .map((a) => this._translateArg(context, localContext, a.trim(), callingEntity, method));
        return [method, args];
    }

    _generateCodeLine(context, localContext, line, codeBucket, index) {
        if (line.startsWith('$business.')) {
            const [business, calling] = splitFirst(line.substring(10), '.');
            if (!localContext.businesses.has(business)) {
                codeBucket.push(`const ${business}Bus = ctx.bus('${business}');`);
            }

            const [method, args] = this._parseMethodArgs(context, localContext, calling);
            const isAsync = method.endsWith('_');

            if (index > 0) {
                this._ensureVar(localContext, '_busResult', codeBucket);
            }
            let leftPart = index === 0 ? 'let { result, payload }' : '_busResult';
            codeBucket.push(`${leftPart} = ${isAsync ? 'await ' : ''}${business}Bus.${method}(${args.join(', ')});`);
            if (index > 0) {
                codeBucket.push(
                    `result = _busResult.result;
                    if (_busResult.payload) {
                        payload = { ...payload, ..._busResult.payload };
                    }`
                );
            } else {
                localContext.variables.add('result');
                localContext.variables.add('payload');
            }
        } else if (line.startsWith('$entity.')) {
            const [entityName, calling] = splitFirst(line.substring(8), '.');
            this._ensureEntity(localContext, entityName, codeBucket);

            const [method, args] = this._parseMethodArgs(context, localContext, calling, entityName);
            const isAsync = method.endsWith('_');

            this._ensureVar(localContext, 'result', codeBucket);
            this._ensureVar(localContext, 'payload', codeBucket);
            this._ensureVar(localContext, '_entityResult', codeBucket);
            codeBucket.push(
                `_entityResult = ${isAsync ? 'await ' : ''}${naming.pascalCase(entityName)}.${method}(${args.join(
                    ', '
                )});`
            );

            if (method === 'findOne_') {
                codeBucket.push(`result = _entityResult;`);
            } else {
                codeBucket.push(`result = _entityResult.data;`);
            }

            if (method === 'findManyByPage_') {
                codeBucket.push(`payload = { ...payload, totalCount: _entityResult.totalCount };`);
            }
        }
    }

    _generateResourceEndpoint(context, locals, method, endpointInfo, subRouteParam) {
        const { description, request, responses, implementation } = endpointInfo;

        const localContext = {
            entities: new Set(),
            businesses: new Set(),
            variables: new Set(),
            subRouteParam,
        };

        if (subRouteParam != null) {
            localContext.variables.add(subRouteParam);
        }

        let codeSanitize = [];

        if (request) {
            const { headers, query, params, body, state, ctx } = request;

            if (body) {
                this._extractRequestData(context, localContext, 'body', body, 'ctx.request.body', codeSanitize);
            }

            if (query) {
                this._extractRequestData(context, localContext, 'query', query, 'ctx.query', codeSanitize);
            }

            this._extractRequestVariables(context, localContext, headers, 'ctx.headers', codeSanitize);
            this._extractRequestVariables(context, localContext, params, 'ctx.params', codeSanitize);
            this._extractTrustVariables(context, localContext, state, 'ctx.state', codeSanitize);
        }

        let codeImplement = [];

        if (implementation) {
            implementation.forEach((line, index) => {
                this._generateCodeLine(context, localContext, line, codeImplement, index);
            });
        }

        if (subRouteParam) {
            const mapMethods = {
                get: 'get_',
                put: 'put_',
                patch: 'patch_',
                delete: 'delete_',
            };

            const classMethod = mapMethods[method];

            if (classMethod == null) {
                throw new Error('Invalid method: ' + method);
            }

            const methodBody = `
    /**
     * ${description}
     * @param {object} ctx - Koa context
     * @returns {Promise}
     */        
    async ${classMethod}(ctx, ${subRouteParam}) {
        // sanitization
        ${codeSanitize.join('\n')}

        // business logic
        ${codeImplement.join('\n')}

        // return response
        this.send(ctx, result, payload);
    }
`;
            locals.methods.push(methodBody);
        } else {
            const mapMethods = {
                get: 'query_',
                post: 'post_',
                put: 'putMany_',
                patch: 'patchMany_',
                delete: 'deleteMany_',
            };

            const classMethod = mapMethods[method];

            if (classMethod == null) {
                throw new Error('Invalid method: ' + method);
            }

            const methodBody = `
    /**
     * ${description}
     * @param {object} ctx - Koa context
     * @returns {Promise}
     */        
    async ${classMethod}(ctx) {
        // sanitization
        ${codeSanitize.join('\n')}

        // business logic
        ${codeImplement.join('\n')}

        // return response
        this.send(ctx, result, payload);
    }
`;
            locals.methods.push(methodBody);
        }
    }
}

module.exports = ApiGenerator;
