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
    splitLast,
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
const { INPUT_SCHEMA_DERIVED_KEYS, DATASET_FIELD_KEYS, fieldMetaToModifiers } = require('./util/transformers');

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
 * Xeml database access object (DAO) modeler.
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
        this._generateEntityViews(schema);
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
                    Methods.getChildren(entity, feature.reverse),
                    Methods.getParents(entity, feature.relation),
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

    _processTypeInfo(typeInfo, entity, name, options) {
        if (entity && typeInfo.type && name) {
            let [mixed] = this.linker.trackBackType(entity.xemlModule, typeInfo);
            const field = new Field(name, mixed);
            field.link();
            typeInfo = field;
        }

        const postProcessors = fieldMetaToModifiers(typeInfo);
        const extra =
            postProcessors.length > 0
                ? { post: typeInfo?.post ? postProcessors.concat(typeInfo.post) : postProcessors }
                : {};

        return JsLang.astValue({
            ..._.pick(typeInfo, DATASET_FIELD_KEYS),
            ...extra,
            ...options,
        });
    }

    _generateEntityDatasetSchema(schema, versionInfo) {
        const _datasetEntries = {};

        function getReferencedFieldInfo(entity, fieldRef) {
            const [refEntity, name] = splitLast(fieldRef, '.');

            let _entity = entity;

            if (refEntity) {
                _entity = entity.getReferencedEntity(refEntity);
            }

            const field = _entity.fields[name];

            if (!field) {
                throw new Error(`Field ref "${fieldRef}" not found in entity [${entity.name}].`);
            }

            return field.toJSON();
        }

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
                    let _fieldOptions = {};
                    const input = datasetSchema[key];

                    if (name.endsWith('?')) {
                        name = name.slice(0, -1);
                        _fieldOptions.optional = true;
                    }

                    //:address
                    if (name.startsWith('+')) {
                        // extra field that not in the entity
                        name = name.substring(1);
                        _validationSchema[name] = this._processTypeInfo(
                            typeof input === 'string' ? getReferencedFieldInfo(entity, input) : input,
                            entity,
                            name,
                            _fieldOptions
                        );
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
                                ..._fieldOptions,
                            });
                        } else {
                            _validationSchema[name] = JsLang.astValue({
                                type: 'object',
                                schema: JsLang.astCall(_.camelCase(dep), []),
                                ..._.pick(input, DATASET_FIELD_KEYS),
                                ..._fieldOptions,
                            });
                        }
                    } else {
                        const field = entity.fields[name];

                        if (!field) {
                            throw new Error(`Field "${name}" not found in entity [${entityInstanceName}].`);
                        }

                        const mixed = { ...field, ...input };
                        const postProcessors = fieldMetaToModifiers(mixed);
                        const extra =
                            postProcessors.length > 0
                                ? { post: input?.post ? postProcessors.concat(input.post) : postProcessors }
                                : {};

                        _validationSchema[name] = JsLang.astValue({
                            ..._.pick(field, INPUT_SCHEMA_DERIVED_KEYS),
                            ..._.pick(input, DATASET_FIELD_KEYS),
                            ...extra,
                            ..._fieldOptions,
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
