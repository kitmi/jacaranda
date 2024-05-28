"use strict";

const path = require('path');
const { _, naming }  = require('@genx/july');
const { fs } = require('@genx/sys');

const { toGraphQLType } = require('./graphql/lang');

/**
 * GraphQL schemas modeler.
 * @class
 */
class GraphQLModeler {
    /**     
     * @param {object} context   
     * @property {GemlLinker} context.linker - Geml linker
     * @property {object} context.modelPath - Generated model output path
     * @property {object} context.manifestPath - Entities manifest output path
     * @param {Connector} connector      
     */
    constructor(context, linker, connector) {       
        this.linker = linker;
        this.outputPath = context.modelPath;
        this.manifestPath = context.manifestPath;

        this.connector = connector;        
    }

    modeling_(schema) {
        this.linker.log('info', 'Generating graphql models for schema "' + schema.name + '"...');

        //this._generateSchemaModel(schema);        
        this._generateGraphQLModel(schema);
    }

    /*
    _generateSchemaModel(schema) {
        let capitalized = pascalCase(schema.name);

        let locals = {
            driver: this.connector.driver,
            className: capitalized,
            schemaName: schema.name,
            entities: JSON.stringify(Object.keys(schema.entities))
        };

        let classTemplate = path.resolve(__dirname, 'database', this.connector.driver, 'Database.js.swig');
        let classCode = swig.renderFile(classTemplate, locals);

        let modelFilePath = path.resolve(this.outputPath, capitalized + '.js');
        fs.ensureFileSync(modelFilePath);
        fs.writeFileSync(modelFilePath, classCode);

        this.linker.log('info', 'Generated database model: ' + modelFilePath);
    }*/

    _generateEnumTypes(schema) {
        _.forOwn(schema.entities, (entity, entityInstanceName) => {
            _.forOwn(entity.fields, (field, fieldName) => {
                if (field.type === 'enum') {

                }
            });
        });
    }

    _generateGraphQLModel(schema) {
        const generated = new Set();

        const typeDefs = [];

        _.forOwn(schema.entities, (entity, entityInstanceName) => {            
            let capitalized = naming.pascalCase(entityInstanceName);                  

            let fields = _.map(entity.fields, (field, fieldName) => {  
                if (fieldName === entity.key) {
                    return `${fieldName}: ID!`;
                }

                const typeInfo = toGraphQLType(field);    
                
                if (typeInfo.newType) {
                    if (!generated.has(typeInfo.newType)) {
                        generated.add(typeInfo.newType);

                        switch (typeInfo.typeName) {
                            case 'scalar':
                                typeDefs.push(`scalar ${typeInfo.newType}`);
                                break;

                            case 'enum':
                                typeDefs.push(`enum ${typeInfo.newType} {
    ${typeInfo.values.map(v => _.snakeCase(v).toUpperCase()).join('\n    ')}
}`);
                                break;

                            default:
                                throw new Error(`Unsupported graphql type: ${typeInfo.newType}`);
                        }
                    } 
                }
                
                return `${fieldName}: ${typeInfo.type}`;
            });

            if (_.isEmpty(!entity.associations)) {
                _.each(entity.associations, (assoc, anchor) => {
                    const typeName = naming.pascalCase(assoc.entity);

                    if (assoc.list) {
                        fields.push(`${anchor}_: [${typeName}!]`);
                    } else {
                        fields.push(`${anchor}_: ${typeName}`);
                    }
                });
            }

            let classCode = `type ${capitalized} {
    ${fields.join('\n    ')}
}`;                         

            typeDefs.push(classCode);            
        });

        let modelFilePath = path.resolve(this.manifestPath, 'graphql', schema.name + '.graphql');
        fs.ensureFileSync(modelFilePath);
        fs.writeFileSync(modelFilePath, typeDefs.join('\n\n'));

        this.linker.log('info', 'Generated graphql model: ' + modelFilePath);
    }

    _generateEntityManifest(schema) {
        let entities = Object.keys(schema.entities).sort().reduce((result, v) => { result[v] = {}; return result; }, {});
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
        */
        let outputFilePath = path.resolve(this.manifestPath, schema.name + '.manifest.json');
        fs.ensureFileSync(outputFilePath);
        fs.writeFileSync(outputFilePath, JSON.stringify(entities, null, 4));

        this.linker.log('info', 'Generated schema manifest: ' + outputFilePath);
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
    */
}

module.exports = GraphQLModeler;