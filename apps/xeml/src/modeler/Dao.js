const path = require('node:path');
const {
    _,
    naming,
    dropIfEndsWith,
    isPlainObject,
    baseName,
    isEmpty,
    pushIntoBucket,
    splitFirst,
    replaceAll,
    
} = require('@kitmi/utils');
const { fs } = require('@kitmi/sys');
const swig = require('swig-templates');
const esprima = require('esprima');

const XemlTypes = require('../lang/XemlTypes');
const Field = require('../lang/Field');
const JsLang = require('./util/ast');
const XemlToAst = require('./util/xemlToAst');
const Snippets = require('./dao/snippets');
const Methods = require('./dao/methods');
const { extractReferenceBaseName } = require('../lang/XemlUtils');
const { globSync } = require('glob');
const yaml = require('yaml');

const INPUT_SCHEMA_DERIVED_KEYS = [
    'type',
    'noTrim',
    'emptyAsNull',
    'encoding',
    'format',
    'schema',
    'element',
    'keepUnsanitized',
    'valueSchema',
    'delimiter',
    'csv',
    'enum',
];
const DATASET_FIELD_KEYS = [...INPUT_SCHEMA_DERIVED_KEYS, 'optional', 'default'];

const MAP_META_TO_MODIFIER = {
    fixedLength: 'length',
    maxLength: 'maxLength',
    minLength: 'minLength',
};

const ChainableType = [
    XemlToAst.AST_BLK_VALIDATOR_CALL,
    XemlToAst.AST_BLK_PROCESSOR_CALL,
    XemlToAst.AST_BLK_ACTIVATOR_CALL,
];

const getFieldName = (t) => t.split('.').pop();
const isChainable = (current, next) =>
    ChainableType.indexOf(current.type) > -1 && current.target === next.target && next.type === current.type;
const chainCall = (lastBlock, lastType, currentBlock, currentType) => {
    if (lastBlock) {
        if (lastType === 'ValidatorCall') {
            if (currentType !== 'ValidatorCall') {
                throw new Error('Unexpected currentType');
            }

            currentBlock = JsLang.astBinExp(lastBlock, '&&', currentBlock);
        } else {
            if (currentType !== 'ProcessorCall') {
                console.log({
                    lastType,
                    currentType,
                    lastBlock: JsLang.astToCode(lastBlock),
                    currentBlock: JsLang.astToCode(currentBlock),
                });
                throw new Error('Unexpected currentType: ' + currentType + ' last: ' + lastType);
            }

            currentBlock.arguments[0] = lastBlock;
        }
    }

    return currentBlock;
};
const asyncMethodNaming = (name) => name + '_';

const indentLines = (lines, indentation) =>
    lines
        .split('\n')
        .map((line, i) => (i === 0 ? line : _.repeat(' ', indentation) + line))
        .join('\n');

const XEML_MODIFIER_RETURN = {
    [XemlTypes.Modifier.VALIDATOR]: () => [JsLang.astThrow('Error', ['To be implemented!']), JsLang.astReturn(true)],
    [XemlTypes.Modifier.PROCESSOR]: (args) => [
        JsLang.astThrow('Error', ['To be implemented!']),
        JsLang.astReturn(JsLang.astId(args[0])),
    ],
    [XemlTypes.Modifier.ACTIVATOR]: () => [
        JsLang.astThrow('Error', ['To be implemented!']),
        JsLang.astReturn(JsLang.astId('undefined')),
    ],
};

/**
 * Geml database access object (DAO) modeler.
 * @class
 */
class DaoModeler {
    /**
     * @param {object} modelService
     * @param {XemlLinker} linker - Xeml linker
     * @param {Connector} connector
     */
    constructor(modelService, linker, connector) {
        this.modelService = modelService;
        this.linker = linker;
        this.outputPath = modelService.config.modelPath;

        this.connector = connector;
    }

    modeling_(schema, versionInfo) {
        this.linker.log('info', 'Generating entity models for schema "' + schema.name + '"...');

        this._generateDbModel(schema, versionInfo);
        const datasetEntries = this._generateEntityDatasetSchema(schema, versionInfo);
        const { sharedModifiers } = this._generateEntityModel(schema, datasetEntries, versionInfo);
        this._generateSharedModifiers(schema, sharedModifiers, versionInfo);
        this._generateEnumTypes(schema, versionInfo);
        //this._generateEntityInputSchema(schema, versionInfo);
        this._generateEntityViews(schema);
        this.generateApi(schema, versionInfo);
        //
        //this._generateViewModel();
    }

    buildApiClient(schema, versionInfo) {
        this.linker.log('info', 'Generating API client for schema "' + schema.name + '"...');

        const schemaPath = path.join(path.dirname(schema.linker.getModulePathById(schema.xemlModule.id)), 'api');

        // check if api folder exists and read all yaml files under api folder
        const datasetFiles = globSync('*.yaml', { nodir: true, cwd: schemaPath });
        const datasetFilesSet = new Set(datasetFiles);

        if (datasetFilesSet.size === 0) {
            return;
        }

        const context = {
            schema,
            versionInfo,
            sharedTypes: {},
        };

        const typeSpecialize = (typeInfo, argsMap) => {};

        // process __types.yaml for type definitions
        if (datasetFilesSet.has('__types.yaml')) {
            const types = yaml.parse(fs.readFileSync(path.join(schemaPath, '__types.yaml'), 'utf8'));
            // check if any type has $args property, change the type to a function

            _.each(types, (type, typeName) => {
                let typeInfo = type;

                if (type.$args) {
                    typeInfo = (variables) => {
                        if (type.$args.find((arg) => !(arg in variables))) {
                            throw new Error(
                                `Specialization argument "${arg}" is required for type constructor "${typeName}".`
                            );
                        }
                        return typeSpecialize(type, variables);
                    };
                }

                context.sharedTypes[typeName] = typeInfo;
            });
            datasetFilesSet.delete('__types.yaml');
        }

        // process __groups.yaml for group definitions
        if (datasetFilesSet.has('__groups.yaml')) {
            context.groups = yaml.parse(fs.readFileSync(path.join(schemaPath, '__groups.yaml'), 'utf8'));
            datasetFilesSet.delete('__groups.yaml');
        }

        for (const datasetFile of datasetFilesSet) {
            if (datasetFile.startsWith('_')) {
                continue;
            }

            const resourceName = path.basename(datasetFile, '.yaml');
            const resources = yaml.parse(fs.readFileSync(path.join(schemaPath, datasetFile), 'utf8'));
            _.each(resources, (resourceInfo, baseEndpoint) => {
                this._generateResourceApi(context, resourceName, baseEndpoint, resourceInfo);
            });
        }
    }

    _featureReducer(schema, entity, featureName, feature) {
        let field;

        switch (featureName) {
            case 'autoId':
                break;

            case 'createTimestamp':
                break;

            case 'updateTimestamp':
                break;

            case 'userEditTracking':
                break;

            case 'logicalDeletion':
                break;

            case 'atLeastOneNotNull':
                break;

            case 'stateTracking':
                break;

            case 'i18n':
                break;

            case 'changeLog':
                break;

            case 'createBefore':
                field = entity.fields[feature.relation];
                if (field) {
                    field.fillByRule = true;
                }
                break;

            case 'createAfter':
                break;

            case 'hasClosureTable':
                return [
                    Methods.getAllDescendants(entity, feature),
                    Methods.getAllAncestors(entity, feature),
                    Methods.addChildNode(feature.relation, feature.closureTable),
                    Methods.removeSubTree(feature.relation, feature.closureTable),
                    Methods.cloneSubTree(entity, feature),
                    Methods.getTopNodes(entity, feature.closureTable),
                    Methods.moveNode(entity),
                    Methods.getChildren(feature.reverse),
                    Methods.getParents(feature.relation),
                ];

            case 'isCacheTable':
                break;

            default:
                throw new Error('Unsupported feature "' + featureName + '".');
        }

        return [];
    }

    _generateDbModel(schema, versionInfo) {
        let capitalized = naming.pascalCase(schema.name);

        let locals = {
            schemaVersion: versionInfo.version,
            driver: this.connector.driver,
            className: capitalized,
            schemaName: schema.name,

            entities: Object.keys(schema.entities).map((name) => naming.pascalCase(name)),
        };

        let classTemplate = path.resolve(__dirname, 'database', this.connector.driver, 'Database.js.swig');
        let classCode = swig.renderFile(classTemplate, locals);

        let modelFilePath = path.join(this.outputPath, capitalized + '.js');
        fs.ensureFileSync(modelFilePath);
        fs.writeFileSync(modelFilePath, classCode);

        this.linker.log('info', 'Generated database model: ' + modelFilePath);
    }

    _generateEnumTypes(schema, versionInfo) {
        //build types defined outside of entity
        _.forOwn(schema.types, (typeInfo, type) => {
            if (typeInfo.enum && Array.isArray(typeInfo.enum)) {
                const capitalized = naming.pascalCase(type);

                const content = `export default {
    ${typeInfo.enum
        .map((val) => `${naming.snakeCase(val).toUpperCase()}: '${val}'`)
        .join(',\n    ')}                    
};`;

                const modelFilePath = path.join(this.outputPath, schema.name, 'types', capitalized + '.js');
                fs.ensureFileSync(modelFilePath);
                fs.writeFileSync(modelFilePath, content);

                this.linker.log('info', 'Generated enum type definition: ' + modelFilePath);
            }
        });
    }

    _generateSharedModifiers(schema, sharedModifiers, versionInfo) {
        _.each(sharedModifiers, (modifier) => {
            this._generateFunctionTemplateFile(schema, modifier, versionInfo);
        });
    }

    _generateEntityModel(schema, _datasetFiles, versionInfo) {
        const sharedModifiers = {};

        _.forOwn(schema.entities, (entity, entityInstanceName) => {
            const extraMethods = [];
            const datasetFiles = _datasetFiles[entityInstanceName];

            if (entity.features) {
                _.forOwn(entity.features, (f, featureName) => {
                    if (Array.isArray(f)) {
                        f.forEach((ff) => extraMethods.push(...this._featureReducer(schema, entity, featureName, ff)));
                    } else {
                        extraMethods.push(...this._featureReducer(schema, entity, featureName, f));
                    }
                });
            }

            let capitalized = naming.pascalCase(entityInstanceName);

            //shared information with model CRUD and customized interfaces
            let sharedContext = {
                mapOfFunctorToFile: {},
                newFunctorFiles: [],
            };

            let { ast: astClassMain, fieldReferences } = this._processFieldModifiers(entity, sharedContext);
            astClassMain = [astClassMain];

            //prepare meta data
            let uniqueKeys = [_.castArray(entity.key)];

            if (entity.indexes) {
                entity.indexes.forEach((index) => {
                    if (index.unique) {
                        uniqueKeys.push(index.fields);
                    }
                });
            }

            let modelMeta = {
                schemaName: schema.name,
                name: entityInstanceName,
                keyField: entity.key,
                fields: _.mapValues(entity.fields, (f) => _.omit(f.toJSON(), 'modifiers')),
                features: entity.features || {},
                uniqueKeys,
            };

            if (entity.baseClasses) {
                modelMeta.baseClasses = entity.baseClasses;

                if (entity.baseClasses.includes('_messageQueue')) {
                    extraMethods.push(Methods.popJob(this.connector, entityInstanceName));
                    extraMethods.push(Methods.postJob());
                    extraMethods.push(Methods.jobDone());
                    extraMethods.push(Methods.jobFail());
                    extraMethods.push(Methods.retry());
                }

                if (entity.baseClasses.includes('_deferredQueue')) {
                    extraMethods.push(
                        ...[
                            Methods.postDeferredJob(),
                            Methods.removeExpiredJobs(),
                            Methods.getDueJobs(),
                            Methods.getBatchStatus(),
                        ]
                    );
                }
            }

            if (!isEmpty(entity.indexes)) {
                modelMeta.indexes = entity.indexes;
            }

            if (!isEmpty(entity.features)) {
                modelMeta.features = entity.features;
            }

            if (!isEmpty(entity.associations)) {
                modelMeta.associations = entity.associations;
            }

            if (!isEmpty(fieldReferences)) {
                modelMeta.fieldDependencies = fieldReferences;
            }

            sharedContext.newFunctorFiles?.forEach((functor) => {
                if (functor.functorType === XemlTypes.Modifier.PROCESSOR) {
                    astClassMain.push(Snippets.processorMethod(functor));
                }
            });

            const importLines = [];
            const assignLines = [];
            const staticLines = [];
            const importBucket = {};

            importLines.push(JsLang.astToCode(Snippets.importFromData()));
            if (datasetFiles) {
                _.each(datasetFiles, (datasetFile, datasetName) => {
                    importLines.push(
                        JsLang.astToCode(
                            JsLang.astImport('schema_' + datasetName, './' + path.join('schema', datasetFile))
                        )
                    );
                });
            }

            if (entity.modifiers) {
                const modifiers = this._processUsedModifiers(entity);

                modifiers.forEach((modifier) => {
                    importLines.push(
                        JsLang.astToCode(
                            JsLang.astImport(
                                dropIfEndsWith(modifier.name, '_') +
                                    modifier.$xt +
                                    (modifier.name.endsWith('_') ? '_' : ''),
                                './' + path.join(modifier.$xt.toLowerCase() + 's', modifier.name)
                            )
                        )
                    );
                    astClassMain.push(Snippets.modifierMethod(modifier));
                });
            }

            if (!isEmpty(datasetFiles)) {
                const datasetSchemas = {};
                _.each(datasetFiles, (v, datasetName) => {
                    const k = 'schema_' + datasetName;
                    datasetSchemas[datasetName] = JsLang.astId(k);
                });

                staticLines.push(
                    JsLang.astToCode(JsLang.astAssign(`${capitalized}.meta.schemas`, JsLang.astValue(datasetSchemas)))
                );
            }

            //generate functors if any
            if (!isEmpty(sharedContext.mapOfFunctorToFile)) {
                _.forOwn(sharedContext.mapOfFunctorToFile, (fileName, functionName) => {
                    if (isPlainObject(fileName)) {
                        const importName = fileName.type + 's';
                        const asLocalName =
                            (fileName.packageName ? naming.camelCase(fileName.packageName) : '') + importName;
                        if (fileName.packageName) {
                            pushIntoBucket(importBucket, fileName.packageName, importName);

                            assignLines.push(
                                JsLang.astToCode(
                                    JsLang.astVarDeclare(
                                        fileName.functorId,
                                        JsLang.astVarRef(asLocalName + '.' + fileName.functionName, false),
                                        true
                                    )
                                )
                            );
                        } else {
                            // same package
                            sharedModifiers[functionName] = fileName;
                            importLines.push(
                                JsLang.astToCode(
                                    JsLang.astImport(fileName.functorId, baseName(fileName.fileName, true))
                                )
                            );
                        }
                    } else {
                        importLines.push(JsLang.astToCode(JsLang.astImport(functionName, baseName(fileName, true))));
                    }
                });

                _.forOwn(importBucket, (importNames, packageName) => {
                    const names = _.uniq(importNames);
                    names.forEach((importName) => {
                        const asLocalName = naming.camelCase(packageName) + importName;
                        importLines.push(
                            JsLang.astToCode(
                                JsLang.astImportNonDefault(packageName, { name: importName, local: asLocalName })
                            )
                        );
                    });
                });
            }

            if (!isEmpty(sharedContext.newFunctorFiles)) {
                _.each(sharedContext.newFunctorFiles, (entry) => {
                    this._generateFunctionTemplateFile(schema, entry, versionInfo);
                });
            }

            //import views
            if (!isEmpty(entity.views)) {
                importLines.push(JsLang.astToCode(JsLang.astImport('views', './views/' + entity.name + '.json')));

                staticLines.push(
                    JsLang.astToCode(JsLang.astAssign(`${capitalized}.meta.views`, JsLang.astId('views')))
                );
            }

            //add package path
            const packageName = entity.xemlModule.packageName;
            if (packageName) {
                modelMeta.fromPackage = packageName;
                modelMeta.packagePath = this.modelService.config.dependencies[packageName]; //path.relative(this.linker.dependencies[packageName], this.linker.app.workingPath);
            }

            let locals = {
                schemaVersion: versionInfo.version,
                driver: this.connector.driver,
                imports: importLines.join('\n'),
                assigns: assignLines.join('\n'),
                extraMethods: extraMethods.join('\n'),
                className: capitalized,
                entityMeta: indentLines(JSON.stringify(modelMeta, null, 4), 4),
                classBody: indentLines(astClassMain.map((block) => JsLang.astToCode(block)).join('\n\n'), 8),
                statics: staticLines.join('\n'),
                //mixins
            };

            let classTemplate = path.resolve(__dirname, 'database', this.connector.driver, 'EntityModel.js.swig');
            let classCode = swig.renderFile(classTemplate, locals);

            let modelFilePath = path.join(this.outputPath, schema.name, capitalized + '.js');
            fs.ensureFileSync(modelFilePath);
            fs.writeFileSync(modelFilePath, classCode);

            this.linker.log('info', 'Generated entity model: ' + modelFilePath);
        });

        return { sharedModifiers };
    }

    /*
    _generateEntityInputSchema(schema, versionInfo) {
        //generate validator config
        _.forOwn(schema.entities, (entity, entityInstanceName) => {
            _.each(entity.inputs, (inputs, inputSetName) => {
                const validationSchema = {};
                const dependencies = new Set();
                const ast = JsLang.astProgram(true);

                inputs.forEach((input) => {
                    //:address
                    if (input.name.startsWith(':')) {
                        const assoc = input.name.substr(1);
                        const assocMeta = entity.associations[assoc];

                        if (!assocMeta) {
                            throw new Error(`Association "${assoc}" not found in entity [${entityInstanceName}].`);
                        }

                        if (!input.spec) {
                            throw new Error(
                                `Input "spec" is required for entity reference. Input set: ${inputSetName}, entity: ${entityInstanceName}, local: ${assoc}, referencedEntity: ${assocMeta.entity}`
                            );
                        }

                        const dep = `${assocMeta.entity}-${input.spec}`;
                        dependencies.add(dep);

                        if (assocMeta.list) {
                            validationSchema[input.name] = JsLang.astValue({
                                type: 'array',
                                elementSchema: {
                                    type: 'object',
                                    schema: JsLang.astCall(_.camelCase(dep), []),
                                },
                                ..._.pick(input, ['optional', 'default']),
                            });
                        } else {
                            validationSchema[input.name] = JsLang.astValue({
                                type: 'object',
                                schema: JsLang.astCall(_.camelCase(dep), []),
                                ..._.pick(input, ['optional', 'default']),
                            });
                        }
                    } else {
                        const field = entity.fields[input.name];

                        if (!field) {
                            throw new Error(`Field "${input.name}" not found in entity [${entityInstanceName}].`);
                        }

                        validationSchema[input.name] = JsLang.astValue({
                            ..._.pick(field, ['type', 'values']),
                            ..._.pick(input, ['optional', 'default']),
                        });
                    }
                });

                //console.dir(JsLang.astValue(validationSchema), {depth: 20});

                const exportBody = Array.from(dependencies).map((dep) =>
                    JsLang.astImport(_.camelCase(dep), `./${dep}`)
                );

                JsLang.astPushInBody(
                    ast,
                    JsLang.astAssign(
                        JsLang.astVarRef('module.exports'),
                        JsLang.astAnonymousFunction([], exportBody.concat(JsLang.astReturn(validationSchema)))
                    )
                );

                let inputSchemaFilePath = path.join(
                    this.outputPath,
                    schema.name,
                    'inputs',
                    entityInstanceName + '-' + inputSetName + '.js'
                );
                fs.ensureFileSync(inputSchemaFilePath);
                fs.writeFileSync(inputSchemaFilePath, JsLang.astToCode(ast));

                this.linker.log('info', 'Generated entity input schema: ' + inputSchemaFilePath);
            });
        });
    }
    */

    _fieldMetaToModifiers(fieldMeta) {
        const result = [];
        for (let key in fieldMeta) {
            const mapped = MAP_META_TO_MODIFIER[key];
            if (mapped) {
                result.push([`~${mapped}`, fieldMeta[key]]);
            }
        }

        return result;
    }

    _processTypeInfo(typeInfo, entity, name) {
        if (entity && typeInfo.type && name) {
            let [mixed] = this.linker.trackBackType(entity.xemlModule, typeInfo);
            const field = new Field(name, mixed);
            field.link();
            typeInfo = field;
        }

        const postProcessors = this._fieldMetaToModifiers(typeInfo);
        const extra =
            postProcessors.length > 0
                ? { post: typeInfo?.post ? postProcessors.concat(typeInfo.post) : postProcessors }
                : {};

        return JsLang.astValue({
            ..._.pick(typeInfo, DATASET_FIELD_KEYS),
            ...extra,
        });
    }

    _generateEntityDatasetSchema(schema, versionInfo) {
        const _datasetEntries = {};

        //generate validator config
        _.forOwn(schema.entities, (entity, entityInstanceName) => {
            const datasetEntries = {};
            const entityPath = path.dirname(entity.linker.getModulePathById(entity.xemlModule.id));

            // read <entity>-schema-<inputSetName>.yaml
            const prefix = `${entityInstanceName}-schema-`;
            const pattern = `${prefix}*.yaml`;
            const datasetFiles = globSync(pattern, { nodir: true, cwd: entityPath });

            datasetFiles.forEach((datasetFile) => {
                const inputSetName = path.basename(datasetFile, '.yaml').substring(prefix.length);
                const { schema: datasetSchema, ...others } = yaml.parse(
                    fs.readFileSync(path.join(entityPath, datasetFile), 'utf8')
                );

                const _validationSchema = {};
                const dependencies = new Set();
                const ast = JsLang.astProgram(true);

                for (let key in datasetSchema) {
                    let name = key;
                    const input = datasetSchema[key];

                    //:address
                    if (name.startsWith('+')) {
                        // extra field that not in the entity
                        name = name.substring(1);                        
                        _validationSchema[name] = this._processTypeInfo(input, entity, name);
                    } else if (name.startsWith(':')) {
                        const assoc = name.substring(1);
                        const assocMeta = entity.associations[assoc];

                        if (!assocMeta) {
                            throw new Error(`Association "${assoc}" not found in entity [${entityInstanceName}].`);
                        }

                        if (!input.spec) {
                            // link to the dataset of the referenced entity
                            throw new Error(
                                `Input "spec" is required for entity reference. Input set: ${inputSetName}, entity: ${entityInstanceName}, local: ${assoc}, referencedEntity: ${assocMeta.entity}`
                            );
                        }

                        const dep = `${assocMeta.entity}-${input.spec}`;
                        dependencies.add(dep);

                        if (assocMeta.list) {
                            _validationSchema[name] = JsLang.astValue({
                                type: 'array',
                                element: {
                                    type: 'object',
                                    schema: JsLang.astCall(_.camelCase(dep), []),
                                },
                                ..._.pick(input, DATASET_FIELD_KEYS),
                            });
                        } else {
                            _validationSchema[name] = JsLang.astValue({
                                type: 'object',
                                schema: JsLang.astCall(_.camelCase(dep), []),
                                ..._.pick(input, DATASET_FIELD_KEYS),
                            });
                        }
                    } else {
                        const field = entity.fields[name];

                        if (!field) {
                            throw new Error(`Field "${name}" not found in entity [${entityInstanceName}].`);
                        }

                        const mixed = { ...field, ...input };
                        const postProcessors = this._fieldMetaToModifiers(mixed);
                        const extra =
                            postProcessors.length > 0
                                ? { post: input?.post ? postProcessors.concat(input.post) : postProcessors }
                                : {};

                        _validationSchema[name] = JsLang.astValue({
                            ..._.pick(field, INPUT_SCHEMA_DERIVED_KEYS),
                            ..._.pick(input, DATASET_FIELD_KEYS),
                            ...extra,
                        });
                    }
                }

                //console.dir(JsLang.astValue(validationSchema), {depth: 20});

                const validationSchema = {
                    schema: _validationSchema,
                    ...others,
                };

                const exportBody = Array.from(dependencies).map((dep) =>
                    JsLang.astImport(_.camelCase(dep), `./${dep}`)
                );

                JsLang.astPushInBody(
                    ast,
                    JsLang.astFunction('schemaCreator', [], exportBody.concat(JsLang.astReturn(validationSchema)))
                );

                JsLang.astPushInBody(ast, JsLang.astExportDefault('schemaCreator'));

                let inputSchemaFilePath = path.join(
                    this.outputPath,
                    schema.name,
                    'schema',
                    entityInstanceName + '-' + inputSetName + '.js'
                );
                fs.ensureFileSync(inputSchemaFilePath);
                const code = `// v.${versionInfo.version} by xeml\n` + JsLang.astToCode(ast);
                fs.writeFileSync(inputSchemaFilePath, code);
                datasetEntries[inputSetName] = entityInstanceName + '-' + inputSetName;

                this.linker.log('info', 'Generated entity input schema: ' + inputSchemaFilePath);
            });

            _datasetEntries[entityInstanceName] = datasetEntries;
        });

        return _datasetEntries;
    }

    _generateEntityViews(schema) {
        //generate views config
        _.forOwn(schema.entities, (entity, entityInstanceName) => {
            if (!isEmpty(entity.views)) {
                const views = _.mapValues(entity.views, (viewSet) => {
                    return {
                        ...viewSet,
                        $select: viewSet.$select.reduce((columns, field) => {
                            if (isPlainObject(field)) {
                                if (field.$xt === 'ExclusiveSelect') {
                                    const { columnSet, excludes } = field;
                                    let refEntity = entity;

                                    if (columnSet.indexOf('.') !== -1) {
                                        // association
                                        const baseAssoc = extractReferenceBaseName(columnSet);
                                        refEntity = entity.getReferencedEntityByPath(baseAssoc);
                                    }

                                    // get all fields
                                    for (const fieldName in refEntity.fields) {
                                        if (!excludes.includes('-' + fieldName)) {
                                            columns.push(fieldName);
                                        }
                                    }

                                    return columns;
                                }
                            }

                            columns.push(field);
                            return columns;
                        }, []),
                    };
                });

                let inputSchemaFilePath = path.join(
                    this.outputPath,
                    schema.name,
                    'views',
                    entityInstanceName + '.json'
                );
                fs.ensureFileSync(inputSchemaFilePath);
                fs.writeFileSync(inputSchemaFilePath, JSON.stringify(views, null, 4));

                this.linker.log('info', 'Generated entity views data set: ' + inputSchemaFilePath);
            }
        });
    }

    generateApi(schema) {
        const schemaPath = path.join(path.dirname(schema.linker.getModulePathById(schema.xemlModule.id)), 'api');

        // check if api folder exists and read all yaml files under api folder
        const apiDefFiles = globSync('*.yaml', { nodir: true, cwd: schemaPath });
        const apiDefFilesSet = new Set(apiDefFiles);

        if (apiDefFilesSet.size === 0) {
            return;
        }

        const context = {
            schema,
            sharedTypes: {},
        };

        // todo: typeSpecialize
        const typeSpecialize = (typeInfo, argsMap) => {};

        // process __types.yaml for type definitions
        if (apiDefFilesSet.has('__types.yaml')) {
            const types = yaml.parse(fs.readFileSync(path.join(schemaPath, '__types.yaml'), 'utf8'));
            // check if any type has $args property, change the type to a function

            _.each(types, (type, typeName) => {
                let typeInfo = type;

                if (type.$args) {
                    typeInfo = (variables) => {
                        if (type.$args.find((arg) => !(arg in variables))) {
                            throw new Error(
                                `Specialization argument "${arg}" is required for type constructor "${typeName}".`
                            );
                        }
                        return typeSpecialize(type, variables);
                    };
                }

                context.sharedTypes[typeName] = typeInfo;
            });
            apiDefFilesSet.delete('__types.yaml');
        }

        // process __groups.yaml for group definitions
        if (apiDefFilesSet.has('__groups.yaml')) {
            context.groups = yaml.parse(fs.readFileSync(path.join(schemaPath, '__groups.yaml'), 'utf8'));
            apiDefFilesSet.delete('__groups.yaml');
        }

        for (const datasetFile of apiDefFilesSet) {
            if (datasetFile.startsWith('_')) {
                continue;
            }

            const resourceName = path.basename(datasetFile, '.yaml');
            const resources = yaml.parse(fs.readFileSync(path.join(schemaPath, datasetFile), 'utf8'));
            _.each(resources, (resourceInfo, baseEndpoint) => {
                this._generateResourceApi(context, resourceName, baseEndpoint, resourceInfo);
            });
        }

        // generate index file for all groups
        for (let key in context.groups) {
            const groupInfo = context.groups[key];
            if (groupInfo.moduleSource === 'project') {
                const groupPath = path.join(this.modelService.config.sourcePath, groupInfo.controllerPath);

                const apiFiles = globSync('**/*.js', { nodir: true, cwd: groupPath });                

                // filter out index.js and sort the rest and make an export list
                const exportList = apiFiles
                    .filter((f) => f !== 'index.js')
                    .sort()
                    .map((f) => {
                        const name = baseName(f, true);
                        const localName = replaceAll(name, '/', '__');
                        return `export { default as ${localName} } from './${name}';`;
                    });

                // override index.js
                const indexFilePath = path.join(groupPath, 'index.js');
                fs.writeFileSync(indexFilePath, exportList.join('\n'));
            }
        }
    }

    _generateResourceApi(context, resourceName, baseEndpoint, resourceInfo) {
        if (!baseEndpoint.startsWith('/')) {
            throw new Error("Base endpoint should start with '/'.");
        }

        const resourceClassName = naming.pascalCase(resourceName);
        const { description, group, endpoints } = resourceInfo;

        const groupInfo = context.groups[group];

        if (groupInfo == null) {
            throw new Error(`Group "${group}" not found in "api/__groups.yaml".`);
        }

        const locals = {
            baseEndpoint,
            className: resourceClassName,
            resourceName,
            description,
            methods: [],
        };

        _.each(endpoints, (endpointInfo, endpoint) => {
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

        const classTemplate = path.resolve(__dirname, 'dao', 'Api.js.swig');
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

        this.linker.log('info', 'Generated api controller: ' + resourceFilePath);
    }

    _ensureEntity(localContext, entityName, codeBucket) {
        if (!localContext.entities.has(entityName)) {
            codeBucket.push(`const ${naming.pascalCase(entityName)} = this.$m('${entityName}');`);
            localContext.entities.add(entityName);
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
            return JsLang.astVarRef(`${naming.pascalCase(entityName)}.meta.fields['${fieldName}']`);
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
            const { $base, ...others } = collection;
            if ($base) {
                const baseMetadata = this._getReferencedMetadata(context, localContext, $base, codeBucket);
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

                codeBucket.push(
                    `const ${localName} = _.get(${source}, '${key}');`
                );
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

    _translateArg(context, localContext, arg) {
        if (arg.startsWith('$local.')) {
            return arg.substring(7);
        }
    }

    _generateCodeLine(context, localContext, line, codeBucket) {
        if (line.startsWith('$business.')) {
            const [business, calling] = splitFirst(line.substring(10), '.');
            if (!localContext.businesses.has(business)) {
                codeBucket.push(`const ${business}Bus = this.app.bus('${business}');`);
            }

            let [method, argsString] = splitFirst(calling, '(');
            const endOfArg = argsString.lastIndexOf(')');

            if (endOfArg === -1) {
                throw new Error('Invalid business invoking syntax: ' + line);
            }

            argsString = argsString.substring(0, endOfArg);
            const args = argsString.split(',').map((a) => this._translateArg(context, localContext, a.trim()));
            const isAsync = method.endsWith('_');
            codeBucket.push(
                `let { result, payload } = ${isAsync ? 'await ' : ''}${business}Bus.${method}(${args.join(', ')});`
            );
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
            implementation.forEach((line) => {
                this._generateCodeLine(context, localContext, line, codeImplement);
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

    /*
    _generateViewModel(schema, dbService) {        
        _.forOwn(schema.views, (viewInfo, viewName) => {
            this.linker.info('Building view: ' + viewName);

            let capitalized = _.upperFirst(viewName);

            let ast = JsLang.astProgram();

            JsLang.astPushInBody(ast, JsLang.astRequire('Mowa', 'mowa'));
            JsLang.astPushInBody(ast, JsLang.astVarDeclare('Util', JsLang.astVarRef('Mowa.Util'), true));
            JsLang.astPushInBody(ast, JsLang.astVarDeclare('_', JsLang.astVarRef('Util._'), true));
            JsLang.astPushInBody(ast, JsLang.astRequire('View', 'mowa/lib/oolong/runtime/view'));

            let compileContext = OolToAst.createCompileContext(viewName, dbService.serviceId, this.linker);

            compileContext.modelVars.add(viewInfo.entity);

            let paramMeta;

            if (viewInfo.params) {
                paramMeta = this._processParams(viewInfo.params, compileContext);
            }

            let viewMeta = {
                isList: viewInfo.isList,
                params: paramMeta
            };

            let viewBodyTopoId = OolToAst.createTopoId(compileContext, '$view');
            OolToAst.dependsOn(compileContext, compileContext.mainStartId, viewBodyTopoId);

            let viewModeler = require(path.resolve(__dirname, './dao/view', dbService.dbType + '.js'));
            compileContext.astMap[viewBodyTopoId] = viewModeler(dbService, viewName, viewInfo);
            OolToAst.addCodeBlock(compileContext, viewBodyTopoId, {
                type: OolToAst.AST_BLK_VIEW_OPERATION
            });

            let returnTopoId = OolToAst.createTopoId(compileContext, '$return:value');
            OolToAst.dependsOn(compileContext, viewBodyTopoId, returnTopoId);
            OolToAst.compileReturn(returnTopoId, {
                "$xt": "ObjectReference",
                "name": "viewData"
            }, compileContext);

            let deps = compileContext.topoSort.sort();
            this.linker.verbose('All dependencies:\n' + JSON.stringify(deps, null, 2));

            deps = deps.filter(dep => compileContext.mapOfTokenToMeta.has(dep));
            this.linker.verbose('All necessary source code:\n' + JSON.stringify(deps, null, 2));

            let astDoLoadMain = [
                JsLang.astVarDeclare('$meta', JsLang.astVarRef('this.meta'), true, false, 'Retrieving the meta data')
            ];

            _.each(deps, dep => {
                let astMeta = compileContext.mapOfTokenToMeta.get(dep);

                let astBlock = compileContext.astMap[dep];
                assert: astBlock, 'Empty ast block';

                if (astMeta.type === 'ModifierCall') {
                    let fieldName = getFieldName(astMeta.target);
                    let astCache = JsLang.astAssign(JsLang.astVarRef(astMeta.target), astBlock, `Modifying ${fieldName}`);
                    astDoLoadMain.push(astCache);
                    return;
                }

                astDoLoadMain = astDoLoadMain.concat(_.castArray(compileContext.astMap[dep]));
            });

            if (!isEmpty(compileContext.mapOfFunctorToFile)) {
                _.forOwn(compileContext.mapOfFunctorToFile, (fileName, functionName) => {
                    JsLang.astPushInBody(ast, JsLang.astRequire(functionName, '.' + fileName));
                });
            }

            if (!isEmpty(compileContext.newFunctorFiles)) {
                _.each(compileContext.newFunctorFiles, entry => {
                    this._generateFunctionTemplateFile(dbService, entry);
                });
            }

            JsLang.astPushInBody(ast, JsLang.astClassDeclare(capitalized, 'View', [
                JsLang.astMemberMethod('_doLoad', Object.keys(paramMeta),
                    astDoLoadMain,
                    false, true, false, 'Populate view data'
                )
            ], `${capitalized} view`));
            JsLang.astPushInBody(ast, JsLang.astAssign(capitalized + '.meta', JsLang.astValue(viewMeta)));
            JsLang.astPushInBody(ast, JsLang.astAssign('module.exports', JsLang.astVarRef(capitalized)));

            let modelFilePath = path.resolve(this.outputPath, dbService.dbType, dbService.name, 'views', viewName + '.js');
            fs.ensureFileSync(modelFilePath);
            fs.writeFileSync(modelFilePath + '.json', JSON.stringify(ast, null, 2));

            DaoModeler._exportSourceCode(ast, modelFilePath);

            this.linker.log('info', 'Generated view model: ' + modelFilePath);
        });
    };
    */

    _processUsedModifiers(entity) {
        return entity.modifiers.map((modifier) =>
            this.linker.loadElement(entity.xemlModule, modifier.$xt, modifier.name, true)
        );
    }

    /**
     * Process field modifiers and generate ast and field references
     * @param {*} entity
     * @param {object} sharedContext
     * @returns {object} { ast, fieldReferences }
     */
    _processFieldModifiers(entity, sharedContext) {
        let compileContext = XemlToAst.createCompileContext(
            entity.xemlModule.name,
            entity.xemlModule,
            this.linker,
            sharedContext
        );
        compileContext.variables['raw'] = { source: 'context', finalized: true };
        compileContext.variables['i18n'] = { source: 'context', finalized: true };
        compileContext.variables['connector'] = { source: 'context', finalized: true };
        compileContext.variables['latest'] = { source: 'context' };
        compileContext.variables['app'] = { source: 'context', finalized: true, shortFor: 'this.db.app' };

        const allFinished = XemlToAst.createTopoId(compileContext, 'done.');

        //map of field name to dependencies
        let fieldReferences = {};

        _.forOwn(entity.fields, (field, fieldName) => {
            let topoId = XemlToAst.compileField(fieldName, field, compileContext);
            XemlToAst.dependsOn(compileContext, topoId, allFinished);

            /* remove self dependency
            if (field.writeOnce || field.freezeAfterNonDefault) {
                pushIntoBucket(fieldReferences, fieldName, { reference: fieldName, writeProtect: true });
            }
            */
        });

        let deps = compileContext.topoSort.sort();
        //this.linker.verbose('All dependencies:\n' + JSON.stringify(deps, null, 2));

        deps = deps.filter((dep) => compileContext.mapOfTokenToMeta.has(dep));
        //this.linker.verbose('All necessary source code:\n' + JSON.stringify(deps, null, 2));

        let methodBodyValidateAndFill = [],
            lastFieldsGroup,
            methodBodyCache = [],
            lastBlock,
            lastAstType; //, hasValidator = false;

        const _mergeDoValidateAndFillCode = function (fieldName, references, astCache, requireTargetField) {
            let fields = [fieldName].concat(references);
            let checker = fields.join(',');

            if (lastFieldsGroup && lastFieldsGroup.checker !== checker) {
                methodBodyValidateAndFill = methodBodyValidateAndFill.concat(
                    Snippets._fieldRequirementCheck(
                        lastFieldsGroup.fieldName,
                        lastFieldsGroup.references,
                        methodBodyCache,
                        lastFieldsGroup.requireTargetField
                    )
                );
                methodBodyCache = [];
            }

            methodBodyCache = methodBodyCache.concat(astCache);
            lastFieldsGroup = {
                fieldName,
                references,
                requireTargetField,
                checker,
            };
        };

        //console.dir(compileContext.astMap['mobile~isMobilePhone:arg[1]|>stringDasherize'], { depth: 8 });

        _.each(deps, (dep, i) => {
            //get metadata of source code block
            let sourceMap = compileContext.mapOfTokenToMeta.get(dep);

            //get source code block
            let astBlock = compileContext.astMap[dep];

            let targetFieldName = getFieldName(sourceMap.target);

            if (sourceMap.references && sourceMap.references.length > 0) {
                let fieldReference = fieldReferences[targetFieldName];
                if (!fieldReference) {
                    fieldReferences[targetFieldName] = fieldReference = [];
                }

                if (sourceMap.type === XemlToAst.AST_BLK_ACTIVATOR_CALL) {
                    sourceMap.references.forEach((ref) => {
                        fieldReference.push({ reference: ref, whenNull: true });
                    });
                } else {
                    sourceMap.references.forEach((ref) => {
                        if (fieldReference.indexOf(ref) === -1) fieldReference.push(ref);
                    });
                }
            }

            if (lastBlock) {
                astBlock = chainCall(lastBlock, lastAstType, astBlock, sourceMap.type);
                lastBlock = undefined;
            }

            if (i < deps.length - 1) {
                let nextType = compileContext.mapOfTokenToMeta.get(deps[i + 1]);

                if (isChainable(sourceMap, nextType)) {
                    lastBlock = astBlock;
                    lastAstType = sourceMap.type;
                    return;
                }
            }

            if (sourceMap.type === XemlToAst.AST_BLK_VALIDATOR_CALL) {
                //hasValidator = true;
                let astCache = Snippets._validateCheck(targetFieldName, astBlock);
                _mergeDoValidateAndFillCode(targetFieldName, sourceMap.references, astCache, true);
            } else if (sourceMap.type === XemlToAst.AST_BLK_PROCESSOR_CALL) {
                let astCache = JsLang.astAssign(
                    JsLang.astVarRef(sourceMap.target, true),
                    astBlock,
                    `Processing "${targetFieldName}"`
                );

                _mergeDoValidateAndFillCode(targetFieldName, sourceMap.references, astCache, true);
            } else if (sourceMap.type === XemlToAst.AST_BLK_ACTIVATOR_CALL) {
                let astCache = Snippets._checkAndAssign(
                    astBlock,
                    JsLang.astVarRef(sourceMap.target, true),
                    `Activating "${targetFieldName}"`
                );

                _mergeDoValidateAndFillCode(targetFieldName, sourceMap.references, astCache, false);
            } else {
                throw new Error('To be implemented.');
                //astBlock = _.castArray(astBlock);
                //_mergeDoValidateAndFillCode(targetFieldName, [], astBlock);
            }
        });

        /* Changed to throw error instead of returning a error object
        if (hasValidator) {
            let declare = JsLang.astVarDeclare(validStateName, false);
            methodBodyCreate.unshift(declare);
            methodBodyUpdate.unshift(declare);
        }
        */

        if (!isEmpty(methodBodyCache)) {
            methodBodyValidateAndFill = methodBodyValidateAndFill.concat(
                Snippets._fieldRequirementCheck(
                    lastFieldsGroup.fieldName,
                    lastFieldsGroup.references,
                    methodBodyCache,
                    lastFieldsGroup.requireTargetField
                )
            );
        }

        /*
        let ast = JsLang.astProgram();
        JsLang.astPushInBody(ast, JsLang.astClassDeclare('Abc', 'Model', [
            JsLang.astMemberMethod(asyncMethodNaming('prepareEntityData_'), [ 'context' ],
            Snippets._doValidateAndFillHeader.concat(methodBodyValidateAndFill).concat([ JsLang.astReturn(JsLang.astId('context')) ]),
            false, true, true
        )], 'comment'));
        */

        return {
            ast: JsLang.astMemberMethod(
                asyncMethodNaming('applyModifiers'),
                ['context', 'isUpdating'],
                Snippets._applyModifiersHeader
                    .concat(methodBodyValidateAndFill)
                    .concat([JsLang.astReturn(JsLang.astId('context'))]),
                false,
                true,
                false,
                'Applying predefined modifiers to entity fields.'
            ),
            fieldReferences,
        };
    }

    _generateFunctionTemplateFile(schema, { functionName, functorType, fileName, args }, versionInfo) {
        let filePath = path.join(this.outputPath, schema.name, fileName);

        let ast;

        if (fs.existsSync(filePath)) {
            ast = esprima.parseModule(fs.readFileSync(filePath, 'utf8'), { tokens: true, comment: true });
            ast.body[0].leadingComments = JsLang.astLeadingComments(
                ` v.${versionInfo.version} by xeml`
            ).leadingComments;

            fs.ensureFileSync(filePath);
            fs.writeFileSync(filePath, JsLang.astToCode(ast));

            this.linker.log('warn', `${_.upperFirst(functorType)} "${fileName}" exists.`);
        } else {
            ast = JsLang.astProgram(true);

            JsLang.astPushInBody(ast, JsLang.astFunction(functionName, args, XEML_MODIFIER_RETURN[functorType](args)));
            JsLang.astPushInBody(ast, JsLang.astExportDefault(functionName));
            ast.body[0].leadingComments = JsLang.astLeadingComments(
                ` v.${versionInfo.version} by xeml`
            ).leadingComments;
        }

        fs.ensureFileSync(filePath);
        fs.writeFileSync(filePath, JsLang.astToCode(ast));
        this.linker.log('info', `Generated ${functorType} file: ${filePath}`);
    }

    _processParams(acceptParams, compileContext) {
        let paramMeta = {};

        acceptParams.forEach((param, i) => {
            XemlToAst.compileParam(i, param, compileContext);
            paramMeta[param.name] = param;
            compileContext.variables[param.name] = { source: 'argument' };
        });

        return paramMeta;
    }
}

module.exports = DaoModeler;
