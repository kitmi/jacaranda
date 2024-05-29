"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return _default;
    }
});
const _types = require("@kitmi/types");
const _utils = require("@kitmi/utils");
const _allSync = require("@kitmi/validators/allSync");
const _entityFeatures = /*#__PURE__*/ _interop_require_default(require("./entityFeatures"));
const _Rules = /*#__PURE__*/ _interop_require_default(require("./enum/Rules"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const NEED_OVERRIDE = 'Should be overrided by driver-specific subclass.';
function minifyAssocs(assocs) {
    const sorted = _utils._.uniq(assocs).sort().reverse();
    const minified = _utils._.take(sorted, 1);
    const l = sorted.length - 1;
    for(let i = 1; i < l; i++){
        const k = sorted[i] + '.';
        if (!_utils._.find(minified, (a)=>a.startsWith(k))) {
            minified.push(sorted[i]);
        }
    }
    return minified;
}
const $xrsToBypass = new Set([
    'Column',
    'Function',
    'BinExpr',
    'Query',
    'Raw',
    'DataSet',
    'SQL'
]);
/**
 * Base entity model class.
 * @class
 */ class EntityModel {
    static valueOfKey(data) {
        return data[this._meta.keyField];
    }
    /**
     * Get a field schema based on the metadata of the field.
     * @param {string} name - Field name
     * @param {object} [extra] - Extra schema options
     * @return {object|array} Schema object
     */ static fieldSchema(name, extra) {
        const meta = this._meta.fields[name];
        if (!meta) {
            throw new _types.InvalidArgument(`Unknown field "${name}" of entity "${this._meta.name}".`);
        }
        const schema = _utils._.omit(meta, [
            'default',
            'optional'
        ]);
        if (extra) {
            const { $addEnumValues, $orAsArray, ...others } = extra;
            let arrayElem = schema;
            if ($orAsArray) {
                arrayElem = {
                    ...schema,
                    ...others
                };
            }
            if (meta.type === _allSync.Types.ENUM.name && $addEnumValues) {
                schema.values = schema.values.concat($addEnumValues);
            }
            Object.assign(schema, others);
            if ($orAsArray) {
                return [
                    schema,
                    {
                        type: 'array',
                        elementSchema: arrayElem
                    }
                ];
            }
        }
        return schema;
    }
    /**
     * Get a map of fields schema by predefined input set.
     * @param {string} inputSetName - Input set name, predefined in geml
     * @param {object} [options] - Input set options
     * @return {object} Schema object
     */ static inputSchema(inputSetName, options) {
        const key = inputSetName + (options == null ? '{}' : JSON.stringify(options));
        if (this._cachedSchema) {
            const cache = this._cachedSchema[key];
            if (cache) {
                return cache;
            }
        } else {
            this._cachedSchema = {};
        }
        const schemaGenerator = this._db.require(`inputs/${this._meta.name}-${inputSetName}`);
        return this._cachedSchema[key] = schemaGenerator(options);
    }
    /**
     * Helper to combine explicit required associations and associations required by query fields or projection fields.
     * @param {*} extraArray 
     * @param {*} fields 
     * @returns {Array}
     */ static assocFrom(extraArray, fields) {
        const result = new Set(extraArray);
        if (fields) {
            fields.forEach((keyPath)=>{
                const keyNodes = keyPath.split('.');
                if (keyNodes.length > 1) {
                    const assoc = keyNodes.slice(0, -1).map((p)=>p.startsWith(":") ? p.substring(1) : p).join('.');
                    result.add(assoc);
                }
            });
        }
        return Array.from(result);
    }
    /**
     * Get field names array of a unique key from input data.
     * @param {object} data - Input data.
     */ static getUniqueKeyFieldsFrom(data) {
        return _utils._.find(this._meta.uniqueKeys, (fields)=>_utils._.every(fields, (f)=>!_utils._.isNil(data[f])));
    }
    /**
     * Get key-value pairs of a unique key from input data.
     * @param {object} data - Input data.
     */ static getUniqueKeyValuePairsFrom(data) {
        const ukFields = this.getUniqueKeyFieldsFrom(data);
        return _utils._.pick(data, ukFields);
    }
    /**
     * Get nested object of an entity.
     * @param {*} entityObj
     * @param {*} keyPath
     */ static getNestedObject(entityObj, keyPath, defaultValue) {
        const nodes = (Array.isArray(keyPath) ? keyPath : keyPath.split('.')).map((key)=>key[0] === ':' ? key : ':' + key);
        return _utils._.get(entityObj, nodes, defaultValue);
    }
    /**
     * Ensure the entity object containing required fields, if not, it will automatically fetched from db and return.
     * @param {*} entityObj 
     * @param {Array} fields 
     * @param {*} connOpts 
     * @returns {Object}
     */ static async ensureFields_(entityObj, fields, connOpts) {
        if (_utils._.find(fields, (field)=>!_utils._.has(entityObj, field))) {
            const uk = this.getUniqueKeyValuePairsFrom(entityObj);
            if ((0, _utils.isEmpty)(uk)) {
                throw new UnexpectedState('None of the unique keys found from the data set.');
            }
            const findOptions = {
                $where: uk,
                /* $projection: fields,*/ $association: this.assocFrom(null, fields)
            };
            return this.findOne_(findOptions, connOpts);
        }
        return entityObj;
    }
    /**
     * Ensure context.latest be the just created entity.
     * @param {*} context
     * @param {*} customOptions
     */ static ensureRetrieveCreated(context, customOptions) {
        if (!context.options.$retrieveCreated) {
            context.options.$retrieveCreated = customOptions || true;
        }
    }
    /**
     * Ensure context.latest be the just updated entity.
     * @param {*} context
     * @param {*} customOptions
     */ static ensureRetrieveUpdated(context, customOptions) {
        if (!context.options.$retrieveUpdated) {
            context.options.$retrieveUpdated = customOptions || true;
        }
    }
    /**
     * Ensure context.exisintg be the just deleted entity.
     * @param {*} context
     * @param {*} customOptions
     */ static ensureRetrieveDeleted(context, customOptions) {
        if (!context.options.$retrieveDeleted) {
            context.options.$retrieveDeleted = customOptions || true;
        }
    }
    /**
     * Ensure the upcoming operations are executed in a transaction.
     * @param {*} context
     */ static async ensureTransaction_(context) {
        if (!context.connOptions || !context.connOptions.connection) {
            context.connOptions || (context.connOptions = {});
            context.connOptions.connection = await this._db.connector.beginTransaction_();
        }
    }
    /**
     * Get value from context, e.g. session, query ...
     * @param {*} context
     * @param {string} key
     * @returns {*}
     */ static getValueFromContext(context, key) {
        return _utils._.get(context, 'options.$variables.' + key);
    }
    /**
     * Get a pk-indexed hashtable with all undeleted data
     * {string} [key] - The key field to used by the hashtable.
     * {array} [associations] - With an array of associations.
     * {object} [connOptions] - Connection options, e.g. transaction handle
     */ static async cached_(key, associations, connOptions1) {
        if (key) {
            let combinedKey = key;
            if (!(0, _utils.isEmpty)(associations)) {
                combinedKey += '/' + minifyAssocs(associations).join('&');
            }
            let cachedData;
            if (!this._cachedData) {
                this._cachedData = {};
            } else if (this._cachedData[combinedKey]) {
                cachedData = this._cachedData[combinedKey];
            }
            if (!cachedData) {
                cachedData = this._cachedData[combinedKey] = await this.findAll_({
                    $association: associations,
                    $toDictionary: key
                }, connOptions1);
            }
            return cachedData;
        }
        return this.cached_(this._meta.keyField, associations, connOptions1);
    }
    static toDictionary(entityCollection, key, transformer) {
        key || (key = this._meta.keyField);
        return Convertors.toKVPairs(entityCollection, key, transformer);
    }
    /**
     * Run aggregate pipeline
     * @param {array} pipeline
     * @param {object} [connOptions]
     * @returns {*}
     */ static async aggregate_(pipeline, connOptions1) {
        const _pipeline = pipeline.map((q)=>this._prepareQueries(q));
        return this._db.connector.aggregate_(this._meta.name, _pipeline, connOptions1);
    }
    /**
     * Find a record by unique keys, returns a model object containing the record or undefined if nothing found.     
     * @param {object} [findOptions] - findOptions
     * @property {object} [findOptions.$association] - Joinings
     * @property {object} [findOptions.$select] - Selected fields
     * @property {object} [findOptions.$transformer] - Transform fields before returning
     * @property {object} [findOptions.$where] - Extra condition
     * @property {object} [findOptions.$groupBy] - Group by fields
     * @property {object} [findOptions.$orderBy] - Order by fields
     * @property {number} [findOptions.$offset] - Offset
     * @property {number} [findOptions.$limit] - Limit
     * @property {bool} [findOptions.$includeDeleted=false] - Include those marked as logical deleted.     
     * @property {bool} [findOptions.$skipOrm=false] - Skip ORM mapping
     * @returns {*}
     */ async findOne_(findOptions) {
        const rawOptions = findOptions;
        findOptions = this._prepareQueries(findOptions, true);
        const context = {
            op: 'find',
            options: findOptions,
            connOptions
        };
        await _entityFeatures.default.applyRules_(_Rules.default.RULE_BEFORE_FIND, this, context);
        const result = await this._safeExecute_(async (context)=>{
            let records = await this._db.connector.find_(this._meta.name, context.options, context.connOptions);
            if (!records) throw new _types.DatabaseError('connector.find_() returns undefined data record.');
            if (rawOptions && rawOptions.$retrieveDbResult) {
                rawOptions.$result = records.slice(1);
            }
            if (findOptions.$relationships && !findOptions.$skipOrm) {
                // rows, coloumns, aliasMap
                if (records[0].length === 0) return undefined;
                records = this._mapRecordsToObjects(records, findOptions.$relationships, findOptions.$nestedKeyGetter);
            } else if (records.length === 0) {
                return undefined;
            }
            if (records.length !== 1) {
                this._db.connector.log('error', `findOne() returns more than one record.`, {
                    entity: this._meta.name,
                    options: context.options
                });
            }
            const result = records[0];
            return result;
        }, context);
        if (findOptions.$transformer) {
            return JES.evaluate(result, findOptions.$transformer);
        }
        return result;
    }
    /**
     * Find records matching the condition, returns an array of records.
     * @param {object} [findOptions] - findOptions
     * @property {object} [findOptions.$association] - Joinings
     * @property {object} [findOptions.$projection] - Selected fields
     * @property {object} [findOptions.$transformer] - Transform fields before returning
     * @property {object} [findOptions.$where] - Extra condition
     * @property {object} [findOptions.$groupBy] - Group by fields
     * @property {object} [findOptions.$orderBy] - Order by fields
     * @property {number} [findOptions.$offset] - Offset
     * @property {number} [findOptions.$limit] - Limit
     * @property {number} [findOptions.$totalCount] - Return totalCount
     * @property {bool} [findOptions.$includeDeleted=false] - Include those marked as logical deleted.
     * @param {object} [connOptions]
     * @property {object} [connOptions.connection]
     * @returns {array}
     */ async findMany_(findOptions, connOptions1) {
        const rawOptions = findOptions;
        findOptions = this._prepareQueries(findOptions);
        const context = {
            op: 'find',
            options: findOptions,
            connOptions: connOptions1
        };
        await _entityFeatures.default.applyRules_(_Rules.default.RULE_BEFORE_FIND, this, context);
        let totalCount;
        let rows = await this._safeExecute_(async (context)=>{
            let records = await this._db.connector.find_(this._meta.name, context.options, context.connOptions);
            if (!records) throw new _types.DatabaseError('connector.find_() returns undefined data record.');
            if (rawOptions && rawOptions.$retrieveDbResult) {
                rawOptions.$result = records.slice(1);
            }
            if (findOptions.$relationships) {
                if (findOptions.$totalCount) {
                    totalCount = records[3];
                }
                if (!findOptions.$skipOrm) {
                    records = this._mapRecordsToObjects(records, findOptions.$relationships, findOptions.$nestedKeyGetter);
                } else {
                    records = records[0];
                }
            } else {
                if (findOptions.$totalCount) {
                    totalCount = records[1];
                    records = records[0];
                } else if (findOptions.$skipOrm) {
                    records = records[0];
                }
            }
            return this.afterFindAll_(context, records);
        }, context);
        if (findOptions.$transformer) {
            rows = rows.map((row)=>JES.evaluate(row, findOptions.$transformer));
        }
        if (findOptions.$totalCount) {
            const ret = {
                totalItems: totalCount,
                items: rows
            };
            if (!isNothing(findOptions.$offset)) {
                ret.offset = findOptions.$offset;
            }
            if (!isNothing(findOptions.$limit)) {
                ret.limit = findOptions.$limit;
            }
            return ret;
        }
        return rows;
    }
    /**
     * Regenerate creation data and try again if duplicate record exists
     * @param {Function} dataGenerator_
     * @param {Object} connOptions
     */ async retryCreateOnDuplicate_(dataGenerator_, maxRery, createOptions, connOptions1) {
        let counter = 0;
        let errorRet;
        maxRery || (maxRery = 10);
        while(counter++ < maxRery){
            const data = await dataGenerator_();
            try {
                return await this.create_(data, createOptions, connOptions1);
            } catch (error) {
                if (error.code !== 'E_DUPLICATE') {
                    throw error;
                }
                errorRet = error;
            }
        }
        return errorRet;
    }
    /**
     * Create a new entity with given data.
     * @param {object} data - Entity data
     * @param {object} [createOptions] - Create options
     * @property {bool} [createOptions.$retrieveCreated=false] - Retrieve the newly created record from db.
     * @property {bool} [createOptions.$upsert=false] - If already exist, just update the record.
     * @param {object} [connOptions]
     * @property {object} [connOptions.connection]
     * @returns {EntityModel}
     */ async create_(data, createOptions, connOptions1) {
        const rawOptions = createOptions;
        if (!createOptions) {
            createOptions = {};
        }
        let [raw, associations, references] = this._extractAssociations(data, true);
        const context = {
            op: 'create',
            raw,
            rawOptions,
            options: createOptions,
            connOptions: connOptions1
        };
        if (!await this.beforeCreate_(context)) {
            return context.return;
        }
        const success = await this._safeExecute_(async (context)=>{
            if (!(0, _utils.isEmpty)(references)) {
                await this.ensureTransaction_(context);
                await this._populateReferences_(context, references);
            }
            let needCreateAssocs = !(0, _utils.isEmpty)(associations);
            if (needCreateAssocs) {
                await this.ensureTransaction_(context);
                associations = await this._createAssocs_(context, associations, true);
                // check any other associations left
                needCreateAssocs = !(0, _utils.isEmpty)(associations);
            }
            await this._prepareEntityData_(context);
            if (!await _entityFeatures.default.applyRules_(_Rules.default.RULE_BEFORE_CREATE, this, context)) {
                return false;
            }
            if (!await this._internalBeforeCreate_(context)) {
                return false;
            }
            if (!context.options.$dryRun) {
                if (context.options.$upsert) {
                    const dataForUpdating = _utils._.pick(context.latest, Object.keys(context.raw)); // only update the raw part    
                    context.result = await this._db.connector.upsertOne_(this._meta.name, dataForUpdating, this.getUniqueKeyFieldsFrom(context.latest), context.connOptions, context.latest);
                } else {
                    context.result = await this._db.connector.create_(this._meta.name, context.latest, context.connOptions);
                }
                this._fillResult(context);
            } else {
                context.return = context.latest;
                context.result = {
                    insertId: context.latest[this._meta.keyField],
                    affectedRows: 1
                };
            }
            if (needCreateAssocs) {
                await this._createAssocs_(context, associations);
            }
            await this._internalAfterCreate_(context);
            if (!context.queryKey) {
                context.queryKey = this.getUniqueKeyValuePairsFrom(context.latest);
            }
            await _entityFeatures.default.applyRules_(_Rules.default.RULE_AFTER_CREATE, this, context);
            return true;
        }, context);
        if (success && !context.options.$dryRun) {
            await this.afterCreate_(context);
        }
        return context.return;
    }
    /**
     * Update an existing entity with given data.
     * @param {object} data - Entity data with at least one unique key (pair) given
     * @param {object} [updateOptions] - Update options
     * @property {object} [updateOptions.$where] - Extra condition
     * @property {bool} [updateOptions.$retrieveUpdated=false] - Retrieve the updated entity from database
     * @param {object} [connOptions]
     * @property {object} [connOptions.connection]
     * @returns {object}
     */ async updateOne_(data, updateOptions, connOptions1) {
        return this._update_(data, updateOptions, connOptions1, true);
    }
    /**
     * Update many existing entites with given data.
     * @param {*} data
     * @param {*} updateOptions
     * @param {*} connOptions
     */ async updateMany_(data, updateOptions, connOptions1) {
        return this._update_(data, updateOptions, connOptions1, false);
    }
    async _update_(data, updateOptions, connOptions1, forSingleRecord) {
        const rawOptions = updateOptions;
        if (!updateOptions) {
            // if no condition given, extract from data
            const conditionFields = this.getUniqueKeyFieldsFrom(data);
            if ((0, _utils.isEmpty)(conditionFields)) {
                throw new _types.InvalidArgument('Primary key value(s) or at least one group of unique key value(s) is required for updating an entity.', {
                    entity: this._meta.name,
                    data
                });
            }
            updateOptions = {
                $where: _utils._.pick(data, conditionFields)
            };
            data = _utils._.omit(data, conditionFields);
        }
        // see if there is associated entity data provided together
        let [raw, associations, references] = this._extractAssociations(data);
        const context = {
            op: 'update',
            raw,
            rawOptions,
            options: this._prepareQueries(updateOptions, forSingleRecord /* for single record */ ),
            connOptions: connOptions1,
            forSingleRecord
        };
        // see if there is any runtime feature stopping the update
        let toUpdate;
        if (forSingleRecord) {
            toUpdate = await this.beforeUpdate_(context);
        } else {
            toUpdate = await this.beforeUpdateMany_(context);
        }
        if (!toUpdate) {
            return context.return;
        }
        const success = await this._safeExecute_(async (context)=>{
            if (!(0, _utils.isEmpty)(references)) {
                await this.ensureTransaction_(context);
                await this._populateReferences_(context, references);
            }
            let needUpdateAssocs = !(0, _utils.isEmpty)(associations);
            let doneUpdateAssocs;
            if (needUpdateAssocs) {
                await this.ensureTransaction_(context);
                associations = await this._updateAssocs_(context, associations, true, forSingleRecord);
                needUpdateAssocs = !(0, _utils.isEmpty)(associations);
                doneUpdateAssocs = true;
            }
            await this._prepareEntityData_(context, true, forSingleRecord);
            if (!await _entityFeatures.default.applyRules_(_Rules.default.RULE_BEFORE_UPDATE, this, context)) {
                return false;
            }
            if (forSingleRecord) {
                toUpdate = await this._internalBeforeUpdate_(context);
            } else {
                toUpdate = await this._internalBeforeUpdateMany_(context);
            }
            if (!toUpdate) {
                return false;
            }
            const { $where, ...otherOptions } = context.options;
            if ((0, _utils.isEmpty)(context.latest)) {
                if (!doneUpdateAssocs && !needUpdateAssocs) {
                    throw new _types.InvalidArgument('Cannot do the update with empty record. Entity: ' + this._meta.name);
                }
            } else {
                if (needUpdateAssocs && !hasValueIn([
                    $where,
                    context.latest
                ], this._meta.keyField) && !otherOptions.$retrieveUpdated) {
                    // has associated data depending on this record
                    // should ensure the latest result will contain the key of this record
                    otherOptions.$retrieveUpdated = true;
                }
                if (forSingleRecord && !otherOptions.$limit) {
                    otherOptions.$limit = 1;
                }
                context.result = await this._db.connector.update_(this._meta.name, context.latest, $where, otherOptions, context.connOptions);
                context.return = context.latest;
            }
            if (forSingleRecord) {
                await this._internalAfterUpdate_(context);
                if (!context.queryKey) {
                    context.queryKey = this.getUniqueKeyValuePairsFrom($where);
                }
            } else {
                await this._internalAfterUpdateMany_(context);
            }
            await _entityFeatures.default.applyRules_(_Rules.default.RULE_AFTER_UPDATE, this, context);
            if (needUpdateAssocs) {
                await this._updateAssocs_(context, associations, false, forSingleRecord);
            }
            return true;
        }, context);
        if (success && !context.options.$dryRun) {
            if (forSingleRecord) {
                await this.afterUpdate_(context);
            } else {
                await this.afterUpdateMany_(context);
            }
        }
        return context.return;
    }
    /**
     * Update an existing entity with given data, or create one if not found.
     * @param {*} data
     * @param {*} updateOptions
     * @param {*} connOptions
     */ async replaceOne_(data, updateOptions, connOptions1) {
        const rawOptions = updateOptions;
        if (!updateOptions) {
            const conditionFields = this.getUniqueKeyFieldsFrom(data);
            if ((0, _utils.isEmpty)(conditionFields)) {
                throw new _types.InvalidArgument('Primary key value(s) or at least one group of unique key value(s) is required for replacing an entity.', {
                    entity: this._meta.name,
                    data
                });
            }
            updateOptions = {
                ...updateOptions,
                $where: _utils._.pick(data, conditionFields)
            };
        } else {
            updateOptions = this._prepareQueries(updateOptions, true);
        }
        const context = {
            op: 'replace',
            raw: data,
            rawOptions,
            options: updateOptions,
            connOptions: connOptions1
        };
        return this._safeExecute_(async (context)=>{
            return this._doReplaceOne_(context); // different dbms has different replacing strategy
        }, context);
    }
    /**
     * Remove an existing entity with given data.
     * @param {object} [deleteOptions] - Update options
     * @property {object} [deleteOptions.$where] - Extra condition
     * @property {bool} [deleteOptions.$retrieveDeleted=false] - Retrieve the deleted entity from database
     * @property {bool} [deleteOptions.$physicalDeletion=false] - When $physicalDeletion = true, deletetion will not take into account logicaldeletion feature
     * @param {object} [connOptions]
     * @property {object} [connOptions.connection]
     */ async deleteOne_(deleteOptions, connOptions1) {
        return this._delete_(deleteOptions, connOptions1, true);
    }
    /**
     * Remove an existing entity with given data.
     * @param {object} [deleteOptions] - Update options
     * @property {object} [deleteOptions.$where] - Extra condition
     * @property {bool} [deleteOptions.$retrieveDeleted=false] - Retrieve the deleted entity from database
     * @property {bool} [deleteOptions.$physicalDeletion=false] - When $physicalDeletion = true, deletetion will not take into account logicaldeletion feature
     * @property {bool} [deleteOptions.$deleteAll=false] - When $deleteAll = true, the operation will proceed even empty condition is given
     * @param {object} [connOptions]
     * @property {object} [connOptions.connection]
     */ async deleteMany_(deleteOptions, connOptions1) {
        return this._delete_(deleteOptions, connOptions1, false);
    }
    async deleteAll_(connOptions1) {
        return this.deleteMany_({
            $deleteAll: true
        }, connOptions1);
    }
    /**
     * Remove an existing entity with given data.
     * @param {object} [deleteOptions] - Update options
     * @property {object} [deleteOptions.$where] - Extra condition
     * @property {bool} [deleteOptions.$retrieveDeleted=false] - Retrieve the deleted entity from database
     * @property {bool} [deleteOptions.$physicalDeletion=false] - When $physicalDeletion = true, deletetion will not take into account logicaldeletion feature
     * @param {object} [connOptions]
     * @property {object} [connOptions.connection]
     */ async _delete_(deleteOptions, connOptions1, forSingleRecord) {
        const rawOptions = deleteOptions;
        deleteOptions = this._prepareQueries(deleteOptions, forSingleRecord /* for single record */ );
        if ((0, _utils.isEmpty)(deleteOptions.$where) && (forSingleRecord || !deleteOptions.$deleteAll)) {
            throw new _types.InvalidArgument('Empty condition is not allowed for deleting or add { $deleteAll: true } to delete all records.', {
                entity: this._meta.name,
                deleteOptions
            });
        }
        const context = {
            op: 'delete',
            rawOptions,
            options: deleteOptions,
            connOptions: connOptions1,
            forSingleRecord
        };
        let toDelete;
        if (forSingleRecord) {
            toDelete = await this.beforeDelete_(context);
        } else {
            toDelete = await this.beforeDeleteMany_(context);
        }
        if (!toDelete) {
            return context.return;
        }
        const deletedCount = await this._safeExecute_(async (context)=>{
            if (!await _entityFeatures.default.applyRules_(_Rules.default.RULE_BEFORE_DELETE, this, context)) {
                return false;
            }
            if (forSingleRecord) {
                toDelete = await this._internalBeforeDelete_(context);
            } else {
                toDelete = await this._internalBeforeDeleteMany_(context);
            }
            if (!toDelete) {
                return false;
            }
            const { $where, ...otherOptions } = context.options;
            context.result = await this._db.connector.delete_(this._meta.name, $where, otherOptions, context.connOptions);
            if (forSingleRecord) {
                await this._internalAfterDelete_(context);
            } else {
                await this._internalAfterDeleteMany_(context);
            }
            if (!context.queryKey) {
                if (forSingleRecord) {
                    context.queryKey = this.getUniqueKeyValuePairsFrom(context.options.$where);
                } else {
                    context.queryKey = context.options.$where;
                }
            }
            await _entityFeatures.default.applyRules_(_Rules.default.RULE_AFTER_DELETE, this, context);
            return this._db.connector.deletedCount(context);
        }, context);
        if (deletedCount && !context.options.$dryRun) {
            if (forSingleRecord) {
                await this.afterDelete_(context);
            } else {
                await this.afterDeleteMany_(context);
            }
        }
        return context.return || deletedCount;
    }
    /**
     * Check whether a data record contains primary key or at least one unique key pair.
     * @param {object} data
     */ _containsUniqueKey(data) {
        let hasKeyName = false;
        const hasNotNullKey = _utils._.find(this._meta.uniqueKeys, (fields)=>{
            const hasKeys = _utils._.every(fields, (f)=>f in data);
            hasKeyName = hasKeyName || hasKeys;
            return _utils._.every(fields, (f)=>data[f] != null);
        });
        return [
            hasNotNullKey,
            hasKeyName
        ];
    }
    /**
     * Ensure the condition contains one of the unique keys.
     * @param {*} condition
     */ _ensureContainsUniqueKey(condition) {
        const [containsUniqueKeyAndValue, containsUniqueKeyName] = this._containsUniqueKey(condition);
        if (!containsUniqueKeyAndValue) {
            if (containsUniqueKeyName) {
                throw new ValidationError('One of the unique key field as query condition is null. Condition: ' + JSON.stringify(condition));
            }
            throw new _types.InvalidArgument('Single record operation requires at least one unique key value pair in the query condition.', {
                entity: this._meta.name,
                condition
            });
        }
    }
    /**
     * Prepare valid and sanitized entity data for sending to database.
     * @param {object} context - Operation context.
     * @property {object} context.raw - Raw input data.
     * @property {object} [context.connOptions]
     * @param {bool} isUpdating - Flag for updating existing entity.
     */ async _prepareEntityData_(context, isUpdating = false, forSingleRecord = true) {
        const meta = this._meta;
        const i18n = this.i18n;
        const { name, fields } = meta;
        let { raw } = context;
        let latest = {};
        // returned by $retrieveExisting
        let existing = context.options.$existing;
        context.latest = latest;
        if (!context.i18n) {
            context.i18n = i18n;
        }
        const opOptions = context.options;
        if (opOptions.$upsert && typeof opOptions.$upsert === 'object') {
            raw = {
                ...raw,
                ...opOptions.$upsert
            };
        }
        if (isUpdating && (0, _utils.isEmpty)(existing) && (this._dependsOnExistingData(raw) || opOptions.$retrieveExisting)) {
            await this.ensureTransaction_(context);
            if (forSingleRecord) {
                existing = await this.findOne_({
                    $where: opOptions.$where
                }, context.connOptions);
            } else {
                existing = await this.findAll_({
                    $where: opOptions.$where
                }, context.connOptions);
            }
            context.existing = existing;
        }
        if (opOptions.$retrieveExisting && !context.rawOptions.$existing) {
            context.rawOptions.$existing = existing;
        }
        await _entityFeatures.default.applyRules_(_Rules.default.RULE_BEFORE_VALIDATION, this, context);
        await (0, _utils.eachAsync_)(fields, async (fieldInfo, fieldName)=>{
            let value;
            let useRaw = false;
            if (fieldName in raw) {
                value = raw[fieldName];
                useRaw = true;
            } else if (fieldName in latest) {
                value = latest[fieldName];
            }
            if (typeof value !== 'undefined') {
                // field value given in raw data
                if (fieldInfo.readOnly && useRaw) {
                    if (!opOptions.$migration && (!opOptions.$bypassReadOnly || !opOptions.$bypassReadOnly.has(fieldName))) {
                        // read only, not allow to set by input value
                        throw new ValidationError(`Read-only field "${fieldName}" is not allowed to be set by manual input.`, {
                            entity: name,
                            fieldInfo: fieldInfo
                        });
                    }
                }
                if (isUpdating && fieldInfo.freezeAfterNonDefault) {
                    if (!existing) {
                        throw new Error('"freezeAfterNonDefault" qualifier requires existing data.');
                    }
                    if (existing[fieldName] !== fieldInfo.default) {
                        // freezeAfterNonDefault, not allow to change if value is non-default
                        throw new ValidationError(`FreezeAfterNonDefault field "${fieldName}" is not allowed to be changed.`, {
                            entity: name,
                            fieldInfo: fieldInfo
                        });
                    }
                }
                /**  todo: fix dependency, check writeProtect 
                if (isUpdating && fieldInfo.writeOnce) {     
                    assert: existing, '"writeOnce" qualifier requires existing data.';
                    if (!_.isNil(existing[fieldName])) {
                        throw new ValidationError(`Write-once field "${fieldName}" is not allowed to be update once it was set.`, {
                            entity: name,
                            fieldInfo: fieldInfo 
                        });
                    }
                } */ // sanitize first
                if (isNothing(value)) {
                    if (fieldInfo.default) {
                        // has default setting in meta data
                        latest[fieldName] = fieldInfo.default;
                    } else if (!fieldInfo.optional) {
                        throw new ValidationError(`The "${fieldName}" value of "${name}" entity cannot be null.`, {
                            entity: name,
                            fieldInfo: fieldInfo
                        });
                    } else {
                        latest[fieldName] = null;
                    }
                } else {
                    if ((0, _utils.isPlainObject)(value) && value.$xr) {
                        latest[fieldName] = value;
                        return;
                    }
                    try {
                        latest[fieldName] = _allSync.Types.sanitize(value, fieldInfo, i18n);
                    } catch (error) {
                        throw new ValidationError(`Invalid "${fieldName}" value of "${name}" entity.`, {
                            entity: name,
                            fieldInfo: fieldInfo,
                            value,
                            error: error.stack
                        });
                    }
                }
                return;
            }
            // not given in raw data
            if (isUpdating) {
                if (fieldInfo.forceUpdate) {
                    // has force update policy, e.g. updateTimestamp
                    if (fieldInfo.updateByDb || fieldInfo.hasActivator) {
                        return;
                    }
                    // require generator to refresh auto generated value
                    if (fieldInfo.auto) {
                        latest[fieldName] = await Generators.default(fieldInfo, i18n);
                        return;
                    }
                    throw new ValidationError(`Field "${fieldName}" of "${name}" entity is required for each update.`, {
                        entity: name,
                        fieldInfo: fieldInfo
                    });
                }
                return;
            }
            // new record
            if (!fieldInfo.createByDb) {
                if ('default' in fieldInfo) {
                    // has default setting in meta data
                    latest[fieldName] = fieldInfo.default;
                } else if (fieldInfo.optional) {
                // ignore
                } else if (fieldInfo.auto) {
                    // automatically generated
                    latest[fieldName] = await Generators.default(fieldInfo, i18n);
                } else if (!fieldInfo.hasActivator) {
                    // skip those have activators
                    throw new ValidationError(`Field "${fieldName}" of "${name}" entity is required.`, {
                        entity: name,
                        fieldInfo: fieldInfo,
                        raw
                    });
                }
            } // else default value set by database or by rules
        });
        latest = context.latest = this._translateValue(latest, opOptions.$variables, true);
        await _entityFeatures.default.applyRules_(_Rules.default.RULE_AFTER_VALIDATION, this, context);
        if (!opOptions.$skipModifiers) {
            await this.applyModifiers_(context, isUpdating);
        }
        // final round process before entering database
        context.latest = _utils._.mapValues(latest, (value, key)=>{
            if (value == null) return value;
            if ((0, _utils.isPlainObject)(value) && value.$xr) {
                // there is special input column which maybe a function or an expression
                opOptions.$requireSplitColumns = true;
                return value;
            }
            const fieldInfo = fields[key];
            return this._serializeByTypeInfo(value, fieldInfo);
        });
        return context;
    }
    /**
     * Ensure commit or rollback is called if transaction is created within the executor.
     * @param {*} executor
     * @param {*} context
     */ async _safeExecute_(executor, context) {
        executor = executor.bind(this);
        if (context.connOptions && context.connOptions.connection) {
            return executor(context);
        }
        try {
            const result = await executor(context);
            // if the executor have initiated a transaction
            if (context.connOptions && context.connOptions.connection) {
                await this._db.connector.commit_(context.connOptions.connection);
                delete context.connOptions.connection;
            }
            return result;
        } catch (error) {
            // we have to rollback if error occurred in a transaction
            if (context.connOptions && context.connOptions.connection) {
                this._db.connector.log('error', `Rollbacked, reason: ${error.message}`, {
                    entity: this._meta.name,
                    context: context.options,
                    rawData: context.raw,
                    latestData: context.latest
                });
                await this._db.connector.rollback_(context.connOptions.connection);
                delete context.connOptions.connection;
            }
            throw error;
        }
    }
    _dependencyChanged(fieldName, context) {
        if (this._meta.fieldDependencies) {
            const deps = this._meta.fieldDependencies[fieldName];
            return _utils._.find(deps, (d)=>(0, _utils.isPlainObject)(d) ? d.reference !== fieldName && _utils._.hasIn(context, d.reference) : _utils._.hasIn(context, d));
        }
        return false;
    }
    _referenceExist(input, ref) {
        const pos = ref.indexOf('.');
        if (pos > 0) {
            return ref.substr(pos + 1) in input;
        }
        return ref in input;
    }
    _dependsOnExistingData(input) {
        // check modifier dependencies
        const deps = this._meta.fieldDependencies;
        let hasDepends = false;
        if (deps) {
            const nullDepends = new Set();
            hasDepends = _utils._.find(deps, (dep, fieldName)=>_utils._.find(dep, (d)=>{
                    if ((0, _utils.isPlainObject)(d)) {
                        if (d.whenNull) {
                            if (_utils._.isNil(input[fieldName])) {
                                nullDepends.add(dep);
                            }
                            return false;
                        }
                        if (d.reference === fieldName) return false;
                        d = d.reference;
                    }
                    return fieldName in input && !this._referenceExist(input, d) || this._referenceExist(input, d) && !(fieldName in input);
                }));
            if (hasDepends) {
                return true;
            }
            for (const dep of nullDepends){
                if (_utils._.find(dep, (d)=>!this._referenceExist(input, d.reference))) {
                    return true;
                }
            }
        }
        // check by special rules
        const atLeastOneNotNull = this._meta.features.atLeastOneNotNull;
        if (atLeastOneNotNull) {
            hasDepends = _utils._.find(atLeastOneNotNull, (fields)=>_utils._.find(fields, (field)=>field in input && _utils._.isNil(input[field])));
            if (hasDepends) {
                return true;
            }
        }
        return false;
    }
    _hasReservedKeys(obj) {
        return _utils._.find(obj, (v, k)=>k[0] === '$');
    }
    /**
     * Normalize options including moving entries with key not starting with '$' into $where, interpolating variables and building relationship structure.
     * @param {object} options 
     * @param {boolean} [forSingleRecord=false]
     * @returns {object}
     */ _prepareQueries(options, forSingleRecord = false) {
        if (!(0, _utils.isPlainObject)(options)) {
            if (forSingleRecord && options == null) {
                throw new _types.InvalidArgument('Primary key value or at least one unique key value pair is required for single record operation.', {
                    entity: this._meta.name
                });
            }
            // in this case, options is the value of primary key, check for combined primary key
            if (Array.isArray(this._meta.keyField)) {
                throw new _types.InvalidArgument('Cannot use a singular value as condition to query against an entity with combined primary key.', {
                    entity: this._meta.name,
                    keyFields: this._meta.keyField
                });
            }
            // single key
            return options != null ? {
                $where: {
                    [this._meta.keyField]: this._translateValue(options)
                }
            } : {};
        }
        const normalizedOptions = {
            $key: this._meta.keyField
        };
        const query = {};
        // move non-reserved keys to $where
        _utils._.forOwn(options, (v, k)=>{
            if (k[0] === '$') {
                normalizedOptions[k] = v;
            } else {
                query[k] = v;
            }
        });
        normalizedOptions.$where = {
            ...query,
            ...normalizedOptions.$where
        };
        if (forSingleRecord && !options.$skipUniqueCheck) {
            this._ensureContainsUniqueKey(normalizedOptions.$where);
        }
        normalizedOptions.$where = this._translateValue(normalizedOptions.$where, normalizedOptions.$variables, null, true);
        if (normalizedOptions.$groupBy) {
            if ((0, _utils.isPlainObject)(normalizedOptions.$groupBy)) {
                if (normalizedOptions.$groupBy.having) {
                    normalizedOptions.$groupBy.having = this._translateValue(normalizedOptions.$groupBy.having, normalizedOptions.$variables, null, true);
                }
            }
        }
        if (normalizedOptions.$select) {
            normalizedOptions.$select = this._translateValue(normalizedOptions.$select, normalizedOptions.$variables);
        }
        if (normalizedOptions.$relation && !normalizedOptions.$relationships) {
            normalizedOptions.$relationships = this._prepareAssociations(normalizedOptions);
        }
        return normalizedOptions;
    }
    /**
     * Pre create processing, return false to stop upcoming operation.
     * @param {*} context
     */ static async beforeCreate_(context) {
        return true;
    }
    /**
     * Pre update processing, return false to stop upcoming operation.
     * @param {*} context
     */ static async beforeUpdate_(context) {
        return true;
    }
    /**
     * Pre update processing, multiple records, return false to stop upcoming operation.
     * @param {*} context
     */ static async beforeUpdateMany_(context) {
        return true;
    }
    /**
     * Pre delete processing, return false to stop upcoming operation.
     * @param {*} context
     */ static async beforeDelete_(context) {
        return true;
    }
    /**
     * Pre delete processing, multiple records, return false to stop upcoming operation.
     * @param {*} context
     */ static async beforeDeleteMany_(context) {
        return true;
    }
    /**
     * Post create processing.
     * @param {*} context
     */ static async afterCreate_(context) {}
    /**
     * Post update processing.
     * @param {*} context
     */ static async afterUpdate_(context) {}
    /**
     * Post update processing, multiple records
     * @param {*} context
     */ static async afterUpdateMany_(context) {}
    /**
     * Post delete processing.
     * @param {*} context
     */ static async afterDelete_(context) {}
    /**
     * Post delete processing, multiple records
     * @param {*} context
     */ static async afterDeleteMany_(context) {}
    /**
     * Post findAll processing
     * @param {*} context
     * @param {*} records
     */ static async afterFindAll_(context, records) {
        if (context.options.$toDictionary) {
            let keyField = this._meta.keyField;
            if (typeof context.options.$toDictionary === 'string') {
                keyField = context.options.$toDictionary;
                if (!(keyField in this._meta.fields)) {
                    throw new _types.InvalidArgument(`The key field "${keyField}" provided to index the cached dictionary is not a field of entity "${this._meta.name}".`, {
                        entity: this._meta.name,
                        inputKeyField: keyField
                    });
                }
            }
            return this.toDictionary(records, keyField);
        }
        return records;
    }
    _prepareAssociations() {
        throw new Error(NEED_OVERRIDE);
    }
    _mapRecordsToObjects() {
        throw new Error(NEED_OVERRIDE);
    }
    _extractAssociations(data) {
        throw new Error(NEED_OVERRIDE);
    }
    // will update context.raw if applicable
    async _populateReferences_(context, references) {
        throw new Error(NEED_OVERRIDE);
    }
    // will update context.raw if applicable
    async _createAssocs_(context, assocs) {
        throw new Error(NEED_OVERRIDE);
    }
    async _updateAssocs_(context, assocs) {
        throw new Error(NEED_OVERRIDE);
    }
    _translateSymbolToken(name) {
        throw new Error(NEED_OVERRIDE);
    }
    _serializeByTypeInfo(value, info) {
        throw new Error(NEED_OVERRIDE);
    }
    /**
     * Automatically fetch variables by $xr
     * @param {*} value 
     * @param {*} variables 
     * @param {*} skipTypeCast 
     * @param {*} arrayToInOperator - Convert an array value to { $in: array }
     * @returns 
     */ _translateValue(value, variables, skipTypeCast, arrayToInOperator) {
        if ((0, _utils.isPlainObject)(value)) {
            if (value.$xr) {
                if ($xrsToBypass.has(value.$xr)) return value;
                if (value.$xr === 'SessionVariable') {
                    if (!variables) {
                        throw new _types.InvalidArgument('Variables context missing.', {
                            entity: this._meta.name
                        });
                    }
                    if ((!variables.session || !(value.name in variables.session)) && !value.optional) {
                        const errArgs = [];
                        if (value.missingMessage) {
                            errArgs.push(value.missingMessage);
                        }
                        if (value.missingStatus) {
                            errArgs.push(value.missingStatus || HttpCode.BAD_REQUEST);
                        }
                        throw new ValidationError(...errArgs);
                    }
                    return variables.session[value.name];
                } else if (value.$xr === 'QueryVariable') {
                    if (!variables) {
                        throw new _types.InvalidArgument('Variables context missing.', {
                            entity: this._meta.name
                        });
                    }
                    if (!variables.query || !(value.name in variables.query)) {
                        throw new _types.InvalidArgument(`Query parameter "${value.name}" in configuration not found.`, {
                            entity: this._meta.name
                        });
                    }
                    return variables.query[value.name];
                } else if (value.$xr === 'SymbolToken') {
                    return this._translateSymbolToken(value.name);
                }
                throw new Error('Not implemented yet. ' + value.$xr);
            }
            return _utils._.mapValues(value, (v, k)=>this._translateValue(v, variables, skipTypeCast, arrayToInOperator && k[0] !== '$'));
        }
        if (Array.isArray(value)) {
            const ret = value.map((v)=>this._translateValue(v, variables, skipTypeCast, arrayToInOperator));
            return arrayToInOperator ? {
                $in: ret
            } : ret;
        }
        if (skipTypeCast) return value;
        return this._db.connector.typeCast(value);
    }
    /**
     * @param {Object} [rawData] - Raw data object
     */ constructor(db){
        this._db = db;
        this._meta = this.constructor.meta;
    }
}
const _default = EntityModel;

//# sourceMappingURL=EntityModel.js.map