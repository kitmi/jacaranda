"use strict";
const path = require("path");
const { _, naming, text, pushIntoBucket } = require("@genx/july");
const { fs } = require("@genx/sys");
const swig = require("swig-templates");
const GemlTypes = require("../lang/GemlTypes");
const JsLang = require("./util/ast.js");
const GemlToAst = require("./util/gemlToAst.js");
const Snippets = require("./dao/snippets");
const { Types } = require("@genx/data");
const ChainableType = [
    GemlToAst.AST_BLK_VALIDATOR_CALL,
    GemlToAst.AST_BLK_PROCESSOR_CALL,
    GemlToAst.AST_BLK_ACTIVATOR_CALL
];
const getFieldName = (t)=>t.split(".").pop();
const isChainable = (current, next)=>ChainableType.indexOf(current.type) > -1 && current.target === next.target && next.type === current.type;
const chainCall = (lastBlock, lastType, currentBlock, currentType)=>{
    if (lastBlock) {
        if (lastType === "ValidatorCall") {
            assert: currentType === "ValidatorCall", "Unexpected currentType";
            currentBlock = JsLang.astBinExp(lastBlock, "&&", currentBlock);
        } else {
            assert: currentType === "ProcessorCall", "Unexpected currentType: " + currentType + " last: " + lastType;
            currentBlock.arguments[0] = lastBlock;
        }
    }
    return currentBlock;
};
const asyncMethodNaming = (name)=>name + "_";
const indentLines = (lines, indentation)=>lines.split("\n").map((line, i)=>i === 0 ? line : _.repeat(" ", indentation) + line).join("\n");
const OOL_MODIFIER_RETURN = {
    [GemlTypes.Modifier.VALIDATOR]: ()=>[
            JsLang.astThrow('Error', [
                'To be implemented!'
            ]),
            JsLang.astReturn(true)
        ],
    [GemlTypes.Modifier.PROCESSOR]: (args)=>[
            JsLang.astThrow('Error', [
                'To be implemented!'
            ]),
            JsLang.astReturn(JsLang.astId(args[0]))
        ],
    [GemlTypes.Modifier.ACTIVATOR]: ()=>[
            JsLang.astThrow('Error', [
                'To be implemented!'
            ]),
            JsLang.astReturn(JsLang.astId("undefined"))
        ]
};
/**
 * Geml database access object (DAO) modeler.
 * @class
 */ class DaoModeler {
    modeling_(schema) {
        this.linker.log("info", 'Generating entity models for schema "' + schema.name + '"...');
        this._generateSchemaModel(schema);
        this._generateEntityModel(schema);
        this._generateEnumTypes(schema);
        this._generateEntityInputSchema(schema);
        //
        //this._generateViewModel();
        if (this.manifestPath) {
            this._generateEntityManifest(schema);
        }
    }
    _generateSchemaModel(schema) {
        let capitalized = naming.pascalCase(schema.name);
        let locals = {
            driver: this.connector.driver,
            className: capitalized,
            schemaName: schema.name,
            entities: JSON.stringify(Object.keys(schema.entities))
        };
        let classTemplate = path.resolve(__dirname, "database", this.connector.driver, "Database.js.swig");
        let classCode = swig.renderFile(classTemplate, locals);
        let modelFilePath = path.resolve(this.outputPath, capitalized + ".js");
        fs.ensureFileSync(modelFilePath);
        fs.writeFileSync(modelFilePath, classCode);
        this.linker.log("info", "Generated database model: " + modelFilePath);
    }
    _generateEnumTypes(schema) {
        //build types defined outside of entity
        _.forOwn(schema.types, (location, type)=>{
            const typeInfo = schema.linker.getTypeInfo(type, location);
            if (typeInfo.type === Types.ENUM.name) {
                const capitalized = naming.pascalCase(type);
                const content = `module.exports = {
    ${typeInfo.values.map((val)=>`${naming.snakeCase(val).toUpperCase()}: '${val}'`).join(",\n    ")}                    
};`;
                const modelFilePath = path.resolve(this.outputPath, schema.name, "types", capitalized + ".js");
                fs.ensureFileSync(modelFilePath);
                fs.writeFileSync(modelFilePath, content);
                this.linker.log("info", "Generated enum type definition: " + modelFilePath);
            }
        });
    }
    _generateEntityModel(schema) {
        _.forOwn(schema.entities, (entity, entityInstanceName)=>{
            let capitalized = naming.pascalCase(entityInstanceName);
            //shared information with model CRUD and customized interfaces
            let sharedContext = {
                mapOfFunctorToFile: {},
                newFunctorFiles: []
            };
            let { ast: astClassMain, fieldReferences } = this._processFieldModifiers(entity, sharedContext);
            astClassMain = [
                astClassMain
            ];
            //prepare meta data
            let uniqueKeys = [
                _.castArray(entity.key)
            ];
            if (entity.indexes) {
                entity.indexes.forEach((index)=>{
                    if (index.unique) {
                        uniqueKeys.push(index.fields);
                    }
                });
            }
            let modelMeta = {
                schemaName: schema.name,
                name: entityInstanceName,
                keyField: entity.key,
                fields: _.mapValues(entity.fields, (f)=>_.omit(f.toJSON(), "modifiers")),
                features: entity.features || {},
                uniqueKeys
            };
            if (entity.baseClasses) {
                modelMeta.baseClasses = entity.baseClasses;
            }
            if (!_.isEmpty(entity.indexes)) {
                modelMeta.indexes = entity.indexes;
            }
            if (!_.isEmpty(entity.features)) {
                modelMeta.features = entity.features;
            }
            if (!_.isEmpty(entity.associations)) {
                modelMeta.associations = entity.associations;
            }
            if (!_.isEmpty(fieldReferences)) {
                modelMeta.fieldDependencies = fieldReferences;
            }
            //build customized interfaces
            if (entity.interfaces) {
                let astInterfaces = this._buildInterfaces(entity, modelMeta, sharedContext);
                //console.log(astInterfaces);
                //let astClass = astClassMain[astClassMain.length - 1];
                //JsLang.astPushInBody(astClass, astInterfaces);
                astClassMain = astClassMain.concat(astInterfaces);
            }
            let importLines = [];
            //generate functors if any
            if (!_.isEmpty(sharedContext.mapOfFunctorToFile)) {
                _.forOwn(sharedContext.mapOfFunctorToFile, (fileName, functionName)=>{
                    importLines.push(JsLang.astToCode(JsLang.astRequire(functionName, "." + fileName)));
                });
            }
            if (!_.isEmpty(sharedContext.newFunctorFiles)) {
                _.each(sharedContext.newFunctorFiles, (entry)=>{
                    this._generateFunctionTemplateFile(schema, entry);
                });
            }
            //add package path
            const packageName = entity.gemlModule.packageName;
            if (packageName) {
                modelMeta.fromPackage = packageName;
                modelMeta.packagePath = this.linker.app.settings.geml.dependencies[packageName]; //path.relative(this.linker.dependencies[packageName], this.linker.app.workingPath);
            }
            let locals = {
                imports: importLines.join("\n"),
                className: capitalized,
                entityMeta: indentLines(JSON.stringify(modelMeta, null, 4), 4),
                classBody: indentLines(astClassMain.map((block)=>JsLang.astToCode(block)).join("\n\n"), 8),
                functors: indentLines(JsLang.astToCode(JsLang.astValue(_.reduce(sharedContext.newFunctorFiles, (result, functor)=>{
                    result["$" + functor.functionName] = JsLang.astId(functor.functionName);
                    return result;
                }, {}))), 4)
            };
            let classTemplate = path.resolve(__dirname, "database", this.connector.driver, "EntityModel.js.swig");
            let classCode = swig.renderFile(classTemplate, locals);
            let modelFilePath = path.resolve(this.outputPath, schema.name, "base", capitalized + ".js");
            fs.ensureFileSync(modelFilePath);
            fs.writeFileSync(modelFilePath, classCode);
            this.linker.log("info", "Generated entity model: " + modelFilePath);
        });
    }
    _generateEntityInputSchema(schema) {
        //generate validator config
        _.forOwn(schema.entities, (entity, entityInstanceName)=>{
            _.each(entity.inputs, (inputs, inputSetName)=>{
                const validationSchema = {};
                const dependencies = new Set();
                const ast = JsLang.astProgram();
                inputs.forEach((input)=>{
                    //:address
                    if (input.name.startsWith(":")) {
                        const assoc = input.name.substr(1);
                        const assocMeta = entity.associations[assoc];
                        if (!assocMeta) {
                            throw new Error(`Association "${assoc}" not found in entity [${entityInstanceName}].`);
                        }
                        if (!input.spec) {
                            throw new Error(`Input "spec" is required for entity reference. Input set: ${inputSetName}, entity: ${entityInstanceName}, local: ${assoc}, referencedEntity: ${assocMeta.entity}`);
                        }
                        const dep = `${assocMeta.entity}-${input.spec}`;
                        dependencies.add(dep);
                        if (assocMeta.list) {
                            validationSchema[input.name] = JsLang.astValue({
                                type: "array",
                                elementSchema: {
                                    type: "object",
                                    schema: JsLang.astCall(_.camelCase(dep), [])
                                },
                                ..._.pick(input, [
                                    "optional"
                                ])
                            });
                        } else {
                            validationSchema[input.name] = JsLang.astValue({
                                type: "object",
                                schema: JsLang.astCall(_.camelCase(dep), []),
                                ..._.pick(input, [
                                    "optional"
                                ])
                            });
                        }
                    } else {
                        const field = entity.fields[input.name];
                        if (!field) {
                            throw new Error(`Field "${input.name}" not found in entity [${entityInstanceName}].`);
                        }
                        validationSchema[input.name] = JsLang.astValue({
                            ..._.pick(field, [
                                "type",
                                "values"
                            ]),
                            ..._.pick(input, [
                                "optional"
                            ])
                        });
                    }
                });
                //console.dir(JsLang.astValue(validationSchema), {depth: 20});
                const exportBody = Array.from(dependencies).map((dep)=>JsLang.astRequire(_.camelCase(dep), `./${dep}`));
                JsLang.astPushInBody(ast, JsLang.astAssign(JsLang.astVarRef("module.exports"), JsLang.astAnonymousFunction([], exportBody.concat(JsLang.astReturn(validationSchema)))));
                let inputSchemaFilePath = path.resolve(this.outputPath, schema.name, "inputs", entityInstanceName + "-" + inputSetName + ".js");
                fs.ensureFileSync(inputSchemaFilePath);
                fs.writeFileSync(inputSchemaFilePath, JsLang.astToCode(ast));
                this.linker.log("info", "Generated entity input schema: " + inputSchemaFilePath);
            });
        });
    }
    _generateEntityManifest(schema) {
        /*
        let manifest = {};

        _.each(schema.entities, (entity, entityName) => {
            if (entity.info.restful) {
                _.each(entity.info.restful, ({ type, methods }, relativeUri) => {                    
                    let apiInfo = {
                        type,
                        methods: {}                                            
                    };

                    if (type === 'entity') {
                        apiInfo.entity = entityName;
                        apiInfo.displayName = entity.displayName;

                        if (entity.comment) {
                            apiInfo.description = entity.comment;
                        }
                    }

                    _.each(methods, (meta, methodName) => {

                        switch (methodName) {
                            case 'create':
                                apiInfo.methods['post:' + relativeUri] = meta;
                            break;

                            case 'findOne':
                            break;

                            case 'fineAll':
                            break;

                            case 'updateOne':
                            break;

                            case 'updateMany':
                            break;

                            case 'deleteOne':
                            break;

                            case 'deleteMany':
                            break;
                        }

                    });
                });
            }
        });
        */ /*
        let outputFilePath = path.resolve(this.manifestPath, schema.name + '.manifest.json');
        fs.ensureFileSync(outputFilePath);
        fs.writeFileSync(outputFilePath, JSON.stringify(entities, null, 4));

        this.linker.log('info', 'Generated schema manifest: ' + outputFilePath);
        */ const diagram = {};
        //generate validator config
        _.forOwn(schema.entities, (entity, entityInstanceName)=>{
            /*
            let validationSchema = {};

            _.forOwn(entity.fields, (field, fieldName) => {
                if (field.readOnly) return;

                let fieldSchema = {
                    type: field.type,
                };

                if (field.type === "enum") {
                    fieldSchema.values = field.values;
                }

                if (field.optional) {
                    fieldSchema.optional = true;
                }

                validationSchema[fieldName] = fieldSchema;
            });
            */ diagram[entityInstanceName] = entity.toJSON();
        /*
            let entityOutputFilePath = path.resolve(
                this.manifestPath,
                schema.name,
                "validation",
                entityInstanceName + ".manifest.json"
            );
            fs.ensureFileSync(entityOutputFilePath);
            fs.writeFileSync(entityOutputFilePath, JSON.stringify(validationSchema, null, 4));

            this.linker.log("info", "Generated entity manifest: " + entityOutputFilePath);
            */ });
        let diagramOutputFilePath = path.resolve(this.manifestPath, schema.name, "diagram.json");
        fs.ensureFileSync(diagramOutputFilePath);
        fs.writeFileSync(diagramOutputFilePath, JSON.stringify(diagram, null, 4));
        this.linker.log("info", "Generated schema manifest: " + diagramOutputFilePath);
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
                "oolType": "ObjectReference",
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

            if (!_.isEmpty(compileContext.mapOfFunctorToFile)) {
                _.forOwn(compileContext.mapOfFunctorToFile, (fileName, functionName) => {
                    JsLang.astPushInBody(ast, JsLang.astRequire(functionName, '.' + fileName));
                });
            }

            if (!_.isEmpty(compileContext.newFunctorFiles)) {
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
    */ _processFieldModifiers(entity, sharedContext) {
        let compileContext = GemlToAst.createCompileContext(entity.gemlModule.name, this.linker, sharedContext);
        compileContext.variables["raw"] = {
            source: "context",
            finalized: true
        };
        compileContext.variables["i18n"] = {
            source: "context",
            finalized: true
        };
        compileContext.variables["connector"] = {
            source: "context",
            finalized: true
        };
        compileContext.variables["latest"] = {
            source: "context"
        };
        const allFinished = GemlToAst.createTopoId(compileContext, "done.");
        //map of field name to dependencies
        let fieldReferences = {};
        _.forOwn(entity.fields, (field, fieldName)=>{
            let topoId = GemlToAst.compileField(fieldName, field, compileContext);
            GemlToAst.dependsOn(compileContext, topoId, allFinished);
            if (field.writeOnce || field.freezeAfterNonDefault) {
                pushIntoBucket(fieldReferences, fieldName, {
                    reference: fieldName,
                    writeProtect: true
                });
            }
        });
        let deps = compileContext.topoSort.sort();
        //this.linker.verbose('All dependencies:\n' + JSON.stringify(deps, null, 2));
        deps = deps.filter((dep)=>compileContext.mapOfTokenToMeta.has(dep));
        //this.linker.verbose('All necessary source code:\n' + JSON.stringify(deps, null, 2));
        let methodBodyValidateAndFill = [], lastFieldsGroup, methodBodyCache = [], lastBlock, lastAstType; //, hasValidator = false;
        const _mergeDoValidateAndFillCode = function(fieldName, references, astCache, requireTargetField) {
            let fields = [
                fieldName
            ].concat(references);
            let checker = fields.join(",");
            if (lastFieldsGroup && lastFieldsGroup.checker !== checker) {
                methodBodyValidateAndFill = methodBodyValidateAndFill.concat(Snippets._fieldRequirementCheck(lastFieldsGroup.fieldName, lastFieldsGroup.references, methodBodyCache, lastFieldsGroup.requireTargetField));
                methodBodyCache = [];
            }
            methodBodyCache = methodBodyCache.concat(astCache);
            lastFieldsGroup = {
                fieldName,
                references,
                requireTargetField,
                checker
            };
        };
        //console.dir(compileContext.astMap['mobile~isMobilePhone:arg[1]|>stringDasherize'], { depth: 8 });
        _.each(deps, (dep, i)=>{
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
                if (sourceMap.type === GemlToAst.AST_BLK_ACTIVATOR_CALL) {
                    sourceMap.references.forEach((ref)=>{
                        fieldReference.push({
                            reference: ref,
                            whenNull: true
                        });
                    });
                } else {
                    sourceMap.references.forEach((ref)=>{
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
            if (sourceMap.type === GemlToAst.AST_BLK_VALIDATOR_CALL) {
                //hasValidator = true;
                let astCache = Snippets._validateCheck(targetFieldName, astBlock);
                _mergeDoValidateAndFillCode(targetFieldName, sourceMap.references, astCache, true);
            } else if (sourceMap.type === GemlToAst.AST_BLK_PROCESSOR_CALL) {
                let astCache = JsLang.astAssign(JsLang.astVarRef(sourceMap.target, true), astBlock, `Processing "${targetFieldName}"`);
                _mergeDoValidateAndFillCode(targetFieldName, sourceMap.references, astCache, true);
            } else if (sourceMap.type === GemlToAst.AST_BLK_ACTIVATOR_CALL) {
                let astCache = Snippets._checkAndAssign(astBlock, JsLang.astVarRef(sourceMap.target, true), `Activating "${targetFieldName}"`);
                _mergeDoValidateAndFillCode(targetFieldName, sourceMap.references, astCache, false);
            } else {
                throw new Error("To be implemented.");
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
        */ if (!_.isEmpty(methodBodyCache)) {
            methodBodyValidateAndFill = methodBodyValidateAndFill.concat(Snippets._fieldRequirementCheck(lastFieldsGroup.fieldName, lastFieldsGroup.references, methodBodyCache, lastFieldsGroup.requireTargetField));
        }
        /*
        let ast = JsLang.astProgram(false);
        JsLang.astPushInBody(ast, JsLang.astClassDeclare('Abc', 'Model', [
            JsLang.astMemberMethod(asyncMethodNaming('prepareEntityData_'), [ 'context' ],
            Snippets._doValidateAndFillHeader.concat(methodBodyValidateAndFill).concat([ JsLang.astReturn(JsLang.astId('context')) ]),
            false, true, true
        )], 'comment'));
        */ return {
            ast: JsLang.astMemberMethod(asyncMethodNaming("applyModifiers"), [
                "context",
                "isUpdating"
            ], Snippets._applyModifiersHeader.concat(methodBodyValidateAndFill).concat([
                JsLang.astReturn(JsLang.astId("context"))
            ]), false, true, true, "Applying predefined modifiers to entity fields."),
            fieldReferences
        };
    }
    _generateFunctionTemplateFile(schema, { functionName, functorType, fileName, args }) {
        let filePath = path.resolve(this.outputPath, schema.name, fileName);
        if (fs.existsSync(filePath)) {
            //todo: analyse code, compare arguments
            this.linker.log("info", `${_.upperFirst(functorType)} "${fileName}" exists. File generating skipped.`);
            return;
        }
        let ast = JsLang.astProgram();
        JsLang.astPushInBody(ast, JsLang.astFunction(functionName, args, OOL_MODIFIER_RETURN[functorType](args)));
        JsLang.astPushInBody(ast, JsLang.astAssign("module.exports", JsLang.astVarRef(functionName)));
        fs.ensureFileSync(filePath);
        fs.writeFileSync(filePath, JsLang.astToCode(ast));
        this.linker.log("info", `Generated ${functorType} file: ${filePath}`);
    }
    _buildInterfaces(entity, modelMetaInit, sharedContext) {
        let ast = [];
        _.forOwn(entity.interfaces, (method, name)=>{
            this.linker.info("Building interface: " + name);
            let astBody = [
                JsLang.astVarDeclare("$meta", JsLang.astVarRef("this.meta.interfaces." + name), true, false, "Retrieving the meta data")
            ];
            let compileContext = GemlToAst.createCompileContext(entity.gemlModule.name, this.linker, sharedContext);
            let paramMeta;
            if (method.accept) {
                paramMeta = this._processParams(method.accept, compileContext);
            }
            //metadata
            modelMetaInit["interfaces"] || (modelMetaInit["interfaces"] = {});
            modelMetaInit["interfaces"][name] = {
                params: Object.values(paramMeta)
            };
            _.each(method.implementation, (operation, index)=>{
                //let lastTopoId =
                GemlToAst.compileDbOperation(index, operation, compileContext, compileContext.mainStartId);
            });
            if (method.return) {
                GemlToAst.compileExceptionalReturn(method.return, compileContext);
            }
            let deps = compileContext.topoSort.sort();
            //this.linker.verbose('All dependencies:\n' + JSON.stringify(deps, null, 2));
            deps = deps.filter((dep)=>compileContext.mapOfTokenToMeta.has(dep));
            //this.linker.verbose('All necessary source code:\n' + JSON.stringify(deps, null, 2));
            _.each(deps, (dep)=>{
                let sourceMap = compileContext.mapOfTokenToMeta.get(dep);
                let astBlock = compileContext.astMap[dep];
                //this.linker.verbose('Code point "' + dep + '":\n' + JSON.stringify(sourceMap, null, 2));
                let targetFieldName = sourceMap.target; //getFieldName(sourceMap.target);
                if (sourceMap.type === GemlToAst.AST_BLK_VALIDATOR_CALL) {
                    astBlock = Snippets._validateCheck(targetFieldName, astBlock);
                } else if (sourceMap.type === GemlToAst.AST_BLK_PROCESSOR_CALL) {
                    if (sourceMap.needDeclare) {
                        astBlock = JsLang.astVarDeclare(JsLang.astVarRef(sourceMap.target), astBlock, false, false, `Processing "${targetFieldName}"`);
                    } else {
                        astBlock = JsLang.astAssign(JsLang.astVarRef(sourceMap.target, true), astBlock, `Processing "${targetFieldName}"`);
                    }
                } else if (sourceMap.type === GemlToAst.AST_BLK_ACTIVATOR_CALL) {
                    if (sourceMap.needDeclare) {
                        astBlock = JsLang.astVarDeclare(JsLang.astVarRef(sourceMap.target), astBlock, false, false, `Processing "${targetFieldName}"`);
                    } else {
                        astBlock = JsLang.astAssign(JsLang.astVarRef(sourceMap.target, true), astBlock, `Activating "${targetFieldName}"`);
                    }
                }
                astBody = astBody.concat(_.castArray(astBlock));
            });
            ast.push(JsLang.astMemberMethod(asyncMethodNaming(name), Object.keys(paramMeta), astBody, false, true, true, text.replaceAll(_.kebabCase(name), "-", " ")));
        });
        return ast;
    }
    _processParams(acceptParams, compileContext) {
        let paramMeta = {};
        acceptParams.forEach((param, i)=>{
            GemlToAst.compileParam(i, param, compileContext);
            paramMeta[param.name] = param;
            compileContext.variables[param.name] = {
                source: "argument"
            };
        });
        return paramMeta;
    }
    /**
     * @param {object} context
     * @property {GemlLinker} context.linker - Geml linker
     * @property {object} context.modelPath - Generated model output path
     * @property {object} context.manifestPath - Entities manifest output path
     * @param {Connector} connector
     */ constructor(context, linker, connector){
        this.linker = linker;
        this.outputPath = context.modelPath;
        this.manifestPath = context.manifestPath;
        this.connector = connector;
    }
}
module.exports = DaoModeler;

//# sourceMappingURL=Dao.js.map