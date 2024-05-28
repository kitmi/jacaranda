"use strict";
const path = require('path');
const { _, naming } = require('@genx/july');
const { fs } = require('@genx/sys');
const { toGraphQLType } = require('./graphql/lang');
/**
 * GraphQL schemas modeler.
 * @class
 */ class GraphQLModeler {
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
    }*/ _generateEnumTypes(schema) {
        _.forOwn(schema.entities, (entity, entityInstanceName)=>{
            _.forOwn(entity.fields, (field, fieldName)=>{
                if (field.type === 'enum') {}
            });
        });
    }
    _generateGraphQLModel(schema) {
        const generated = new Set();
        const typeDefs = [];
        _.forOwn(schema.entities, (entity, entityInstanceName)=>{
            let capitalized = naming.pascalCase(entityInstanceName);
            let fields = _.map(entity.fields, (field, fieldName)=>{
                if (fieldName === entity.key) {
                    return `${fieldName}: ID!`;
                }
                const typeInfo = toGraphQLType(field);
                if (typeInfo.newType) {
                    if (!generated.has(typeInfo.newType)) {
                        generated.add(typeInfo.newType);
                        switch(typeInfo.typeName){
                            case 'scalar':
                                typeDefs.push(`scalar ${typeInfo.newType}`);
                                break;
                            case 'enum':
                                typeDefs.push(`enum ${typeInfo.newType} {
    ${typeInfo.values.map((v)=>_.snakeCase(v).toUpperCase()).join('\n    ')}
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
                _.each(entity.associations, (assoc, anchor)=>{
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
        let entities = Object.keys(schema.entities).sort().reduce((result, v)=>{
            result[v] = {};
            return result;
        }, {});
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
        */ let outputFilePath = path.resolve(this.manifestPath, schema.name + '.manifest.json');
        fs.ensureFileSync(outputFilePath);
        fs.writeFileSync(outputFilePath, JSON.stringify(entities, null, 4));
        this.linker.log('info', 'Generated schema manifest: ' + outputFilePath);
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
module.exports = GraphQLModeler;

//# sourceMappingURL=GraphQL.js.map