const path = require('path');
const { _, eachAsync_, pushIntoBucket } = require('@genx/july');
const { fs } = require('@genx/sys');
const GemlCodeGen = require('../../../lang/XemlCodeGen');
const GemlUtils = require('../../../lang/XemlUtils');

const defaultRules = {
    skip: ['_prisma_migrations'],
};

class MySQLReverseEngineering {
    constructor(context, logger, connector) {
        this.logger = logger;
        this.connector = connector;

        this.reverseRules = { ...defaultRules, ...this.connector.options.reverseRules };
        this.saveIntermediate = context.saveIntermediate ?? false;
    }

    async reverse_(outputDir) {
        this.logger.log(
            'info',
            `Pulling schema from ${this.connector.driver} database "${this.connector.database}" ...`
        );

        let tables = await this.connector.execute_('select * from information_schema.tables where table_schema = ?', [
            this.connector.database,
        ]);

        if (this.saveIntermediate) {
            fs.writeFileSync(
                path.join(outputDir, this.connector.database + '.meta.json'),
                JSON.stringify(tables, null, 2)
            );
        }

        let entities = [],
            mapOfEntities = {};

        let entitiesGemlPath = path.join(outputDir, 'entities');
        fs.ensureDirSync(entitiesGemlPath);

        const skipTables = new Set(this.reverseRules.skip ?? []);

        await eachAsync_(tables, async (table) => {
            if (skipTables.has(table.TABLE_NAME)) return;

            let entityName = this._entityNaming(table.TABLE_NAME);

            entities.push({ entity: entityName });

            mapOfEntities[entityName] = await this.extractTable_(entityName, table, entitiesGemlPath);
        });

        this._refineEntityRelationships(mapOfEntities);

        _.forOwn(mapOfEntities, ({ types, entityInfo }, entityName) => {
            let entity = {
                type: types,
                entity: {
                    [entityName]: entityInfo,
                },
            };

            let entityContent = GemlCodeGen.transform(entity);
            let entityFile = path.join(entitiesGemlPath, entityName + '.geml');

            if (this.saveIntermediate) {
                fs.writeFileSync(entityFile + '.json', JSON.stringify(entity, null, 2));
            }
            fs.writeFileSync(entityFile, entityContent);
            this.logger.log('info', `Generated entity definition file "${entityFile}".`);
        });

        let schemaName = this._schemaNaming(this.connector.database);

        let json = {
            namespace: ['entities/**'],
            schema: {
                [schemaName]: {
                    entities: entities,
                },
            },
        };

        let schemaContent = GemlCodeGen.transform(json);
        let schemaFile = path.join(outputDir, schemaName + '.geml');
        if (this.saveIntermediate) {
            fs.writeFileSync(schemaFile + '.json', JSON.stringify(json, null, 2));
        }
        fs.writeFileSync(schemaFile, schemaContent);
        this.logger.log('info', `Extracted schema entry file "${schemaFile}".`);
    }

    async extractTable_(entityName, table, targetGemlPath) {
        let columns = await this.connector.execute_(
            'select * from information_schema.columns where table_schema = ? and table_name = ?',
            [this.connector.database, table.TABLE_NAME]
        );

        if (this.saveIntermediate) {
            fs.writeFileSync(
                path.join(targetGemlPath, table.TABLE_NAME + '.meta.json'),
                JSON.stringify(columns, null, 2)
            );
        }

        let { features, fields, types } = this._processFields(table, columns);

        let indexInfo = await this.connector.execute_('SHOW INDEXES FROM ??', [table.TABLE_NAME]);

        if (this.saveIntermediate && !_.isEmpty(indexInfo)) {
            fs.writeFileSync(
                path.join(targetGemlPath, table.TABLE_NAME + '.index.json'),
                JSON.stringify(indexInfo, null, 2)
            );
        }

        let { pk, indexes, mapNameToIndex } = this._processIndexes(indexInfo);

        if (pk.length === 0) {
            throw new Error(`Table "${table.TABLE_NAME}" has no primary key.`);
        }

        let referencesInfo = await this.connector.execute_(
            'SELECT * FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE `REFERENCED_TABLE_SCHEMA` = ? AND `TABLE_NAME` = ? AND `REFERENCED_TABLE_NAME` IS NOT NULL',
            [this.connector.database, table.TABLE_NAME]
        );

        if (this.saveIntermediate && !_.isEmpty(referencesInfo)) {
            fs.writeFileSync(
                path.join(targetGemlPath, table.TABLE_NAME + '.ref.json'),
                JSON.stringify(referencesInfo, null, 2)
            );
        }

        let associations = await this._processReferences_(referencesInfo, mapNameToIndex, fields);

        let entityInfo = {
            comment: table.TABLE_COMMENT,
            features,
            fields,
            associations,
            key: pk.length > 1 ? pk : pk[0],
            indexes,
        };

        if (entityName !== table.TABLE_NAME) {
            entityInfo.code = table.TABLE_NAME;
        }

        return { types, entityInfo };
    }

    async _processReferences_(referencesInfo, mapNameToIndex, fields) {
        let associations = [];

        let l = referencesInfo.length;

        for (let i = 0; i < l; i++) {
            let ref = referencesInfo[i];

            let [refTableKey] = await this.connector.execute_("SHOW INDEXES FROM ?? WHERE `Key_name` = 'PRIMARY'", [
                ref.REFERENCED_TABLE_NAME,
            ]);

            if (refTableKey.Column_name.toLowerCase() !== ref.REFERENCED_COLUMN_NAME.toLowerCase()) {
                throw new Error(`Foreign key "${ref.COLUMN_NAME}" not reference to the primary key.`);
            }

            let unique = false;

            let fkInfo = mapNameToIndex[ref.CONSTRAINT_NAME];
            if (fkInfo) {
                if (fkInfo.length > 1) {
                    throw new Error(`Combination foreign key is not supported: "${ref.CONSTRAINT_NAME}"`);
                }

                unique = fkInfo[0].Non_unique === 0;
            }

            let fkColName = this._fieldNaming(ref.COLUMN_NAME);

            if (unique) {
                associations.push({
                    type: 'belongsTo',
                    srcField: fkColName,
                    destEntity: this._entityNaming(ref.REFERENCED_TABLE_NAME),
                });
            } else {
                associations.push({
                    type: 'hasMany',
                    srcField: fkColName,
                    destEntity: this._entityNaming(ref.REFERENCED_TABLE_NAME),
                });
            }

            delete fields[fkColName]; // = { type: '$association', code: fields[fkColName].code };
        }

        return associations;
    }

    _processIndexes(indexInfo) {
        let pk = [],
            indexes = [];

        let mapNameToIndex = {};

        indexInfo.forEach((i) => {
            pushIntoBucket(mapNameToIndex, i.Key_name, i);
        });

        _.forOwn(mapNameToIndex, (fields, name) => {
            if (name === 'PRIMARY') {
                pk.push(fields.map((f) => this._fieldNaming(f.Column_name)));
            } else {
                indexes.push({
                    name: name,
                    fields: fields.map((f) => this._fieldNaming(f.Column_name)),
                    unique: fields[0].Non_unique === 0,
                    nullable: fields[0].Null === 'YES',
                });
            }
        });

        return { pk, indexes, mapNameToIndex };
    }

    _processFields(table, columns) {
        let features = [],
            fields = {},
            types = {};

        columns.forEach((col) => {
            let fieldName = this._fieldNaming(col.COLUMN_NAME);
            if (col.EXTRA === 'auto_increment') {
                let featureInfo = {
                    name: 'autoId',
                    options: table.AUTO_INCREMENT
                        ? {
                              startFrom: table.AUTO_INCREMENT,
                          }
                        : {},
                };

                if (fieldName !== 'id') {
                    featureInfo.options.name = fieldName;
                }
                features.push(featureInfo);
                return;
            }

            if (col.COLUMN_DEFAULT === 'CURRENT_TIMESTAMP') {
                let featureInfo = {
                    name: 'createTimestamp',
                };
                features.push(featureInfo);
                return;
            }

            if (col.EXTRA === 'on update CURRENT_TIMESTAMP') {
                let featureInfo = {
                    name: 'updateTimestamp',
                };
                features.push(featureInfo);
                return;
            }

            if (fieldName === 'isDeleted' && col.COLUMN_TYPE === 'tinyint(1)') {
                let featureInfo = {
                    name: 'logicalDeletion',
                };
                features.push(featureInfo);
                return;
            }

            let fieldInfo = this._mysqlTypeToGemlType(table, col, fieldName, types);

            if (col.IS_NULLABLE === 'YES') {
                fieldInfo.optional = true;
            }

            if (col.COLUMN_DEFAULT) {
                fieldInfo.default = col.COLUMN_DEFAULT;
            }

            if (col.COLUMN_COMMENT) {
                fieldInfo.comment = col.COLUMN_COMMENT;
            }

            fields[fieldName] = fieldInfo;
        });

        return { features, fields, types };
    }

    _fieldNaming(name) {
        if (this.reverseRules.fieldNaming) {
            return this.reverseRules.fieldNamin(name);
        }

        return GemlUtils.fieldNaming(name);
    }

    _entityNaming(name) {
        if (this.reverseRules.entityNaming) {
            return this.reverseRules.entityNaming(name);
        }

        return GemlUtils.entityNaming(name);
    }

    _schemaNaming(name) {
        if (this.reverseRules.schemaNaming) {
            return this.reverseRules.schemaNaming(name);
        }

        return GemlUtils.schemaNaming(name);
    }

    _mysqlTypeToGemlType(table, col, fieldName, types) {
        let applicableRule = _.find(this.reverseRules.columnTypeConversion, (rule) => rule.test(table, col));
        if (applicableRule) {
            return applicableRule.apply(table, col);
        }

        let typeInfo = {};
        if (col.COLUMN_NAME !== fieldName) {
            typeInfo.code = col.COLUMN_NAME;
        }

        switch (col.DATA_TYPE) {
            case 'varchar':
                typeInfo.type = 'text';
                if (col.CHARACTER_MAXIMUM_LENGTH) {
                    typeInfo.maxLength = col.CHARACTER_MAXIMUM_LENGTH;
                }
                break;

            case 'char':
                typeInfo.type = 'text';
                if (col.CHARACTER_MAXIMUM_LENGTH) {
                    typeInfo.fixedLength = col.CHARACTER_MAXIMUM_LENGTH;
                }
                break;

            case 'blob':
                typeInfo.type = 'binary';
                if (col.CHARACTER_MAXIMUM_LENGTH) {
                    typeInfo.maxLength = col.CHARACTER_MAXIMUM_LENGTH;
                }
                break;

            case 'bigint':
                typeInfo.type = 'integer';
                typeInfo.digits = col.NUMERIC_PRECISION || 18;
                typeInfo.bytes = 8;
                if (_.endsWith(col.COLUMN_TYPE, ' unsigned')) typeInfo.unsigned = true;
                break;

            case 'int':
                typeInfo.type = 'integer';
                typeInfo.digits = col.NUMERIC_PRECISION || 10;
                typeInfo.bytes = 4;
                if (_.endsWith(col.COLUMN_TYPE, ' unsigned')) typeInfo.unsigned = true;
                break;

            case 'mediumint':
                typeInfo.type = 'integer';
                typeInfo.digits = col.NUMERIC_PRECISION || 7;
                typeInfo.bytes = 3;
                if (_.endsWith(col.COLUMN_TYPE, ' unsigned')) typeInfo.unsigned = true;
                break;

            case 'smallint':
                typeInfo.type = 'integer';
                typeInfo.digits = col.NUMERIC_PRECISION || 4;
                typeInfo.bytes = 2;
                if (_.endsWith(col.COLUMN_TYPE, ' unsigned')) typeInfo.unsigned = true;
                break;

            case 'tinyint':
                if (_.startsWith(col.COLUMN_TYPE, 'tinyint(1)')) {
                    typeInfo.type = 'boolean';
                } else {
                    typeInfo.type = 'integer';
                    typeInfo.digits = col.NUMERIC_PRECISION || 2;
                    typeInfo.bytes = 1;
                    if (_.endsWith(col.COLUMN_TYPE, ' unsigned')) typeInfo.unsigned = true;
                }
                break;

            case 'enum':
                let left = col.COLUMN_TYPE.indexOf('(');
                let right = col.COLUMN_TYPE.lastIndexOf(')');

                let typeName = table.TABLE_NAME + _.upperFirst(col.COLUMN_NAME);

                types[typeName] = {
                    type: 'enum',
                    values: col.COLUMN_TYPE.substring(left + 1, right)
                        .split(',')
                        .map((v) => v.substr(1, v.length - 2)),
                };

                typeInfo.type = typeName;

                break;

            case 'text':
                typeInfo.type = 'text';
                typeInfo.maxLength = col.CHARACTER_MAXIMUM_LENGTH;
                break;

            case 'datetime':
            case 'timestamp':
                typeInfo.type = 'datetime';
                break;

            case 'decimal':
                typeInfo.type = 'number';
                typeInfo.totalDigits = col.NUMERIC_PRECISION;
                typeInfo.decimalDigits = col.NUMERIC_SCALE;
                typeInfo.exact = true;
                break;

            case 'double':
                typeInfo.bytes = 8;
            case 'float':
                typeInfo.type = 'number';
                typeInfo.totalDigits = col.NUMERIC_PRECISION;
                typeInfo.decimalDigits = col.NUMERIC_SCALE;
                break;

            default:
                console.log(col);
                throw new Error('To be implemented.');
        }

        //_.find(this.reverseRules.columnTypeOptimization, rule => rule.test(table, col));

        return typeInfo;
    }

    _refineEntityRelationships(mapOfEntities) {
        let entityAssoc = {};

        //1st round
        _.forOwn(mapOfEntities, ({ entityInfo }, name) => {
            if (_.isEmpty(entityInfo.associations)) return;

            entityInfo.associations.forEach(({ type, srcField, destEntity }) => {
                let refedEntity = mapOfEntities[destEntity];
                let backRef = _.find(refedEntity.associations, (assoc) => assoc.destEntity === name);

                if (type === 'hasMany') {
                    if (!backRef) {
                        //one-side relation
                        pushIntoBucket(entityAssoc, name, { type: 'refersTo', srcField, destEntity });
                        return;
                    }

                    //todo:
                    console.log(entityInfo);
                    throw new Error(`Back reference: ${backRef.entity} ${backRef.type} ${name}`);
                } else if (type === 'belongsTo') {
                    pushIntoBucket(entityAssoc, name, { type, srcField, destEntity });

                    if (!backRef) {
                        //one-side relation
                        pushIntoBucket(entityAssoc, entity, { type: 'hasMany', destEntity: name });
                        return;
                    }
                } else {
                    throw new Error('Unexpected association type: ' + type);
                }
            });
        });

        //2nd round
        _.forOwn(entityAssoc, (associations, name) => {
            let { entityInfo } = mapOfEntities[name];

            let keyAssocs;

            if (Array.isArray(entityInfo.key) && entityInfo.key.length === 2) {
                keyAssocs = _.filter(associations, (assoc) => entityInfo.key.indexOf(assoc.srcField) !== -1);
                if (keyAssocs.length === 2) {
                    this._makeEntityManyToMany(keyAssocs[0].destEntity, keyAssocs[1].destEntity, entityAssoc);
                }
            }

            entityInfo.indexes.forEach(({ fields }) => {
                if (fields.length === 2) {
                    keyAssocs = _.filter(associations, (assoc) => fields.indexOf(assoc.srcField) !== -1);
                    if (keyAssocs.length === 2) {
                        this._makeEntityManyToMany(keyAssocs[0].destEntity, keyAssocs[1].destEntity, entityAssoc);
                    }
                }
            });
        });

        _.forOwn(mapOfEntities, ({ entityInfo }, name) => {
            entityInfo.associations = entityAssoc[name];
        });
    }

    _makeEntityManyToMany(entityName1, entityName2, entityAssoc) {
        pushIntoBucket(entityAssoc, entityName1, { type: 'hasMany', destEntity: entityName2 });
        pushIntoBucket(entityAssoc, entityName2, { type: 'hasMany', destEntity: entityName1 });
    }
}

module.exports = MySQLReverseEngineering;
