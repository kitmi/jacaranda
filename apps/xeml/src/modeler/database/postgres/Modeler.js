const EventEmitter = require('node:events');
const path = require('node:path');

const { _, isPlainObject, isEmpty, pushIntoBucket, get, naming, bin2Hex, suffixForDuplicate } = require('@kitmi/utils');
const { fs } = require('@kitmi/sys');
const { hashFiles_ } = require('@kitmi/feat-cipher');

const XemlUtils = require('../../../lang/XemlUtils');
const XemlTypes = require('../../../lang/XemlTypes');
const { pluralize, isDotSeparateName, extractDotSeparateName, prefixNaming } = XemlUtils;
const Entity = require('../../../lang/Entity');
const Types = require('../../../lang/Types');

const UNSUPPORTED_DEFAULT_VALUE = new Set(['SERIAL', 'BIGSERIAL', 'VECTOR', 'TEXT', 'GEOMETRY']);
const MAX_NUMERIC_PRECISION = 1000;

const UNSIGNED_WARNING = 'Unsigned is not supported in postgres. You may use domain type to check integer range.';

/**
 * Xeml database modeler for postgres db.
 * @class
 */
class PostgresModeler {
    /**
     * @param {object} modelService
     * @param {Linker} linker - Xeml DSL linker
     * @param {Connector} connector - Connector for database
     * @param {object} dbOptions
     * @property {object} dbOptions.db
     * @property {object} dbOptions.table
     */
    constructor(modelService, linker, connector, dbOptions) {
        this.modelService = modelService;
        this.linker = linker;
        this.outputPath = modelService.config.migrationPath;
        this.connector = connector;

        this._events = new EventEmitter();

        this._dbOptions = dbOptions
            ? {
                  db: _.mapKeys(dbOptions.db, (value, key) => _.upperCase(key)),
                  table: _.mapKeys(dbOptions.table, (value, key) => _.upperCase(key)),
              }
            : {};

        this._references = {};
        this._relationEntities = {};
        this._processedRef = new Set();
        this._sequenceRestart = [];
        this._entitySequences = {};

        this.warnings = {};
    }

    async modeling_(schema, skipGeneration, duplicateEntities) {
        if (!skipGeneration) {
            this.linker.log('info', 'Generating postgres scripts for schema "' + schema.name + '"...');
        }

        let modelingSchema = schema.clone();

        this.linker.log('debug', 'Building relations...');

        let pendingEntities = Object.keys(modelingSchema.entities);

        while (pendingEntities.length > 0) {
            let entityName = pendingEntities.shift();
            let entity = modelingSchema.entities[entityName];

            if (!isEmpty(entity.info.associations)) {
                this.linker.log('debug', `Processing associations of entity "${entityName}"...`);

                let assocs = this._preProcessAssociations(entity);

                let assocNames = assocs.reduce((result, v) => {
                    result[v] = v;
                    return result;
                }, {});

                entity.info.associations.forEach((assoc) =>
                    this._processAssociation(modelingSchema, entity, assoc, assocNames, pendingEntities)
                );
            }
        }

        this._events.emit('afterRelationshipBuilding');

        // build SQL scripts
        // change from database name to schema name
        // let sqlFilesDir = path.join("postgres", this.connector.database);
        let sqlFilesDir = path.join('postgres', schema.name);
        let dbFilePath = path.join(sqlFilesDir, 'entities.sql');
        let fkFilePath = path.join(sqlFilesDir, 'relations.sql');
        let seqFilePath = path.join(sqlFilesDir, 'sequence.sql');

        let tableSQL = '',
            relationSQL = '',
            data = {};

        //let mapOfEntityNameToCodeName = {};
        const extraFunctions = [];
        const triggers = [];

        _.each(modelingSchema.entities, (entity, entityName) => {
            if (duplicateEntities && duplicateEntities.has(entityName)) return;

            const entitySQL = this._generateEntityScripts(
                modelingSchema,
                entity,
                entityName,
                data,
                extraFunctions,
                triggers,
                skipGeneration
            );
            tableSQL += entitySQL;
        });

        if (!skipGeneration) {
            if (!isEmpty(this._sequenceRestart)) {
                let seqSQL = this._sequenceRestart.join('\n\n');
                this._writeFile(path.join(this.outputPath, seqFilePath), seqSQL);
            }

            _.forOwn(this._references, (refs, srcEntityName) => {
                _.each(refs, (ref) => {
                    relationSQL +=
                        this._addForeignKeyStatement(
                            srcEntityName,
                            ref
                            /*, mapOfEntityNameToCodeName*/
                        ) + '\n\n';
                });
            });

            this._writeFile(path.join(this.outputPath, dbFilePath), tableSQL);
            this._writeFile(path.join(this.outputPath, fkFilePath), relationSQL);

            this._generateDataFiles(data, sqlFilesDir);

            let funcSQL = '-- ON UPDATE SET CURRENT_TIMESTAMP\n\n'; //'CREATE LANGUAGE plpgsql; \n\n';

            // update timestamp
            funcSQL += `CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN    
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;\n\n`;

            if (!isEmpty(extraFunctions)) {
                funcSQL += extraFunctions.join('\n\n') + '\n\n';
            }

            //process view
            /*
            _.each(modelingSchema.views, (view, viewName) => {
                view.inferTypeInfo(modelingSchema);

                funcSQL += `CREATE PROCEDURE ${dbService.getViewSPName(viewName)}(`;
                
                if (!isEmpty(view.params)) {
                    let paramSQLs = [];
                    view.params.forEach(param => {
                        paramSQLs.push(`p${_.upperFirst(param.name)} ${MySQLModeler.columnDefinition(param, true)}`);
                    });

                    funcSQL += paramSQLs.join(', ');
                }

                funcSQL += `)\nCOMMENT 'SP for view ${viewName}'\nREADS SQL DATA\nBEGIN\n`;

                funcSQL += this._viewDocumentToSQL(modelingSchema, view) + ';';

                funcSQL += '\nEND;\n\n';
            });
            */

            let spFilePath = path.join(sqlFilesDir, 'procedures.sql');
            this._writeFile(path.join(this.outputPath, spFilePath), funcSQL);

            if (!isEmpty(triggers)) {
                let triggerSQL = triggers.join('\n\n');
                let triggerFilePath = path.join(sqlFilesDir, 'triggers.sql');
                this._writeFile(path.join(this.outputPath, triggerFilePath), triggerSQL);
            }
        }

        // calc hash
        const sqlFiles = ['entities.sql', 'sequence.sql', 'relations.sql', 'procedures.sql', 'triggers.sql'];
        const dbhash = await hashFiles_('sha256', sqlFilesDir, sqlFiles);

        this._events.once('metadata', (codeVersionInfo) => {
            // write metadata
            const initFileName = `0-${XemlTypes.MetadataEntity}.json`;
            const initDataDir = path.join(codeVersionInfo.migrationDir, 'data', '_init');
            let initFilePath = path.join(initDataDir, initFileName);
            let idxFilePath = path.join(this.outputPath, initDataDir, 'index.list');

            const metadata = {
                name: schema.name,
                dbHash: dbhash,
                codeVersion: codeVersionInfo.version,
                codeHash: codeVersionInfo.digest,
                schema: JSON.stringify(codeVersionInfo.schema),
            };

            if (codeVersionInfo.update) {
                metadata.$update = true;
            }

            this._writeFile(
                path.join(this.outputPath, initFilePath),
                JSON.stringify(
                    {
                        [XemlTypes.MetadataEntity]: metadata,
                    },
                    null,
                    4
                )
            );

            // append to index
            const indexFile = fs.existsSync(idxFilePath) ? fs.readFileSync(idxFilePath, 'utf8') : '';
            if (!indexFile.split('\n').includes(initFileName)) {
                this._writeFile(idxFilePath, `${initFileName}\n${indexFile}`);
            }
        });

        modelingSchema.relations = this._references;

        return modelingSchema;
    }

    writeMetadata(codeVersionInfo, schema, migrationDir, update) {
        this._events.emit('metadata', { ...codeVersionInfo, schema, migrationDir, update });
    }

    _generateDataFiles(data, sqlFilesDir) {
        let initIdxFiles = {};

        if (!isEmpty(data)) {
            _.forOwn(data, (envData, dataSet) => {
                _.forOwn(envData, (entitiesData, runtimeEnv) => {
                    _.forOwn(entitiesData, (records, entityName) => {
                        let initFileName = `0-${entityName}.json`;

                        let pathNodes = [sqlFilesDir, 'data', dataSet || '_init'];

                        if (runtimeEnv !== 'default') {
                            pathNodes.push(runtimeEnv);
                        }

                        let initFilePath = path.join(...pathNodes, initFileName);
                        let idxFilePath = path.join(...pathNodes, 'index.list');

                        pushIntoBucket(initIdxFiles, [idxFilePath], initFileName);

                        this._writeFile(
                            path.join(this.outputPath, initFilePath),
                            JSON.stringify({ [entityName]: records }, null, 4)
                        );
                    });
                });
            });
        }

        //console.dir(initIdxFiles, {depth: 10});
        _.forOwn(initIdxFiles, (list, filePath) => {
            let idxFilePath = path.join(this.outputPath, filePath);

            let manual = [];

            if (fs.existsSync(idxFilePath)) {
                let lines = fs.readFileSync(idxFilePath, 'utf8').split('\n');
                lines.forEach((line) => {
                    if (!line.startsWith('0-')) {
                        manual.push(line);
                    }
                });
            }

            this._writeFile(idxFilePath, list.concat(manual).join('\n'));
        });
    }

    async getCurrentSchema_(db, schemaName) {
        const Metadata = db.entity(XemlTypes.MetadataEntity);
        const metadata = await Metadata.findOne_({
            $where: { name: schemaName },
        });

        metadata.schema = JSON.parse(metadata.schema);

        // Get tables and columns
        /*
        const tablesAndColumns = await this.db.connector.execute_(`
          SELECT table_name, column_name, data_type
          FROM information_schema.columns
          WHERE table_schema = '${this.db.connector.collection}'
          ORDER BY table_name, ordinal_position
        `);

        // Get indexes
        const indexes = await this.db.connector.execute_(`
          SELECT indexname, tablename, indexdef
          FROM pg_indexes
          WHERE schemaname = 'public'
        `);

        // Get comments
        const comments = await this.db.connector.execute_(`
          SELECT c.table_name, c.column_name, pgd.description
          FROM pg_catalog.pg_statio_all_tables AS st
          INNER JOIN pg_catalog.pg_description pgd ON (pgd.objoid = st.relid)
          INNER JOIN information_schema.columns c ON (
            pgd.objsubid = c.ordinal_position AND
            c.table_schema = st.schemaname AND
            c.table_name = st.relname
          )
          WHERE st.schemaname = '${this.db.connector.collection}'
        `);

        // Get functions
        const functions = await this.db.connector.execute_(`
          SELECT proname, prosrc
          FROM pg_proc
          INNER JOIN pg_namespace ON pg_namespace.oid = pg_proc.pronamespace
          WHERE nspname = '${this.db.connector.collection}'
        `);

        const triggers = await this.db.connector.execute_(`
            SELECT 
              tgname AS trigger_name,
              relname AS table_name,
              pg_get_triggerdef(pg_trigger.oid) AS trigger_definition
            FROM pg_trigger
            JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid
            WHERE tgisinternal = false AND relnamespace = '${this.db.connector.collection}'::regnamespace
          `);
          */

        return metadata;
    }

    async buildMigration_(db, schemaName, verContent, targetSchema) {
        this.warnings = {};

        const { codeVersion: currentVersion, schema: currentSchema } = await this.getCurrentSchema_(db, schemaName);

        if (currentVersion >= verContent.version) {
            return false;
        }

        const sqlFilesDir = path.join('postgres', currentSchema.name, `v${currentVersion}-v${verContent.version}`);

        let migrationScript = '';

        // Find tables to create
        const currentTables = new Set(Object.keys(currentSchema.entities));
        const targetTableArray = Object.keys(targetSchema.entities);

        const tablesToCreate = targetTableArray.filter((table) => !currentTables.has(table));

        let data = {};

        const functions = [];
        const triggers = [];
        const sequences = [];

        // create table
        tablesToCreate.forEach((entityName) => {
            const entity = targetSchema.entities[entityName];
            migrationScript +=
                this._generateEntityScripts(targetSchema, entity, entityName, data, functions, triggers) + '\n';
            if (this._entitySequences[entityName] != null) {
                sequences.push(this._sequenceRestart[this._entitySequences[entityName]]);
            }
        });

        // todo: alter table contraints

        // add enum types
        _.each(targetSchema.types, (field, enumName) => {
            const currentEnum = currentSchema.types[enumName];

            if (currentEnum == null) {
                migrationScript += this._addEnumType(enumName, field);
            } else {
                if (!_.isEqual(currentEnum.enum, field.enum)) {
                    // todo: add customized rules for renaming

                    // otherwises, compare one by one and ALTER TYPE name ADD VALUE [ IF NOT EXISTS ] new_enum_value [ { BEFORE | AFTER } neighbor_enum_value ]
                    field.enum.forEach((v) => {
                        if (!currentEnum.enum.includes(v)) {
                            migrationScript += `ALTER TYPE ${enumName} ADD VALUE '${v}';\n`;
                        }
                    });
                }
            }
        });

        // alter column
        _.each(currentSchema.entities, (currentEntity, entityName) => {
            const targetEntity = targetSchema.entities[entityName];

            if (targetEntity) {
                if (targetEntity.baseClasses) {
                    this._generateBuiltinFunctions(targetEntity, entityName, functions);
                }

                if (targetEntity.features) {
                    _.each(targetEntity.features, (f, featureName) => {
                        this._generateFeatureFunctions(featureName, entityName, f, functions, triggers);
                    });
                }

                migrationScript += this._alterTableStatement(entityName, targetEntity, currentEntity);
            }
        });

        if (sequences.length > 0) {
            migrationScript += sequences.join('\n\n') + '\n\n';
        }

        _.forOwn(this._references, (refs, srcEntityName) => {
            const currentRelations = currentSchema.relations?.[srcEntityName];

            if (currentRelations) {
                _.each(refs, (ref) => {
                    const foundRelation = currentRelations.find((r) => r.leftField === ref.leftField);
                    if (foundRelation) {
                        if (
                            foundRelation.rightField !== ref.rightField ||
                            foundRelation.right !== ref.right ||
                            !_.isEqual(foundRelation.constraints, ref.constraints)
                        ) {
                            migrationScript +=
                                this._dropForeignKeyStatement(srcEntityName, ref) +
                                '\n' +
                                this._addForeignKeyStatement(srcEntityName, ref) +
                                '\n\n';
                        }
                    } else {
                        migrationScript += this._addForeignKeyStatement(srcEntityName, ref) + '\n';
                    }
                });
            } else {
                _.each(refs, (ref) => {
                    migrationScript += this._addForeignKeyStatement(srcEntityName, ref) + '\n';
                });
            }
        });

        this._generateDataFiles(data, sqlFilesDir);

        if (functions.length > 0) {
            migrationScript += functions.join('\n\n') + '\n\n';
        }

        if (triggers.length > 0) {
            migrationScript += triggers.join('\n\n') + '\n\n';
        }

        const filePath = path.join(sqlFilesDir, 'up.sql');
        this._writeFile(path.join(this.outputPath, filePath), migrationScript);

        return sqlFilesDir;
    }

    _generateFunctionMigrations(currentFunctions, targetFunctions) {
        let script = '';
        targetFunctions.forEach((func) => {
            const params = func.parameters.map((p) => `${p.name} ${p.type}`).join(', ');
            script += `CREATE OR REPLACE FUNCTION ${func.functionName}(${params}) RETURNS ${func.returnType} AS $$\n`;
            script += func.body;
            script += `\n$$ LANGUAGE plpgsql;\n\n`;
        });
        return script;
    }

    _generateTriggerMigrations(currentTriggers, targetTriggers) {
        let script = '';

        // Drop removed triggers
        currentTriggers.forEach((trigger) => {
            if (!targetTriggers.some((tt) => tt.triggerName === trigger.trigger_name)) {
                script += `DROP TRIGGER IF EXISTS ${trigger.trigger_name} ON ${trigger.table_name};\n`;
            }
        });

        // Create new triggers or replace existing ones
        targetTriggers.forEach((trigger) => {
            script += `CREATE OR REPLACE TRIGGER ${trigger.triggerName}\n`;
            script += `${trigger.timing} ${trigger.events.join(' OR ')}\n`;
            script += `ON ${trigger.tableName}\n`;
            if (trigger.forEachRow) {
                script += `FOR EACH ROW\n`;
            }
            if (trigger.whenCondition) {
                script += `WHEN (${trigger.whenCondition})\n`;
            }
            script += `EXECUTE FUNCTION ${trigger.functionName}();\n\n`;
        });

        return script;
    }

    _generateEntityScripts(modelingSchema, entity, entityName, data, functions, triggers, skipGeneration) {
        let tableSQL = '';

        if (entityName !== entity.name) {
            throw new Error(
                `Entity name "${entity.name}" does not match the entity name "${entityName}" in the schema.`
            );
        }
        //mapOfEntityNameToCodeName[entityName] = entity.code;

        entity.addIndexes();

        let result = this.complianceCheck(entity);
        if (result.errors.length) {
            let message = '';
            if (result.warnings.length > 0) {
                message += 'Warnings: \n' + result.warnings.join('\n') + '\n';
            }
            message += result.errors.join('\n');

            throw new Error(message);
        }

        if (entity.baseClasses) {
            this._generateBuiltinFunctions(entity, entityName, functions);
        }

        if (entity.features) {
            _.forOwn(entity.features, (f, featureName) => {
                if (Array.isArray(f)) {
                    f.forEach((ff) => this._featureReducer(modelingSchema, entity, featureName, ff));
                } else {
                    this._featureReducer(modelingSchema, entity, featureName, f);
                }

                this._generateFeatureFunctions(featureName, entityName, f, functions, triggers);
            });
        }

        // add enum types
        if (!skipGeneration) {
            _.each(entity.fields, (field, name) => {
                if (field.enum) {
                    let enumName = prefixNaming(entity.name, name);

                    if (modelingSchema.types[enumName]) {
                        this.warnings[
                            enumName
                        ] = `Enum type "${enumName}" already exists. The one in entity "${entity.name}" will be renamed.`;

                        enumName = suffixForDuplicate(enumName, (newName) => newName in modelingSchema.types);
                    }

                    modelingSchema.types[enumName] = _.omit(field, ['name']);
                    field.domain = enumName;

                    tableSQL += this._addEnumType(enumName, field);
                }
            });
        }

        tableSQL += this._createTableStatement(entityName, entity /*, mapOfEntityNameToCodeName*/) + '\n';

        if (entity.info.data) {
            entity.info.data.forEach(({ dataSet, runtimeEnv, records }) => {
                //intiSQL += `-- Initial data for entity: ${entityName}\n`;

                let entityData = [];

                if (Array.isArray(records)) {
                    records.forEach((record) => {
                        if (!isPlainObject(record)) {
                            let fields = Object.keys(entity.fields);
                            if (fields.length !== 2) {
                                throw new Error(`Invalid data syntax: entity "${entity.name}" has more than 2 fields.`);
                            }

                            let keyField = entity.fields[fields[0]];

                            if (!keyField.auto && !keyField.autoByDb) {
                                throw new Error(
                                    `The key field "${entity.name}" has no default value or auto-generated value.`
                                );
                            }

                            record = { [fields[1]]: this.linker.translateXemlValue(entity.xemlModule, record) };
                        } else {
                            record = this.linker.translateXemlValue(entity.xemlModule, record);
                        }

                        entityData.push(record);
                    });
                } else {
                    _.forOwn(records, (record, key) => {
                        if (!isPlainObject(record)) {
                            let fields = Object.keys(entity.fields);
                            if (fields.length !== 2) {
                                throw new Error(`Invalid data syntax: entity "${entity.name}" has more than 2 fields.`);
                            }

                            record = {
                                [entity.key]: key,
                                [fields[1]]: this.linker.translateXemlValue(entity.xemlModule, record),
                            };
                        } else {
                            record = Object.assign(
                                { [entity.key]: key },
                                this.linker.translateXemlValue(entity.xemlModule, record)
                            );
                        }

                        entityData.push(record);
                        //intiSQL += 'INSERT INTO `' + entityName + '` SET ' + _.map(record, (v,k) => '`' + k + '` = ' + JSON.stringify(v)).join(', ') + ';\n';
                    });
                }

                if (!isEmpty(entityData)) {
                    dataSet || (dataSet = '_init');
                    runtimeEnv || (runtimeEnv = 'default');

                    let nodes = [dataSet, runtimeEnv];

                    nodes.push(entityName);

                    let key = nodes.join('.');

                    pushIntoBucket(data, key, entityData, true);
                }
            });

            //intiSQL += '\n';
        }

        return tableSQL;
    }

    _addEnumType(enumName, field) {
        return `-- Create Enum Type\nCREATE TYPE ${enumName} AS ENUM (${field.enum
            .map((v) => `'${v}'`)
            .join(', ')});\n\n`;
    }

    _generateFeatureFunctions(featureName, entityName, feature, functions, triggers) {
        if (featureName === 'updateTimestamp') {
            const entitiAsPrefix = naming.snakeCase(entityName);
            let tsField = feature.field;
            let callFunction = `update_timestamp`;
            if (tsField !== 'updatedAt') {
                // non-default field name
                callFunction = `${entitiAsPrefix}_update_ts`;
                functions.push(`CREATE OR REPLACE FUNCTION ${entitiAsPrefix}_update_ts()
RETURNS TRIGGER AS $$
BEGIN    
    NEW.${this.connector.escapeId(tsField)} = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;\n`);
            }

            triggers.push(`CREATE OR REPLACE TRIGGER ${entitiAsPrefix}_set_update_ts
BEFORE UPDATE ON ${this.connector.escapeId(entityName)}
FOR EACH ROW
EXECUTE FUNCTION ${callFunction}();\n`);
        }
    }

    _generateBuiltinFunctions(entity, entityName, functions) {
        if (entity.baseClasses.includes('_messageQueue')) {
            const snakeName = naming.snakeCase(entityName);
            functions.push(`CREATE OR REPLACE FUNCTION get_task_from_${snakeName}(task_name TEXT)
RETURNS SETOF "${entityName}" AS $$
DECLARE
_task "${entityName}"%ROWTYPE;
BEGIN    
    WITH task AS (
        SELECT *
        FROM "${entityName}"
        WHERE status = 'pending' 
            AND (task_name IS NULL OR name = task_name)
        FOR UPDATE SKIP LOCKED
        LIMIT 1
    )
    UPDATE "${entityName}"
    SET status = 'running'
    WHERE id = (SELECT id FROM task)
    RETURNING *
    INTO _task;

    IF _task.id IS NOT NULL THEN
        RETURN NEXT _task;
    ELSE
        RETURN;
    END IF;
    EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error processing task: %', SQLERRM;
        RETURN;    
END;
$$ LANGUAGE plpgsql;\n`);
        }
    }

    _toColumnReference(name) {
        return { $xr: 'Column', name };
    }

    _translateJoinCondition(context, localField, anchor, remoteField) {
        if (Array.isArray(remoteField)) {
            return remoteField.map((rf) => this._translateJoinCondition(context, localField, anchor, rf));
        }

        if (isPlainObject(remoteField)) {
            let ret = { [localField]: this._toColumnReference(anchor + '.' + remoteField.by) };
            let withExtra = this._xemlConditionToQueryCondition(context, remoteField.with);

            if (localField in withExtra) {
                return { $and: [ret, withExtra] };
            }

            return { ...ret, ...withExtra };
        }

        return { [localField]: this._toColumnReference(anchor + '.' + remoteField) };
    }

    _getAllRelatedFields(remoteField) {
        if (!remoteField) return undefined;

        if (Array.isArray(remoteField)) {
            return remoteField.map((rf) => this._getAllRelatedFields(rf));
        }

        if (isPlainObject(remoteField)) {
            return remoteField.by;
        }

        return remoteField;
    }

    _preProcessAssociations(entity) {
        return entity.info.associations.map((assoc) => {
            if (assoc.srcField) return assoc.srcField;

            if (assoc.type === 'hasMany') {
                return pluralize(assoc.destEntity);
            }

            return assoc.destEntity;
        });
    }

    /**
     * hasMany/hasOne - belongsTo
     * hasMany/hasOne - hasMany/hasOne [by] [with]
     * hasMany - semi connection
     * refersTo - semi connection
     *
     * remoteField:
     *   1. fieldName
     *   2. array of fieldName
     *   3. { by , with }
     *   4. array of fieldName and { by , with } mixed
     *
     * @param {*} schema
     * @param {*} entity
     * @param {*} assoc
     */
    _processAssociation(schema, entity, assoc, assocNames, pendingEntities) {
        let entityKeyField = entity.getKeyField();
        if (Array.isArray(entityKeyField)) {
            throw new Error(`Entity "${entity.name}" with combination primary key is not supported.`);
        }

        this.linker.log('debug', `Processing "${entity.name}" ${JSON.stringify(assoc)}`);

        let destEntityName = assoc.destEntity,
            destEntity,
            destEntityNameAsFieldName;

        if (isDotSeparateName(destEntityName)) {
            //cross db reference
            let [destSchemaName, actualDestEntityName] = extractDotSeparateName(destEntityName);

            let destSchema = schema.linker.schemas[destSchemaName];
            if (!destSchema.linked) {
                throw new Error(
                    `The destination schema ${destSchemaName} has not been linked yet. Currently only support one-way reference for cross db relation.`
                );
            }

            destEntity = destSchema.entities[actualDestEntityName];
            destEntityNameAsFieldName = actualDestEntityName;
        } else {
            destEntity = schema.ensureGetEntity(entity.xemlModule, destEntityName, pendingEntities);
            if (!destEntity) {
                throw new Error(`Entity "${entity.name}" references to an unexisting entity "${destEntityName}".`);
            }

            destEntityNameAsFieldName = destEntityName;
        }

        if (!destEntity) {
            throw new Error(`Entity "${entity.name}" references to an unexisting entity "${destEntityName}".`);
        }

        if (destEntity.info.abstract) {
            // ignore abstract entity
            return;
        }

        let destKeyField = destEntity.getKeyField();
        if (!destKeyField) {
            throw new Error(
                `Empty key field "${destEntity.keyField}". Dest entity: ${destEntityName}, current entity: ${entity.name}`
            );
        }

        if (Array.isArray(destKeyField)) {
            throw new Error(`Destination entity "${destEntityName}" with combination primary key is not supported.`);
        }

        switch (assoc.type) {
            case 'hasOne':
            case 'hasMany':
                let includes;
                let excludes = {
                    types: ['refersTo'],
                    association: assoc,
                };

                if (assoc.by) {
                    excludes.types.push('belongsTo');
                    includes = {
                        by: (cb) => cb && cb.split('.')[0] === assoc.by.split('.')[0],
                    };

                    if (assoc.with) {
                        includes.with = assoc.with;
                    }
                } else {
                    let remoteFields = this._getAllRelatedFields(assoc.remoteField);

                    includes = {
                        srcField: (remoteField) => {
                            remoteField || (remoteField = entity.name);

                            return (
                                _.isNil(remoteFields) ||
                                (Array.isArray(remoteFields)
                                    ? remoteFields.indexOf(remoteField) > -1
                                    : remoteFields === remoteField)
                            );
                        },
                    };
                }

                let backRef = destEntity.getReferenceTo(entity.name, includes, excludes);
                if (backRef) {
                    if (backRef.type === 'hasMany' || backRef.type === 'hasOne') {
                        if (!assoc.by) {
                            throw new Error(
                                '"m2n" association requires "by" property. Entity: ' +
                                    entity.name +
                                    ' destination: ' +
                                    destEntityName
                            );
                        }

                        // one/many to one/many relation

                        let connectedByParts = assoc.by.split('.');
                        if (connectedByParts.length > 2) {
                            throw new Error('Invalid "connectedBy" value in association. Entity: ' + entity.name);
                        }

                        // connected by field is usually a refersTo assoc
                        let connectedByField = (connectedByParts.length > 1 && connectedByParts[1]) || entity.name;
                        let connEntityName = XemlUtils.entityNaming(connectedByParts[0]);

                        if (!connEntityName) {
                            throw new Error('Invalid "connectedBy" entity in association. Entity: ' + entity.name);
                        }

                        let tag1 = `${entity.name}:${assoc.type === 'hasMany' ? 'm' : '1'}-${destEntityName}:${
                            backRef.type === 'hasMany' ? 'n' : '1'
                        } by ${connEntityName}`;
                        let tag2 = `${destEntityName}:${backRef.type === 'hasMany' ? 'm' : '1'}-${entity.name}:${
                            assoc.type === 'hasMany' ? 'n' : '1'
                        } by ${connEntityName}`;

                        if (assoc.srcField) {
                            tag1 += ' ' + assoc.srcField;
                        }

                        if (backRef.srcField) {
                            tag2 += ' ' + backRef.srcField;
                        }

                        if (this._processedRef.has(tag1) || this._processedRef.has(tag2)) {
                            //already processed, skip
                            return;
                        }

                        let connectedByParts2 = backRef.by.split('.');
                        let connectedByField2 =
                            (connectedByParts2.length > 1 && connectedByParts2[1]) || destEntityNameAsFieldName;

                        if (connectedByField === connectedByField2) {
                            throw new Error('Cannot use the same "by" field in a relation entity.');
                        }

                        let connEntity = schema.ensureGetEntity(entity.xemlModule, connEntityName, pendingEntities);
                        if (!connEntity) {
                            //create a
                            connEntity = this._addRelationEntity(
                                schema,
                                connEntityName,
                                entity.name,
                                destEntityName,
                                connectedByField,
                                connectedByField2
                            );
                            pendingEntities.push(connEntity.name);
                            this.linker.log('debug', `New entity "${connEntity.name}" added by association.`);
                        }

                        this._updateRelationEntity(
                            connEntity,
                            entity,
                            destEntity,
                            entity.name,
                            destEntityName,
                            connectedByField,
                            connectedByField2
                        );

                        let localFieldName = assoc.srcField || pluralize(destEntityNameAsFieldName);

                        entity.addAssociation(localFieldName, {
                            entity: connEntityName,
                            key: connEntity.key,
                            on: this._translateJoinCondition(
                                { ...assocNames, [connEntityName]: localFieldName },
                                entity.key,
                                localFieldName,
                                assoc.with
                                    ? {
                                          by: connectedByField,
                                          with: assoc.with,
                                      }
                                    : connectedByField
                            ),
                            field: connectedByField,
                            ...(assoc.type === 'hasMany' ? { list: true } : {}),
                            assoc: connectedByField2,
                        });

                        let remoteFieldName = backRef.srcField || pluralize(entity.name);

                        destEntity.addAssociation(remoteFieldName, {
                            entity: connEntityName,
                            key: connEntity.key,
                            on: this._translateJoinCondition(
                                { ...assocNames, [connEntityName]: remoteFieldName },
                                destEntity.key,
                                remoteFieldName,
                                backRef.with
                                    ? {
                                          by: connectedByField2,
                                          with: backRef.with,
                                      }
                                    : connectedByField2
                            ),
                            field: connectedByField2,
                            ...(backRef.type === 'hasMany' ? { list: true } : {}),
                            assoc: connectedByField,
                        });

                        this._processedRef.add(tag1);
                        this.linker.log('verbose', `Processed 2-way reference: ${tag1}`);

                        this._processedRef.add(tag2);
                        this.linker.log('verbose', `Processed 2-way reference: ${tag2}`);
                    } else if (backRef.type === 'belongsTo') {
                        if (assoc.by) {
                            throw new Error('todo: belongsTo by. entity: ' + entity.name);
                        } else {
                            //leave it to the referenced entity
                            let anchor =
                                assoc.srcField ||
                                (assoc.type === 'hasMany'
                                    ? pluralize(destEntityNameAsFieldName)
                                    : destEntityNameAsFieldName);
                            let remoteField = assoc.remoteField || backRef.srcField || entity.name;

                            //check if the target entity has logical deletion feature
                            if (destEntity.hasFeature('logicalDeletion')) {
                                let deletionCheck = {
                                    $xt: 'BinaryExpression',
                                    operator: '!=',
                                    left: {
                                        $xt: 'ObjectReference',
                                        name: `${destEntityName}.${destEntity.features['logicalDeletion'].field}`,
                                    },
                                    right: true,
                                };

                                if (isPlainObject(remoteField)) {
                                    remoteField.with = {
                                        $xt: 'LogicalExpression',
                                        operator: 'and',
                                        left: remoteField.with,
                                        right: deletionCheck,
                                    };
                                } else if (assoc.with) {
                                    assoc.with = {
                                        $xt: 'LogicalExpression',
                                        operator: 'and',
                                        left: assoc.with,
                                        right: deletionCheck,
                                    };
                                } else {
                                    assoc.with = deletionCheck;
                                }
                            }

                            entity.addAssociation(anchor, {
                                entity: destEntityName,
                                key: destEntity.key,
                                on: this._translateJoinCondition(
                                    { ...assocNames, [destEntityName]: anchor },
                                    entity.key,
                                    anchor,
                                    assoc.with
                                        ? {
                                              by: remoteField,
                                              with: assoc.with,
                                          }
                                        : remoteField
                                ),
                                ...(typeof remoteField === 'string' ? { field: remoteField } : {}),
                                ...(assoc.type === 'hasMany' ? { list: true } : {}),
                            });
                        }
                    } else {
                        throw new Error(
                            'Unexpected path. Entity: ' +
                                entity.name +
                                ', association: ' +
                                JSON.stringify(assoc, null, 2)
                        );
                    }
                } else {
                    // semi association

                    let connectedByParts = assoc.by
                        ? assoc.by.split('.')
                        : [XemlUtils.prefixNaming(entity.name, destEntityName)];
                    if (connectedByParts.length > 2) {
                        throw new Error('Invalid "connectedBy" value in association. Entity: ' + entity.name);
                    }

                    let connectedByField = (connectedByParts.length > 1 && connectedByParts[1]) || entity.name;
                    let connEntityName = XemlUtils.entityNaming(connectedByParts[0]);

                    if (!connEntityName) {
                        throw new Error('Invalid "connectedBy" entity in association. Entity: ' + entity.name);
                    }

                    let tag1 = `${entity.name}:${
                        assoc.type === 'hasMany' ? 'm' : '1'
                    }-${destEntityName}:* by ${connEntityName}`;

                    if (assoc.srcField) {
                        tag1 += ' ' + assoc.srcField;
                    }

                    if (this._processedRef.has(tag1)) {
                        throw new Error('Duplicate association: ' + tag1);
                    }

                    let connEntity = schema.ensureGetEntity(entity.xemlModule, connEntityName, pendingEntities);
                    if (!connEntity) {
                        //create a
                        connEntity = this._addRelationEntity(
                            schema,
                            connEntityName,
                            entity.name,
                            destEntityName,
                            connectedByField,
                            destEntityNameAsFieldName
                        );
                        pendingEntities.push(connEntity.name);
                        this.linker.log('debug', `New entity "${connEntity.name}" added by association.`);
                    }

                    //todo: get back ref from connection entity
                    let connBackRef1 = connEntity.getReferenceTo(entity.name, {
                        type: 'refersTo',
                        srcField: (f) => _.isNil(f) || f == connectedByField,
                    });

                    if (!connBackRef1) {
                        throw new Error(
                            `Cannot find back reference to "${entity.name}" from relation entity "${connEntityName}".`
                        );
                    }

                    let connBackRef2 = connEntity.getReferenceTo(
                        destEntityName,
                        { type: 'refersTo' },
                        { association: connBackRef1 }
                    );

                    if (!connBackRef2) {
                        throw new Error(
                            `Cannot find back reference to "${destEntityName}" from relation entity "${connEntityName}".`
                        );
                    }

                    let connectedByField2 = connBackRef2.srcField || destEntityNameAsFieldName;

                    if (connectedByField === connectedByField2) {
                        throw new Error(
                            'Cannot use the same "by" field in a relation entity. Detail: ' +
                                JSON.stringify({
                                    src: entity.name,
                                    dest: destEntityName,
                                    srcField: assoc.srcField,
                                    by: connectedByField,
                                })
                        );
                    }

                    this._updateRelationEntity(
                        connEntity,
                        entity,
                        destEntity,
                        entity.name,
                        destEntityName,
                        connectedByField,
                        connectedByField2
                    );

                    let localFieldName = assoc.srcField || pluralize(destEntityNameAsFieldName);

                    entity.addAssociation(localFieldName, {
                        entity: connEntityName,
                        key: connEntity.key,
                        on: this._translateJoinCondition(
                            {
                                ...assocNames,
                                [destEntityName]: localFieldName + '.' + connectedByField2,
                                [connEntityName]: localFieldName,
                            },
                            entity.key,
                            localFieldName,
                            assoc.with
                                ? {
                                      by: connectedByField,
                                      with: assoc.with,
                                  }
                                : connectedByField
                        ),
                        field: connectedByField,
                        ...(assoc.type === 'hasMany' ? { list: true } : {}),
                        assoc: connectedByField2,
                    });

                    this._processedRef.add(tag1);
                    this.linker.log('verbose', `Processed 1-way reference: ${tag1}`);
                }

                break;

            case 'refersTo':
            case 'belongsTo':
                let localField = assoc.srcField || destEntityNameAsFieldName;
                let destFieldName = destKeyField.name;
                let referencedField = destKeyField;

                if (assoc.type === 'refersTo') {
                    let tag = `${entity.name}:1-${destEntityName}:* ${localField}`;

                    if (assoc.destField) {
                        if (!destEntity.hasField(assoc.destField)) {
                            throw new Error(
                                `The field "${assoc.destField}" being referenced is not a field of entity "${destEntityName}".`
                            );
                        }

                        destFieldName = assoc.destField;
                        referencedField = destEntity.fields[destFieldName];
                    }

                    tag += '->' + assoc.destField;

                    if (this._processedRef.has(tag)) {
                        //already processed by connection, skip
                        return;
                    }

                    this._processedRef.add(tag);
                    this.linker.log('verbose', `Processed week reference: ${tag}`);
                }

                let joinOn = {
                    [localField]: this._toColumnReference(assoc.anchor ?? localField + '.' + destFieldName),
                };

                if (assoc.with) {
                    Object.assign(
                        joinOn,
                        this._xemlConditionToQueryCondition({ ...assocNames, [destEntityName]: localField }, assoc.with)
                    );
                }

                if (!assoc.existingField) {
                    entity.addAssocField(localField, destEntity, referencedField, assoc.fieldProps);
                }

                if (assoc.anchor) {
                    entity.addAssociation(assoc.anchor, {
                        type: assoc.type,
                        entity: destEntityName,
                        key: destEntity.key,
                        field: destFieldName,
                        local: localField,
                        on: joinOn,
                    });
                } else {
                    entity.addAssociation(localField, {
                        type: assoc.type,
                        entity: destEntityName,
                        key: destEntity.key,
                        field: destFieldName,
                        on: joinOn,
                    });
                }

                //foreign key constraits
                let localFieldObj = entity.fields[localField];

                let constraints = {};

                if (localFieldObj.constraintOnUpdate) {
                    constraints.onUpdate = localFieldObj.constraintOnUpdate;
                }

                if (localFieldObj.constraintOnDelete) {
                    constraints.onDelete = localFieldObj.constraintOnDelete;
                }

                if (assoc.type === 'belongsTo') {
                    constraints.onUpdate || (constraints.onUpdate = 'CASCADE');
                    constraints.onDelete || (constraints.onDelete = 'CASCADE');
                } else if (localFieldObj.optional) {
                    constraints.onUpdate || (constraints.onUpdate = 'SET NULL');
                    constraints.onDelete || (constraints.onDelete = 'SET NULL');
                }

                constraints.onUpdate || (constraints.onUpdate = 'NO ACTION');
                constraints.onDelete || (constraints.onDelete = 'NO ACTION');

                this._addReference(entity.name, localField, destEntityName, destFieldName, constraints);
                break;
        }
    }

    _xemlConditionToQueryCondition(context, xemlCon) {
        if (!xemlCon.$xt) {
            throw new Error('Unknown syntax: ' + JSON.stringify(xemlCon));
        }

        if (xemlCon.$xt === 'BinaryExpression') {
            if (xemlCon.operator === '==') {
                let left = xemlCon.left;
                if (left.$xt && left.$xt === 'ObjectReference') {
                    left = this._translateReference(context, left.name, true);
                }

                let right = xemlCon.right;
                if (right.$xt && right.$xt === 'ObjectReference') {
                    right = this._translateReference(context, right.name);
                }

                return {
                    [left]: { $eq: right },
                };
            } else if (xemlCon.operator === '!=') {
                let left = xemlCon.left;
                if (left.$xt && left.$xt === 'ObjectReference') {
                    left = this._translateReference(context, left.name, true);
                }

                let right = xemlCon.right;
                if (right.$xt && right.$xt === 'ObjectReference') {
                    right = this._translateReference(context, right.name);
                }

                return {
                    [left]: { $ne: right },
                };
            }
        } else if (xemlCon.$xt === 'UnaryExpression') {
            let arg;

            switch (xemlCon.operator) {
                case 'is-null':
                    arg = xemlCon.argument;
                    if (arg.$xt && arg.$xt === 'ObjectReference') {
                        arg = this._translateReference(context, arg.name, true);
                    }

                    return {
                        [arg]: { $eq: null },
                    };

                case 'is-not-null':
                    arg = xemlCon.argument;
                    if (arg.$xt && arg.$xt === 'ObjectReference') {
                        arg = this._translateReference(context, arg.name, true);
                    }

                    return {
                        [arg]: { $ne: null },
                    };

                default:
                    throw new Error('Unknown UnaryExpression operator: ' + xemlCon.operator);
            }
        } else if (xemlCon.$xt === 'LogicalExpression') {
            switch (xemlCon.operator) {
                case 'and':
                    return {
                        $and: [
                            this._xemlConditionToQueryCondition(context, xemlCon.left),
                            this._xemlConditionToQueryCondition(context, xemlCon.right),
                        ],
                    };

                case 'or':
                    return {
                        $or: [
                            this._xemlConditionToQueryCondition(context, xemlCon.left),
                            this._xemlConditionToQueryCondition(context, xemlCon.right),
                        ],
                    };
            }
        }

        throw new Error('Unknown syntax: ' + JSON.stringify(xemlCon));
    }

    _translateReference(context, ref, asKey) {
        let [base, ...other] = ref.split('.');

        let translated = context[base];
        if (!translated) {
            console.log(context);
            throw new Error(`Referenced object "${ref}" not found in context.`);
        }

        let refName = [translated, ...other].join('.');

        if (asKey) {
            return refName;
        }

        return this._toColumnReference(refName);
    }

    _addReference(left, leftField, right, rightField, constraints) {
        if (Array.isArray(leftField)) {
            leftField.forEach((lf) => this._addReference(left, lf, right, rightField, constraints));
            return;
        }

        if (isPlainObject(leftField)) {
            this._addReference(left, leftField.by, right.rightField, constraints);
            return;
        }

        if (typeof leftField !== 'string') {
            throw new Error('Invalid left field: ' + leftField);
        }

        let refs4LeftEntity = this._references[left];
        if (!refs4LeftEntity) {
            refs4LeftEntity = [];
            this._references[left] = refs4LeftEntity;
        } else {
            let found = _.find(
                refs4LeftEntity,
                (item) => item.leftField === leftField && item.right === right && item.rightField === rightField
            );

            if (found) return;
        }

        refs4LeftEntity.push({ leftField, right, rightField, constraints });
    }

    _getReferenceOfField(left, leftField) {
        let refs4LeftEntity = this._references[left];
        if (!refs4LeftEntity) {
            return undefined;
        }

        let reference = _.find(refs4LeftEntity, (item) => item.leftField === leftField);

        if (!reference) {
            return undefined;
        }

        return reference;
    }

    _hasReferenceOfField(left, leftField) {
        let refs4LeftEntity = this._references[left];
        if (!refs4LeftEntity) return false;

        return undefined !== _.find(refs4LeftEntity, (item) => item.leftField === leftField);
    }

    _getReferenceBetween(left, right) {
        let refs4LeftEntity = this._references[left];
        if (!refs4LeftEntity) {
            return undefined;
        }

        let reference = _.find(refs4LeftEntity, (item) => item.right === right);

        if (!reference) {
            return undefined;
        }

        return reference;
    }

    _hasReferenceBetween(left, right) {
        let refs4LeftEntity = this._references[left];
        if (!refs4LeftEntity) return false;

        return undefined !== _.find(refs4LeftEntity, (item) => item.right === right);
    }

    _featureReducer(schema, entity, featureName, feature) {
        let field;

        switch (featureName) {
            case 'autoId':
                field = entity.fields[feature.field];

                if (field.type === 'integer') {
                    field.autoIncrementId = true;
                    field.autoByDb = true;
                    if ('startFrom' in feature) {
                        const seqId = `${entity.name}_${feature.field}_seq`;
                        this._sequenceRestart.push(
                            `ALTER SEQUENCE ${this.connector.escapeId(seqId)} RESTART WITH ${feature.startFrom};`
                        );
                        this._entitySequences[entity.name] = this._sequenceRestart.length - 1;
                    }
                }
                break;

            case 'createTimestamp':
                field = entity.fields[feature.field];
                field.isCreateTimestamp = true;
                break;

            case 'updateTimestamp':
                field = entity.fields[feature.field];
                field.isUpdateTimestamp = true;
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
                let changeLogSettings = get(schema.deploymentSettings, 'features.changeLog');

                if (!changeLogSettings) {
                    throw new Error(
                        `Missing "changeLog" feature settings in deployment config for schema [${schema.name}].`
                    );
                }

                if (!changeLogSettings.dataSource) {
                    throw new Error(`"changeLog.dataSource" is required. Schema: ${schema.name}`);
                }

                Object.assign(feature, changeLogSettings);
                break;

            case 'createBefore':
                break;

            case 'createAfter':
                break;

            case 'hasClosureTable':
                break;

            case 'isCacheTable':
                break;

            default:
                throw new Error('Unsupported feature "' + featureName + '".');
        }
    }

    _writeFile(filePath, content) {
        fs.ensureFileSync(filePath);
        fs.writeFileSync(filePath, content);

        this.linker.log('info', 'Generated db script: ' + filePath);
    }

    _addRelationEntity(
        schema,
        relationEntityName,
        entity1Name /* for cross db */,
        entity2Name /* for cross db */,
        entity1RefField,
        entity2RefField
    ) {
        let entityInfo = {
            features: ['autoId', 'createTimestamp'],
            indexes: [
                {
                    fields: [entity1RefField, entity2RefField],
                    unique: true,
                },
            ],
            associations: [
                {
                    type: 'refersTo',
                    destEntity: entity1Name,
                    srcField: entity1RefField,
                },
                {
                    type: 'refersTo',
                    destEntity: entity2Name,
                    srcField: entity2RefField,
                },
            ],
        };

        let entity = new Entity(this.linker, relationEntityName, schema.xemlModule, entityInfo);
        entity.link();

        schema.addEntity(entity);

        return entity;
    }

    /**
     *
     * @param {*} relationEntity
     * @param {*} entity1
     * @param {*} entity2
     * @param {*} entity1Name
     * @param {*} entity2Name
     * @param {*} connectedByField
     * @param {*} connectedByField2
     */
    _updateRelationEntity(
        relationEntity,
        entity1,
        entity2,
        entity1Name /* for cross db */,
        entity2Name /* for cross db */,
        connectedByField,
        connectedByField2
    ) {
        let relationEntityName = relationEntity.name;

        this._relationEntities[relationEntityName] = true;

        if (relationEntity.info.associations) {
            // check if the relation entity has the refersTo both side of associations
            let hasRefToEntity1 = false,
                hasRefToEntity2 = false;

            _.each(relationEntity.info.associations, (assoc) => {
                if (
                    assoc.type === 'refersTo' &&
                    assoc.destEntity === entity1Name &&
                    (assoc.srcField || entity1Name) === connectedByField
                ) {
                    hasRefToEntity1 = true;
                }

                if (
                    assoc.type === 'refersTo' &&
                    assoc.destEntity === entity2Name &&
                    (assoc.srcField || entity2Name) === connectedByField2
                ) {
                    hasRefToEntity2 = true;
                }
            });

            if (hasRefToEntity1 && hasRefToEntity2) {
                //yes, don't need to add refersTo to the relation entity
                return;
            }
        }

        let tag1 = `${relationEntityName}:1-${entity1Name}:* ${connectedByField}`;
        let tag2 = `${relationEntityName}:1-${entity2Name}:* ${connectedByField2}`;

        if (this._processedRef.has(tag1)) {
            if (!this._processedRef.has(tag2)) {
                throw new Error('Missing reference: ' + tag2);
            }

            //already processed, skip
            return;
        }

        this._processedRef.add(tag1);
        this.linker.log('verbose', `Processed bridging reference: ${tag1}`);

        this._processedRef.add(tag2);
        this.linker.log('verbose', `Processed bridging reference: ${tag2}`);

        let keyEntity1 = entity1.getKeyField();
        if (Array.isArray(keyEntity1)) {
            throw new Error(`Combination primary key is not supported. Entity: ${entity1Name}`);
        }

        let keyEntity2 = entity2.getKeyField();
        if (Array.isArray(keyEntity2)) {
            throw new Error(`Combination primary key is not supported. Entity: ${entity2Name}`);
        }

        relationEntity.addAssocField(connectedByField, entity1, keyEntity1);
        relationEntity.addAssocField(connectedByField2, entity2, keyEntity2);

        relationEntity.addAssociation(connectedByField, { entity: entity1Name });
        relationEntity.addAssociation(connectedByField2, { entity: entity2Name });

        let allCascade = { onUpdate: 'RESTRICT', onDelete: 'RESTRICT' };

        this._addReference(relationEntityName, connectedByField, entity1Name, keyEntity1.name, allCascade);
        this._addReference(relationEntityName, connectedByField2, entity2Name, keyEntity2.name, allCascade);
    }

    xemlOpToSql(op) {
        switch (op) {
            case '=':
                return '=';

            default:
                throw new Error('xemlOpToSql to be implemented.');
        }
    }

    xemlToSql(schema, doc, xeml, params) {
        if (!xeml.$xt) {
            return xeml;
        }

        switch (xeml.$xt) {
            case 'BinaryExpression':
                let left, right;

                if (xeml.left.$xt) {
                    left = this.xemlToSql(schema, doc, xeml.left, params);
                } else {
                    left = xeml.left;
                }

                if (xeml.right.$xt) {
                    right = this.xemlToSql(schema, doc, xeml.right, params);
                } else {
                    right = xeml.right;
                }

                return left + ' ' + this.xemlOpToSql(xeml.operator) + ' ' + right;

            case 'ObjectReference':
                if (!XemlUtils.isMemberAccess(xeml.name)) {
                    if (params && _.find(params, (p) => p.name === xeml.name) !== -1) {
                        return 'p' + _.upperFirst(xeml.name);
                    }

                    throw new Error(`Referencing to a non-existing param "${xeml.name}".`);
                }

                let { entityNode, entity, field } = XemlUtils.parseReferenceInDocument(schema, doc, xeml.name);

                return entityNode.alias + '.' + this.quoteIdentifier(field.name);

            default:
                throw new Error('oolToSql to be implemented.');
        }
    }

    _orderByToSql(schema, doc, ool) {
        return this.xemlToSql(schema, doc, { $xt: 'ObjectReference', name: ool.field }) + (ool.ascend ? '' : ' DESC');
    }

    _viewDocumentToSQL(modelingSchema, view) {
        let sql = '  ';
        //console.log('view: ' + view.name);
        let doc = _.cloneDeep(view.getDocumentHierarchy(modelingSchema));
        //console.dir(doc, {depth: 8, colors: true});

        //let aliasMapping = {};
        let [colList, alias, joins] = this._buildViewSelect(modelingSchema, doc, 0);

        sql += 'SELECT ' + colList.join(', ') + ' FROM ' + this.quoteIdentifier(doc.entity) + ' AS ' + alias;

        if (!isEmpty(joins)) {
            sql += ' ' + joins.join(' ');
        }

        if (!isEmpty(view.selectBy)) {
            sql +=
                ' WHERE ' +
                view.selectBy.map((select) => this.xemlToSql(modelingSchema, doc, select, view.params)).join(' AND ');
        }

        if (!isEmpty(view.groupBy)) {
            sql += ' GROUP BY ' + view.groupBy.map((col) => this._orderByToSql(modelingSchema, doc, col)).join(', ');
        }

        if (!isEmpty(view.orderBy)) {
            sql += ' ORDER BY ' + view.orderBy.map((col) => this._orderByToSql(modelingSchema, doc, col)).join(', ');
        }

        let skip = view.skip || 0;
        if (view.limit) {
            sql +=
                ' LIMIT ' +
                this.xemlToSql(modelingSchema, doc, skip, view.params) +
                ', ' +
                this.xemlToSql(modelingSchema, doc, view.limit, view.params);
        } else if (view.skip) {
            sql += ' OFFSET ' + this.xemlToSql(modelingSchema, doc, view.skip, view.params);
        }

        return sql;
    }

    /*
    _buildViewSelect(schema, doc, startIndex) {
        let entity = schema.entities[doc.entity];
        let alias = ntol(startIndex++);
        doc.alias = alias;

        let colList = Object.keys(entity.fields).map(k => alias + '.' + MySQLModeler.quoteIdentifier(k));
        let joins = [];

        if (!isEmpty(doc.subDocuments)) {
            _.forOwn(doc.subDocuments, (doc, fieldName) => {
                let [ subColList, subAlias, subJoins, startIndex2 ] = this._buildViewSelect(schema, doc, startIndex);
                startIndex = startIndex2;
                colList = colList.concat(subColList);
                
                joins.push('LEFT JOIN ' + MySQLModeler.quoteIdentifier(doc.entity) + ' AS ' + subAlias
                    + ' ON ' + alias + '.' + MySQLModeler.quoteIdentifier(fieldName) + ' = ' +
                    subAlias + '.' + MySQLModeler.quoteIdentifier(doc.linkWithField));

                if (!isEmpty(subJoins)) {
                    joins = joins.concat(subJoins);
                }
            });
        }

        return [ colList, alias, joins, startIndex ];
    }*/

    _createTableStatement(entityName, entity /*, mapOfEntityNameToCodeName*/) {
        const unlogged = entity.hasFeature('isCacheTable') ? ' UNLOGGED' : '';
        let sql =
            `-- Create Table\nCREATE${unlogged} TABLE IF NOT EXISTS ` + this.connector.escapeId(entityName) + ' (\n';

        //column definitions
        _.each(entity.fields, (field, name) => {
            sql += '  ' + this.quoteIdentifier(name) + ' ' + this.columnDefinition(entity, field) + ',\n';
        });

        const pkName = `${entityName}_pkey`;

        sql += '  CONSTRAINT "' + pkName + '" PRIMARY KEY (' + this.quoteIdListOrValue(entity.key) + '),\n';

        let lines = [];
        this._events.emit('beforeEndColumnDefinition:' + entityName, lines);
        if (lines.length > 0) {
            sql += '  ' + lines.join(',\n  ');
        } else {
            sql = sql.substring(0, sql.length - 2);
        }

        sql += '\n)';

        //table options
        let extraProps = {};
        this._events.emit('setTableOptions:' + entityName, extraProps);
        let props = Object.assign({}, this._dbOptions.table, extraProps);

        sql = _.reduce(
            props,
            function (result, value, key) {
                return result + ' ' + key + '=' + value;
            },
            sql
        );

        sql += ';\n\n';

        const outVars = {};

        this._events.emit('afterTableDefinition:' + entityName, outVars);

        if (outVars.sql) {
            sql += outVars.sql;
        }

        //other keys
        if (entity.indexes && entity.indexes.length > 0) {
            entity.indexes.forEach((index) => {
                const indexName = `${entityName}_${index.fields.join('_')}_idx`;
                sql += this._addTableIndex(index, entity, indexName, entityName);
            });
        }

        if (entity.comment) {
            sql += this._addTableComment(entity);
        }

        //column definitions
        _.each(entity.fields, (field, name) => {
            if (field.comment) {
                sql += `COMMENT ON COLUMN "${entityName}"."${name}" IS ${this.quoteString(field.comment)};\n\n`;
            }
        });

        return sql;
    }

    _alterTableStatement(entityName, entity, currentEntity) {
        let sql = '';
        const unlogged = entity.hasFeature('isCacheTable') && currentEntity.features?.isCacheTable == null;
        const logged = !entity.hasFeature('isCacheTable') && currentEntity.features?.isCacheTable != null;

        const tableName = this.connector.escapeId(entityName);

        if (unlogged) {
            sql += `-- Alter Table\nALTER TABLE ${tableName} SET UNLOGGED;\n\n`;
        } else if (logged) {
            sql += `-- Alter Table\nALTER TABLE ${tableName} SET LOGGED;\n\n`;
        }

        let fieldsToDrop = new Set(Object.keys(currentEntity.fields));

        //column definitions
        _.each(entity.fields, (field, name) => {
            const targetField = field.toJSON();
            const currentField = currentEntity.fields[name];

            if (currentField == null) {
                // todo: customized rules to rename column

                sql += `-- Add Column\nALTER TABLE ${tableName} ADD COLUMN ${this.quoteIdentifier(
                    name
                )} ${this.columnDefinition(entity, targetField)};\n\n`;

                if (field.comment) {
                    sql += `COMMENT ON COLUMN "${entityName}"."${name}" IS ${this.quoteString(field.comment)};\n\n`;
                }
            } else {
                fieldsToDrop.delete(name);

                // otherwise, modify column
                if (!_.isEqual(targetField, currentField)) {
                    sql += `-- Alter Column\nALTER TABLE ${tableName} ALTER COLUMN ${this.quoteIdentifier(
                        name
                    )} TYPE ${this.columnDefinition(entity, field, true)};\n`;

                    // ALTER [ COLUMN ] column_name { SET | DROP } NOT NULL
                    if (targetField.optional != currentField.optional) {
                        sql += `ALTER TABLE ${tableName} ALTER COLUMN ${this.quoteIdentifier(name)} ${
                            targetField.optional ? 'DROP' : 'SET'
                        } NOT NULL;\n`;
                    }

                    // ALTER [ COLUMN ] column_name SET DEFAULT expression
                    const _type = this.columnDefinition(entity, field, true, true);
                    const _targetDefault = this.defaultValue(entity, field, _type);
                    if (_targetDefault) {
                        sql += `ALTER TABLE ${tableName} ALTER COLUMN ${this.quoteIdentifier(
                            name
                        )} SET${_targetDefault};\n`;
                    }

                    //column definitions
                    if (targetField.comment !== currentField.comment) {
                        sql += `COMMENT ON COLUMN "${entityName}"."${name}" IS ${this.quoteString(
                            targetField.comment
                        )};\n\n`;
                    }

                    sql += '\n';
                }
            }
        });

        if (fieldsToDrop.size > 0) {
            for (let fieldName of fieldsToDrop) {
                this.warnings[
                    `Delete ${entityName}.${fieldName}`
                ] = `Field "${fieldName}" of entity "${entityName}" should be deleted.`;
            }
        }

        if (entity.key !== currentEntity.key) {
            const pkName = this.quoteIdentifier(`${entityName}_pkey`);

            sql += `-- Drop Primary Key\nALTER TABLE ${tableName} DROP CONSTRAINT ${pkName};\n`;
            sql += `-- Add Primary Key\nALTER TABLE ${tableName} ADD CONSTRAINT ${pkName} PRIMARY KEY (${this.quoteIdListOrValue(
                entity.key
            )});\n\n`;
        }

        const currentIndexes = currentEntity.indexes
            ? currentEntity.indexes.reduce((result, index) => {
                  const indexName = `${entityName}_${index.fields.join('_')}_idx`;
                  result[indexName] = index;
                  return result;
              }, {})
            : {};

        //other keys
        if (entity.indexes?.length > 0) {
            entity.indexes.forEach((index) => {
                const indexName = `${entityName}_${index.fields.join('_')}_idx`;

                const currentIndex = currentIndexes[indexName];

                if (currentIndex == null) {
                    sql += this._addTableIndex(index, entity, indexName, entityName);
                } else {
                    delete currentIndexes[indexName];

                    if (!_.isEqual(index, currentIndex)) {
                        sql += `-- Drop Index\nDROP INDEX ${this.quoteIdentifier(indexName)};\n\n`;
                        sql += this._addTableIndex(index, entity, indexName, entityName);
                    }
                }
            });
        }

        if (!isEmpty(currentIndexes)) {
            _.each(currentIndexes, (index, indexName) => {
                sql += `-- Drop Index\nDROP INDEX ${this.quoteIdentifier(indexName)};\n\n`;
            });
        }

        if (entity.comment !== currentEntity.comment) {
            sql += this._addTableComment(entity);
        }

        if (sql) {
            sql = '-- entity "' + entityName + '"\n' + sql + '\n';
        }

        return sql;
    }

    _addTableIndex(index, entity, indexName, entityName) {
        let sql = '-- Create Index\nCREATE ';
        let ginIndex = false;

        if (index.fields.length === 1) {
            const field = index.fields[0];
            if (entity.fields[field].type === 'object') {
                ginIndex = true;
            }
        }

        if (ginIndex) {
            sql +=
                'INDEX "' +
                indexName +
                '" ON "' +
                entityName +
                '" USING GIN ' +
                '(' +
                this.quoteIdListOrValue(index.fields) +
                ');\n\n';
        } else {
            if (index.unique) {
                sql += 'UNIQUE ';
            }

            sql +=
                'INDEX ' +
                (indexName.startsWith(XemlTypes.MetadataEntity + '_') ? 'IF NOT EXISTS "' : '"') +
                indexName +
                '" ON "' +
                entityName +
                '"(' +
                this.quoteIdListOrValue(index.fields) +
                ');\n\n';
        }
        return sql;
    }

    _addTableComment(entity) {
        return `COMMENT ON TABLE "${entity.name}" IS ${this.quoteString(entity.comment)};\n\n`;
    }

    _addForeignKeyStatement(entityName, relation) {
        let refTable = relation.right;

        if (refTable.indexOf('.') > 0) {
            let [schemaName, refEntityName] = refTable.split('.');

            //let targetConnector = this.modelService.getConnector(schemaName);
            // todo: support multiple schema
            refTable = this.quoteIdentifier(refEntityName);
        } else {
            refTable = this.quoteIdentifier(refTable);
        }

        let keyName = `${entityName}_${relation.leftField}_fkey`;

        let sql =
            'ALTER TABLE ' +
            this.quoteIdentifier(entityName) +
            ' ADD CONSTRAINT ' +
            this.quoteIdentifier(keyName) +
            ' FOREIGN KEY (' +
            this.quoteIdentifier(relation.leftField) +
            ') ' +
            'REFERENCES ' +
            refTable +
            ' (' +
            this.quoteIdentifier(relation.rightField) +
            ') ';

        sql += `ON UPDATE ${relation.constraints.onUpdate} ON DELETE ${relation.constraints.onDelete};\n`;

        return sql;
    }

    _dropForeignKeyStatement(entityName, relation) {
        let keyName = `${entityName}_${relation.leftField}_fkey`;

        let sql =
            'ALTER TABLE ' + this.quoteIdentifier(entityName) + ' DROP CONSTRAINT ' + this.quoteIdentifier(keyName);

        return sql;
    }

    static foreignKeyFieldNaming(entityName, entity) {
        let leftPart = naming.camelCase(entityName);
        let rightPart = naming.pascalCase(entity.key);

        if (_.endsWith(leftPart, rightPart)) {
            return leftPart;
        }

        return leftPart + rightPart;
    }

    quoteString(str) {
        return this.connector.escapeValue(str);
    }

    quoteIdentifier(str) {
        return this.connector.escapeId(str);
    }

    quoteIdListOrValue(obj) {
        return _.isArray(obj) ? obj.map((v) => this.quoteIdentifier(v)).join(', ') : this.quoteIdentifier(obj);
    }

    complianceCheck(entity) {
        let result = { errors: [], warnings: [] };

        if (!entity.key) {
            result.errors.push('Primary key is not specified.');
        }

        return result;
    }

    columnDefinition(entity, field, isProc, returnType) {
        let col;

        if (field.domain) {
            col = {
                sql: field.domain,
                type: 'DOMAIN',
            };
        } else {
            switch (field.type) {
                case 'array':
                    if (field.vector != null) {
                        col = this.vectorColumnDefinition(field);
                    } else if (field.element) {
                        col = this.arrayColumnDefinition(entity, field);
                    } else {
                        col = this.textColumnDefinition(field);
                    }
                    break;

                case 'bigint':
                    col = this.bigintColumnDefinition(field);
                    break;

                case 'binary':
                    col = this.binaryColumnDefinition(field);
                    break;

                case 'boolean':
                    col = this.boolColumnDefinition(field);
                    break;

                case 'datetime':
                    col = this.datetimeColumnDefinition(field);
                    break;

                case 'integer':
                    col = this.intColumnDefinition(field);
                    break;

                case 'number':
                    col = this.floatColumnDefinition(field);
                    break;

                case 'object':
                    //if (field.jsonb) {
                    col = this.jsonbColumnDefinition(field);
                    //} else {
                    //   col = this.textColumnDefinition(field);
                    //}
                    break;

                case 'text':
                    col = this.textColumnDefinition(field);
                    break;

                default:
                    throw new Error('Unsupported type "' + field.type + '". Field: ' + JSON.stringify(field));
            }
        }

        let { sql, type } = col;

        if (returnType) {
            return type;
        }

        if (!isProc) {
            sql += this.columnNullable(field);
            sql += this.defaultValue(entity, field, type);
        }

        return sql;
    }

    bigintColumnDefinition(info) {
        let sql, type;

        type = sql = info.autoIncrementId ? 'BIGSERIAL' : 'BIGINT';

        if (info.unsigned) {
            this.warnings['unsigned'] = UNSIGNED_WARNING;
        }

        return { sql, type };
    }

    intColumnDefinition(info) {
        let sql, type;

        if (info.bytes) {
            if (info.bytes === 8) {
                type = sql = info.autoIncrementId ? 'BIGSERIAL' : 'BIGINT';
            } else if (info.bytes === 4) {
                type = sql = info.autoIncrementId ? 'SERIAL' : 'INT';
            } else if (info.bytes === 1 || info.bytes === 2) {
                type = sql = info.autoIncrementId ? 'SERIAL' : 'SMALLINT';
            } else {
                throw new Error(`Unsupported "bytes" value (${info.bytes}) for "integer" type.`);
            }
        } else if (info.digits) {
            if (info.digits > 10) {
                type = sql = info.autoIncrementId ? 'BIGSERIAL' : 'BIGINT';
            } else if (info.digits > 4) {
                type = sql = info.autoIncrementId ? 'SERIAL' : 'INT';
            } else {
                type = sql = info.autoIncrementId ? 'SERIAL' : 'SMALLINT';
            }
        } else {
            type = sql = info.autoIncrementId ? 'SERIAL' : 'INT';
        }

        if (info.unsigned) {
            this.warnings['unsigned'] = UNSIGNED_WARNING;
        }

        return { sql, type };
    }

    floatColumnDefinition(info) {
        let sql = '',
            type;

        if (info.type == 'number' && info.exact) {
            type = sql = 'NUMERIC';

            if (info.totalDigits > MAX_NUMERIC_PRECISION) {
                throw new Error('Total digits exceed maximum limit.');
            }
        } else {
            type = sql = 'FLOAT';
            if (info.decimalDigits != null) {
                throw new Error('`decimalDigits` is not supported for `FLOAT` type.');
            }
        }

        if ('totalDigits' in info) {
            sql += '(' + info.totalDigits;
            if ('decimalDigits' in info) {
                sql += ', ' + info.decimalDigits;
            }
            sql += ')';
        } else {
            if ('decimalDigits' in info) {
                sql += '(' + info.decimalDigits + ', ' + info.decimalDigits + ')';
            }
        }

        return { sql, type };
    }

    arrayColumnDefinition(entity, info) {
        let sql = '',
            type;

        const subType = this.columnDefinition(entity, info.element, true, true);

        if (typeof info.fixedLength === 'number') {
            type = sql = subType + '[' + info.fixedLength + ']';
        } else {
            type = sql = subType + '[]';
        }

        return { sql, type };
    }

    vectorColumnDefinition(info) {
        let sql = '',
            type;

        if (typeof info.vector === 'number') {
            sql = 'VECTOR(' + info.vector + ')';
            type = 'VECTOR';
        }
        if (typeof info.fixedLength === 'number') {
            sql = 'VECTOR(' + info.fixedLength + ')';
            type = 'VECTOR';
        } else {
            throw new Error('`vector` length is required for `vector` type.');
        }

        return { sql, type };
    }

    jsonbColumnDefinition(info) {
        let sql = '',
            type;

        type = sql = 'JSONB';

        return { sql, type };
    }

    textColumnDefinition(info) {
        let sql = '',
            type;

        if (info.fixedLength) {
            sql = 'CHAR(' + info.fixedLength + ')';
            type = 'CHAR';
        } else if (info.maxLength) {
            type = sql = 'VARCHAR';
            sql += '(' + info.maxLength + ')';
        } else {
            type = sql = 'TEXT';
        }

        return { sql, type };
    }

    binaryColumnDefinition(info) {
        let sql = '',
            type;

        type = sql = 'BYTEA';

        return { sql, type };
    }

    boolColumnDefinition() {
        return { sql: 'BOOLEAN', type: 'BOOLEAN' };
    }

    datetimeColumnDefinition(info) {
        let sql, type;

        if (!info.range || info.range === 'datetime') {
            sql = 'TIMESTAMP(3)';
            type = 'TIMESTAMP';
        } else if (info.range === 'date') {
            type = sql = 'DATE';
        } else if (info.range === 'time') {
            type = sql = 'TIME';
        } else if (info.range === 'year') {
            throw new Error("range('year') for `datetime` type is not supported.");
        } else if (info.range === 'timestamp') {
            type = sql = 'TIMESTAMP';
        } else if (info.range === 'interval') {
            type = sql = 'INTERVAL';
        }

        return { sql, type };
    }

    columnNullable(info) {
        if (info.optional) {
            return ' NULL';
        }

        return ' NOT NULL';
    }

    defaultValue(entity, info, type) {
        if (info.isCreateTimestamp) {
            info.autoByDb = true;
            return ' DEFAULT CURRENT_TIMESTAMP';
        }

        if (info.autoIncrementId) {
            info.autoByDb = true;
            return ''; // no ' AUTO_INCREMENT' in progres;
        }

        /*
        todo: replaced by trigger
        if (info.isUpdateTimestamp) {
            info.updateByDb = true;
            return ' ON UPDATE CURRENT_TIMESTAMP';
        }
        */

        let sql = '';

        if (!info.optional) {
            if (info.hasOwnProperty('default')) {
                let defaultValue = info['default'];

                if (typeof defaultValue === 'object' && defaultValue.$xt) {
                    if (defaultValue.$xt === XemlTypes.Lang.SYMBOL_TOKEN) {
                        const tokenName = defaultValue.name.toUpperCase();

                        switch (tokenName) {
                            case 'NOW':
                                sql += ' DEFAULT NOW()';
                                info.autoByDb = true;
                                delete info.default;
                                return sql;

                            default:
                                throw new Error(`Unsupported symbol token "${tokenName}".`);
                        }
                    } else if (defaultValue.$xt === XemlTypes.Lang.CONST_REF) {
                        defaultValue = this.linker.translateXemlValue(entity.xemlModule, defaultValue);
                    } else {
                        throw new Error(`Unknown xeml object tag "${defaultValue.$xt}".`);
                    }
                }

                if (info.enum) {
                    if (!info.enum.includes(defaultValue)) {
                        throw new Error(`Invalid default value "${defaultValue}" for enum field "${info.name}".`);
                    }
                    sql += ' DEFAULT ' + this.quoteString(defaultValue);
                } else {
                    switch (info.type) {
                        case 'boolean':
                            sql += ' DEFAULT ' + (Types.BOOLEAN.sanitize(defaultValue) ? 'TRUE' : 'FALSE');
                            break;

                        case 'bigint':
                        case 'integer':
                            if (_.isInteger(defaultValue)) {
                                sql += ' DEFAULT ' + defaultValue.toString();
                            } else {
                                sql += ' DEFAULT ' + parseInt(defaultValue).toString();
                            }
                            break;

                        case 'text':
                            sql += ' DEFAULT ' + (defaultValue ? this.quoteString(defaultValue) : "''");
                            break;

                        case 'number':
                            if (_.isNumber(defaultValue)) {
                                sql += ' DEFAULT ' + defaultValue.toString();
                            } else {
                                sql += ' DEFAULT ' + parseFloat(defaultValue).toString();
                            }
                            break;

                        case 'binary':
                            sql += ' DEFAULT ' + bin2Hex(defaultValue);
                            break;

                        case 'datetime':
                            sql +=
                                ' DEFAULT ' +
                                this.quoteString(Types.DATETIME.sanitize(defaultValue).toSQL({ includeOffset: false }));
                            break;

                        case 'object':
                        case 'array':
                            sql += ' DEFAULT ' + this.quoteString(JSON.stringify(defaultValue));
                            break;

                        default:
                            throw new Error(`Invalid type "${info.type}"`);
                    }
                }
            } else if (!info.hasOwnProperty('auto')) {
                if (UNSUPPORTED_DEFAULT_VALUE.has(type)) {
                    return '';
                }

                if (info.type === 'boolean') {
                    sql += ' DEFAULT FALSE';
                } else if (info.type === 'bigint' || info.type === 'integer' || info.type === 'number') {
                    sql += ' DEFAULT 0';
                } else if (info.type === 'datetime') {
                    sql += ' DEFAULT CURRENT_TIMESTAMP';
                } else if (info.enum) {
                    sql += ' DEFAULT ' + this.quoteString(info.enum[0]);
                    info.autoByDb = true;
                } else {
                    sql += " DEFAULT ''";
                }

                //not explicit specified, will not treated as autoByDb
                //info.autoByDb = true;
            }
        }

        return sql;
    }

    static removeTableNamePrefix(entityName, removeTablePrefix) {
        if (removeTablePrefix) {
            entityName = _.trim(_.snakeCase(entityName));

            removeTablePrefix = _.trimEnd(_.snakeCase(removeTablePrefix), '_') + '_';

            if (_.startsWith(entityName, removeTablePrefix)) {
                entityName = entityName.substr(removeTablePrefix.length);
            }
        }

        return XemlUtils.entityNaming(entityName);
    }
}

module.exports = PostgresModeler;
