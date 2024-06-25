import { ApplicationError, InvalidArgument, ValidationError, HttpCode } from '@kitmi/types';
import { _, eachAsync_, isPlainObject, isEmpty, get as _get } from '@kitmi/utils';
import typeSystem, { Types } from '@kitmi/validators/allSync';
import Features from './entityFeatures';
import Rules from './Rules';
import defaultGenerator from './TypeGenerators';
import { hasValueInAny } from './helpers';
import { OpCompleted } from './utils/errors';

const featureRules = _.reduce(
    Features,
    (acc, feature, name) => {
        _.each(feature, (action, rule) => {
            acc[name + '.' + rule] = action;
        });
        return acc;
    },
    {}
);

const NEED_OVERRIDE = 'Should be overrided by driver-specific subclass.';

function minifyAssocs(assocs) {
    const sorted = _.uniq(assocs).sort().reverse();

    const minified = _.take(sorted, 1);
    const l = sorted.length - 1;

    for (let i = 1; i < l; i++) {
        const k = sorted[i] + '.';

        if (!_.find(minified, (a) => a.startsWith(k))) {
            minified.push(sorted[i]);
        }
    }

    return minified;
}

/**
 * Base entity model class.
 * @class
 */
class EntityModel {
    /**
     * @param {Object} [rawData] - Raw data object
     */
    constructor(db) {
        this.db = db;
    }

    get meta() {
        return this.constructor.meta;
    }

    /**
     * Get the value of key field/fields from data.
     * @param {object} data
     * @returns {*}
     */
    valueOfKey(data) {
        return Array.isArray(this.meta.keyField) ? _.pick(data, this.meta.keyField) : data[this.meta.keyField];
    }

    /**
     * Get a field schema based on the metadata of the field.
     * @param {string} name - Field name
     * @param {object} [extra] - Extra schema options
     * @return {object|array} Schema object
     */
    fieldSchema(name, extra) {
        const meta = this.meta.fields[name];
        if (!meta) {
            throw new InvalidArgument(`Unknown field "${name}" of entity "${this.meta.name}".`);
        }

        const schema = _.omit(meta, ['default', 'optional']);

        if (extra) {
            const { $addEnumValues, $orAsArray, ...others } = extra;
            let arrayElem = schema;

            if ($orAsArray) {
                arrayElem = { ...schema, ...others };
            }

            if (meta.type === Types.ENUM.name && $addEnumValues) {
                schema.values = schema.values.concat($addEnumValues);
            }

            Object.assign(schema, others);

            if ($orAsArray) {
                return [
                    schema,
                    {
                        type: 'array',
                        elementSchema: arrayElem,
                    },
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
     */
    inputSchema(inputSetName, options) {
        const key = inputSetName + (options == null ? '{}' : JSON.stringify(options));

        if (this._cachedSchema) {
            const cache = this._cachedSchema[key];
            if (cache) {
                return cache;
            }
        } else {
            this._cachedSchema = {};
        }

        const schemaGenerator = this.db.require(`inputs/${this.meta.name}-${inputSetName}`);

        return (this._cachedSchema[key] = schemaGenerator(options));
    }

    /**
     * Helper to combine explicit required associations and associations required by query fields or projection fields.
     * @param {array} [fields]
     * @param {array} [extraArray]
     * @returns {Array}
     */
    assocFrom(fields, extraArray) {
        const result = new Set(extraArray ?? []);

        if (fields) {
            fields.forEach((keyPath) => {
                const keyNodes = keyPath.split('.');
                if (keyNodes.length > 1) {
                    const assoc = keyNodes
                        .slice(0, -1)
                        .map((p) => (p.startsWith(':') ? p.substring(1) : p))
                        .join('.');
                    result.add(assoc);
                }
            });
        }

        return Array.from(result);
    }

    /**
     * Get related entity model by anchor.
     * @param {string} anchor
     * @returns {EntityModel}
     */
    getRalatedEntity(anchor) {
        const assocInfo = this.meta.associations[anchor];
        if (!assocInfo) {
            throw new InvalidArgument(`Unknown association "${anchor}" of entity "${this.meta.name}".`);
        }

        return this.db.entity(assocInfo.entity);
    }

    /**
     * Get chained related entity model by dot-separated name path.
     * @param {*} dotPath
     * @returns {EntityModel}
     */
    getChainedRelatedEntity(dotPath) {
        Array.isArray(dotPath) || (dotPath = dotPath.split('.'));
        let base = this;

        while (dotPath.length) {
            base = base.getRalatedEntity(dotPath.shift());
        }

        return base;
    }

    /**
     * Get field names array of a unique key from input data.
     * @param {object} data - Input data.
     */
    getUniqueKeyFieldsFrom(data) {
        return _.find(this.meta.uniqueKeys, (fields) => _.every(fields, (f) => data[f] != null));
    }

    /**
     * Get key-value pairs of a unique key from input data.
     * @param {object} data - Input data.
     */
    getUniqueKeyValuePairsFrom(data) {
        const ukFields = this.getUniqueKeyFieldsFrom(data);
        return _.pick(data, ukFields);
    }

    /**
     * Ensure context.latest be the just created entity.
     * @param {*} context
     * @param {*} customOptions
     */
    ensureRetrieveCreated(context, customOptions) {
        if (!context.options.$getCreated) {
            context.options.$getCreated = customOptions || true;
        }
    }

    /**
     * Ensure context.latest be the just updated entity.
     * @param {*} context
     * @param {*} customOptions
     */
    ensureRetrieveUpdated(context, customOptions) {
        if (!context.options.$getUpdated) {
            context.options.$getUpdated = customOptions || true;
        }
    }

    /**
     * Ensure context.exisintg be the just deleted entity.
     * @param {*} context
     * @param {*} customOptions
     */
    ensureRetrieveDeleted(context, customOptions) {
        if (!context.options.$getDeleted) {
            context.options.$getDeleted = customOptions || true;
        }
    }

    /**
     * Get value from context, e.g. session, query ...
     * @param {*} context
     * @param {string} key
     * @returns {*}
     */
    getValueFromContext(context, key) {
        return _get(context.options.$ctx, key);
    }

    /**
     * Pick only allowed fields from ctx.
     * @param {*} options
     * @returns {object}
     */
    _wrapCtx(options) {
        if (options && options.$ctx && options.$ctx.module) {
            return {
                ...options,
                $ctx: _.pick(options.$ctx, ['request', 'header', 'session', 'state']),
            };
        }

        return options ?? {};
    }

    /**
     * Get a pk-indexed hashtable with all undeleted data
     * {string} [key] - The key field to used by the hashtable.
     * {array} [associations] - With an array of associations.
     * {object} [connOptions] - Connection options, e.g. transaction handle
     */
    async cached_(key, associations, connOptions) {
        if (key) {
            let combinedKey = key;

            if (!isEmpty(associations)) {
                combinedKey += '/' + minifyAssocs(associations).join('&');
            }

            let cachedData;

            if (!this._cachedData) {
                this._cachedData = {};
            } else if (this._cachedData[combinedKey]) {
                cachedData = this._cachedData[combinedKey];
            }

            if (!cachedData) {
                cachedData = this._cachedData[combinedKey] = await this.findAll_(
                    { $association: associations, $toDictionary: key },
                    connOptions
                );
            }

            return cachedData;
        }

        return this.cached_(this.meta.keyField, associations, connOptions);
    }

    async applyRules_(ruleName, context) {
        for (const featureName in this.meta.features) {
            const key = featureName + '.' + ruleName;
            const action = featureRules[key];

            if (action) {
                let featureInfo = this.meta.features[featureName];

                if (context.options.$features && featureName in context.options.$features) {
                    const customFeatureInfo = context.options.$features[featureName];
                    if (!customFeatureInfo) {
                        continue;
                    }

                    featureInfo = { ...featureInfo, ...customFeatureInfo };
                }

                await action(featureInfo, this, context);
            }
        }
    }

    /**
     * Find a record by unique keys, returns a model object containing the record or undefined if nothing found.
     * @param {object} [findOptions] - findOptions
     * @property {object} [findOptions.$relation] - Joinings
     * @property {object} [findOptions.$select] - Selected fields
     * @property {object} [findOptions.$where] - Extra condition
     * @property {object} [findOptions.$groupBy] - Group by fields
     * @property {object} [findOptions.$orderBy] - Order by fields
     * @property {number} [findOptions.$offset] - Offset
     * @property {number} [findOptions.$limit] - Limit
     * @property {bool} [findOptions.$includeDeleted=false] - Include those marked as logical deleted.
     * @property {bool} [findOptions.$skipOrm=false] - Skip ORM mapping
     * @property {object} [findOptions.$ctx]
     * @returns {*}
     */
    async findOne_(findOptions) {
        return this._find_(findOptions, true);
    }

    /**
     * Find records matching the condition, returns an array of records.
     * @param {object} [findOptions] - findOptions
     * @property {object} [findOptions.$relation] - Joinings
     * @property {object} [findOptions.$select] - Selected fields
     * @property {object} [findOptions.$where] - Extra condition
     * @property {object} [findOptions.$groupBy] - Group by fields
     * @property {object} [findOptions.$orderBy] - Order by fields
     * @property {number} [findOptions.$offset] - Offset
     * @property {number} [findOptions.$limit] - Limit
     * @property {number} [findOptions.$totalCount] - Return totalCount
     * @property {bool} [findOptions.$includeDeleted=false] - Include those marked as logical deleted.
     * @property {bool} [findOptions.$skipOrm=false] - Skip ORM mapping
     * @returns {array}
     */
    async findMany_(findOptions) {
        return this._find_(findOptions, false);
    }

    async _find_(findOptions, isOne) {
        findOptions = this._wrapCtx(findOptions);
        findOptions = this._normalizeQuery(findOptions, isOne /* for single record */);

        const context = {
            op: 'find',
            options: findOptions,
            isOne,
        };

        const opOptions = context.options;

        await this.applyRules_(Rules.RULE_BEFORE_FIND, context);

        this._preProcessOptions(opOptions, isOne /* for single record */);

        return this._safeExecute_(async () => {
            const result = await this.db.connector.find_(this.meta.name, opOptions, this.db.transaction);
            let data = result.data;

            if (opOptions.$assoc && !opOptions.$skipOrm) {
                // rows, coloumns, aliasMap
                if (data.length > 0) {
                    data = this._mapRecordsToObjects(result, opOptions.$assoc, opOptions.$nestedGet);
                }
            }

            if (isOne && data.length > 1) {
                this.db.app.log('warn', `"findOne_" returns more than one record.`, {
                    entity: this.meta.name,
                    options: _.omit(opOptions, ['$assoc']),
                });
            }

            result.data = isOne ? data[0] : data ?? [];
            delete result.fields;
            delete result.aliases;
            delete result.affectedRows;
            context.latest = context.result = result;
            return isOne ? result.data : result;
        }, context);
    }

    /**
     * Regenerate creation data and try again if duplicate record exists
     * @param {Function} dataGenerator_
     * @param {Object} connOptions
     */
    async retryCreateOnDuplicate_(dataGenerator_, maxRery, createOptions, connOptions) {
        let counter = 0;
        let errorRet;
        maxRery || (maxRery = 10);

        while (counter++ < maxRery) {
            const data = await dataGenerator_();

            try {
                return await this.create_(data, createOptions, connOptions);
            } catch (error) {
                if (error.code !== 'E_DUPLICATE') {
                    throw error;
                }

                errorRet = error;
            }
        }

        return errorRet;
    }

    async ensureTransaction_() {
        if (!this.db.transaction) {
            if (!this._safeFlag) {
                throw new ApplicationError('Transaction is not allowed outside of a safe execution block.');
            }

            this.db = this.db.fork(await this.db.connector.beginTransaction_());
        }
    }

    async _commitOwnedTransaction_() {
        if (this.db.transaction) {
            // exception safe
            await this.db.connector.commit_(this.db.transaction);
            const newDbInstance = this.db.fork();
            this.db.end();
            // reset db with a new instance
            this.db = newDbInstance;
        }
    }

    async _rollbackOwnedTransaction_() {
        if (this.db.transaction) {
            // exception safe
            await this.db.connector.rollback_(this.db.transaction);
            const newDbInstance = this.db.fork();
            this.db.end();
            // reset db with a new instance
            this.db = newDbInstance;
        }
    }

    /**
     * Safely execute a function with transaction support, returns false to cancel at anytime.
     * @param {*} executor
     * @returns {Promise<boolean> | boolean}
     */
    async _safeExecute_(executor) {
        executor = executor.bind(this);

        if (this.db.transaction) {
            return executor();
        }

        try {
            this._safeFlag = true;
            const result = await executor();

            // if the executor have initiated a transaction
            await this._commitOwnedTransaction_();

            return result;
        } catch (error) {
            if (error instanceof OpCompleted) {
                await this._commitOwnedTransaction_();
                return error.payload;
            }

            await this._rollbackOwnedTransaction_();
            throw error;
        } finally {
            this._safeFlag = false;
        }
    }

    /**
     * Normalize the `$getCreated` query options.
     * @param {object} opOptions - [out]
     */
    _normalizeGetCreated(opOptions) {
        if (opOptions.$getCreated) {
            const t = typeof opOptions.$getCreated;

            if (t === 'string') {
                opOptions.$getCreated = [opOptions.$getCreated];
                return;
            }

            if (t === 'boolean') {
                opOptions.$getCreated = ['*'];
                return;
            }

            if (t === 'object') {
                if (Array.isArray(opOptions.$getCreated)) {
                    if (opOptions.$getCreated.every((v) => v.indexOf('.') === -1)) {
                        return;
                    }

                    throw new InvalidArgument('"$getCreated" does not support retrieving with associations.');
                }
            }

            throw new InvalidArgument(
                'Invalid value for "$getCreated", expected: column, column array or boolean for returning all.',
                {
                    $getCreated: opOptions.$getCreated,
                    type: t,
                }
            );
        }
    }

    /**
     * Ensure the returning of auto id if the entity has auto increment feature.
     * @param {object} opOptions
     */
    _ensureReturningAutoId(opOptions) {
        if (this.hasAutoIncrement) {
            if (!opOptions.$getCreated) {
                opOptions.$getCreated = [this.meta.features.autoId.field];
            } else if (Array.isArray(opOptions.$getCreated)) {
                if (opOptions.$getCreated.length === 1 && opOptions.$getCreated[0] === '*') {
                    return;
                }

                opOptions.$getCreated = _.uniq([this.meta.features.autoId.field, ...opOptions.$getCreated]);
            }
        }
    }

    /**
     * Create a new entity with given data.
     * @param {object} data - Entity data
     * @param {object} [createOptions] - Create options
     * @property {bool|object} [createOptions.$getCreated=false] - Retrieve the newly created record from db, can also retrieve with a complex query.
     * @property {bool} [createOptions.$ignore=false] - If already exist, just ignore the insert.
     * @property {bool} [createOptions.$upsert=false] - If already exist, just update the record.
     * @property {bool} [createOptions.$dryRun=false] - Do not actually insert the record.
     * @returns {EntityModel}
     */
    async create_(data, createOptions) {
        createOptions = this._wrapCtx(createOptions);

        // check if data contains any associations (associcated creation) or references (create with references to other entities)
        let [raw, associations, references] = this._extractAssociations(data, true);

        const context = {
            op: 'create',
            raw,
            options: createOptions,
        };

        const opOptions = context.options;
        this._normalizeGetCreated(opOptions);
        this._ensureReturningAutoId(opOptions);

        // overrided by the genreated entity model
        if (!(await this.beforeCreate_(context))) {
            return context.result;
        }

        await this._safeExecute_(async () => {
            // use foreign data as input
            if (!isEmpty(references)) {
                await this.ensureTransaction_();
                await this._populateReferences_(context, references);
            }

            let needCreateAssocs = !isEmpty(associations);
            if (needCreateAssocs) {
                await this.ensureTransaction_();

                associations = await this._createAssocs_(context, associations, true /* before create */);
                // check any other associations left
                needCreateAssocs = !isEmpty(associations);
            }

            await this._prepareEntityData_(context);

            await this.applyRules_(Rules.RULE_BEFORE_CREATE, context);

            if (!opOptions.$dryRun) {
                if (opOptions.$upsert) {
                    const dataForUpdating = _.pick(context.latest, Object.keys(context.raw)); // only update the raw part

                    context.result = await this.db.connector.upsert_(
                        this.meta.name,
                        dataForUpdating,
                        this.getUniqueKeyFieldsFrom(context.latest),
                        context.latest,
                        opOptions,
                        this.db.transaction
                    );
                } else {
                    context.result = await this.db.connector.create_(
                        this.meta.name,
                        context.latest,
                        opOptions,
                        this.db.transaction
                    );
                }

                context.result.data = { ...context.latest, ...context.result.data[0] };
                context.latest = context.result.data;

                if (this.hasAutoIncrement) {
                    context.result.insertId = context.latest[this.meta.features.autoId.field];
                }

                delete context.result.fields;
            } else {
                context.result = { data: context.latest, affectedRows: 1 };
            }

            delete opOptions.$data;

            if (needCreateAssocs) {
                await this._createAssocs_(context, associations);
            }

            await this.applyRules_(Rules.RULE_AFTER_CREATE, context);
        });

        if (!opOptions.$dryRun) {
            await this.afterCreate_(context);
        }

        return context.result;
    }

    /**
     * Update an existing entity with given data.
     * @param {object} data - Entity data with at least one unique key (pair) given
     * @param {object} [updateOptions] - Update options
     * @property {object} [updateOptions.$where] - Extra condition
     * @property {bool} [updateOptions.$getUpdated=false] - Retrieve the updated entity from database
     * @returns {object}
     */
    async updateOne_(data, updateOptions) {
        if (!updateOptions) {
            // if no condition given, extract from data
            const conditionFields = this.getUniqueKeyFieldsFrom(data);
            if (isEmpty(conditionFields)) {
                throw new InvalidArgument(
                    'Primary key value(s) or at least one group of unique key value(s) is required for updating an entity.',
                    {
                        entity: this.meta.name,
                        data,
                    }
                );
            }
            updateOptions = { $where: _.pick(data, conditionFields) };
            data = _.omit(data, conditionFields);
        }

        updateOptions = this._wrapCtx(updateOptions);
        return this._update_(data, updateOptions, true);
    }

    /**
     * Update many existing entites with given data.
     * @param {*} data
     * @param {*} updateOptions
     * @returns {object}
     */
    async updateMany_(data, updateOptions) {
        updateOptions = this._wrapCtx(updateOptions);
        return this._update_(data, updateOptions, false);
    }

    /**
     * Update implementation.
     * @param {*} data
     * @param {*} updateOptions
     * @param {boolean} isOne
     * @returns {object}
     */
    async _update_(data, updateOptions, isOne) {
        // see if there is associated entity data provided together
        let [raw, associations, references] = this._extractAssociations(data);

        const context = {
            op: 'update',
            raw,
            options: this._normalizeQuery(updateOptions, isOne /* for single record */),
            isOne,
        };

        // see if there is any runtime feature stopping the update
        let toUpdate;

        if (isOne) {
            toUpdate = await this.beforeUpdate_(context);
        } else {
            toUpdate = await this.beforeUpdateMany_(context);
        }

        if (!toUpdate) {
            return context.result;
        }

        const opOptions = context.options;
        this._preProcessOptions(opOptions, isOne /* for single record */);

        await this._safeExecute_(async () => {
            if (!isEmpty(references)) {
                await this.ensureTransaction_();
                await this._populateReferences_(context, references);
            }

            let needUpdateAssocs = !isEmpty(associations);
            let doneUpdateAssocs;

            if (needUpdateAssocs) {
                await this.ensureTransaction_();

                associations = await this._updateAssocs_(context, associations, true /* before update */, isOne);
                needUpdateAssocs = !isEmpty(associations);
                doneUpdateAssocs = true;
            }

            await this._prepareEntityData_(context, true /* is updating */, isOne);

            await this.applyRules_(Rules.RULE_BEFORE_UPDATE, context);

            if (isEmpty(context.latest)) {
                if (!doneUpdateAssocs && !needUpdateAssocs) {
                    throw new InvalidArgument('Cannot do the update with empty record. Entity: ' + this.meta.name);
                }
            } else {
                if (
                    needUpdateAssocs &&
                    !hasValueInAny([opOptions.$where, context.latest], this.meta.keyField) &&
                    !opOptions.$getUpdated
                ) {
                    // has associated data depending on this record
                    // should ensure the latest result will contain the key of this record
                    opOptions.$getUpdated = true;
                }

                if (isOne && !opOptions.$limit) {
                    opOptions.$limit = 1;
                }

                context.result = await this.db.connector.update_(
                    this.meta.name,
                    context.latest,
                    opOptions,
                    this.db.transaction
                );

                if (isOne) {
                    context.result.data = context.result.data[0] ?? {};
                } else {
                    context.result.data = context.result.data ?? [];
                }

                delete context.result.fields;
            }

            await this.applyRules_(Rules.RULE_AFTER_UPDATE, context);

            delete opOptions.$data;

            if (needUpdateAssocs) {
                await this._updateAssocs_(context, associations, false, isOne);
            }
        }, context);

        if (!opOptions.$dryRun) {
            if (isOne) {
                await this.afterUpdate_(context);
            } else {
                await this.afterUpdateMany_(context);
            }
        }

        return context.result;
    }

    /**
     * Remove an existing entity with given data.
     * @param {object} [deleteOptions] - Update options
     * @property {object} [deleteOptions.$where] - Extra condition
     * @property {bool} [deleteOptions.$getDeleted=false] - Retrieve the deleted entity from database
     * @property {bool} [deleteOptions.$physicalDeletion=false] - When $physicalDeletion = true, deletetion will not take into account logicaldeletion feature
     */
    async deleteOne_(deleteOptions) {
        deleteOptions = this._wrapCtx(deleteOptions);
        return this._delete_(deleteOptions, true);
    }

    /**
     * Remove an existing entity with given data.
     * @param {object} [deleteOptions] - Update options
     * @property {object} [deleteOptions.$where] - Extra condition
     * @property {bool} [deleteOptions.$getDeleted=false] - Retrieve the deleted entity from database
     * @property {bool} [deleteOptions.$physicalDeletion=false] - When $physicalDeletion = true, deletetion will not take into account logicaldeletion feature
     * @property {bool} [deleteOptions.$deleteAll=false] - When $deleteAll = true, the operation will proceed even empty condition is given
     */
    async deleteMany_(deleteOptions) {
        deleteOptions = this._wrapCtx(deleteOptions);
        return this._delete_(deleteOptions, false);
    }

    async deleteAll_() {
        return this.deleteMany_({ $deleteAll: true });
    }

    /**
     * Remove an existing entity with given data.
     * @param {object} [deleteOptions] - Update options
     * @property {object} [deleteOptions.$where] - Extra condition
     * @property {bool} [deleteOptions.$getDeleted=false] - Retrieve the deleted entity from database
     * @property {bool} [deleteOptions.$physicalDeletion=false] - When $physicalDeletion = true, deletetion will not take into account logicaldeletion feature
     */
    async _delete_(deleteOptions, isOne) {
        deleteOptions = this._normalizeQuery(deleteOptions, isOne /* for single record */);

        if (isEmpty(deleteOptions.$where) && (isOne || !deleteOptions.$deleteAll)) {
            throw new InvalidArgument(
                'Empty condition is not allowed for deleting unless `{ $deleteAll: true }` is set in options.',
                {
                    entity: this.meta.name,
                    deleteOptions,
                    isOne,
                }
            );
        }

        const context = {
            op: 'delete',
            options: deleteOptions,
            isOne,
        };

        let toDelete;

        if (isOne) {
            toDelete = await this.beforeDelete_(context);
        } else {
            toDelete = await this.beforeDeleteMany_(context);
        }

        if (!toDelete) {
            return context.result;
        }

        const opOptions = context.options;
        this._preProcessOptions(opOptions, isOne /* for single record */);

        await this._safeExecute_(async () => {
            await this.applyRules_(Rules.RULE_BEFORE_DELETE, context);

            context.result = await this.db.connector.delete_(this.meta.name, opOptions, this.db.transaction);
            delete context.result.fields;

            await this.applyRules_(Rules.RULE_AFTER_DELETE, context);
        }, context);

        if (!opOptions.$dryRun) {
            if (isOne) {
                await this.afterDelete_(context);
            } else {
                await this.afterDeleteMany_(context);
            }
        }

        return context.result;
    }

    /**
     * Check whether a data record contains primary key or at least one unique key pair.
     * @param {object} data
     */
    _containsUniqueKey(data) {
        let hasKeyName = false;

        const hasNotNullKey = _.find(this.meta.uniqueKeys, (fields) => {
            const hasKeys = _.every(fields, (f) => f in data);
            hasKeyName = hasKeyName || hasKeys;

            return _.every(fields, (f) => data[f] != null);
        });

        return [hasNotNullKey, hasKeyName];
    }

    /**
     * Ensure the condition contains one of the unique keys.
     * @param {*} condition
     */
    _ensureContainsUniqueKey(condition) {
        const [containsUniqueKeyAndValue, containsUniqueKeyName] = this._containsUniqueKey(condition);

        if (!containsUniqueKeyAndValue) {
            if (containsUniqueKeyName) {
                throw new ValidationError(
                    'One of the unique key field as query condition is null. Condition: ' + JSON.stringify(condition)
                );
            }

            throw new InvalidArgument(
                'Single record operation requires at least one unique key value pair in the query condition.',
                {
                    entity: this.meta.name,
                    condition,
                }
            );
        }
    }

    /**
     * Prepare valid and sanitized entity data for sending to database.
     * @param {object} context - Operation context.
     * @property {object} context.raw - Raw input data.
     * @param {bool} isUpdating - Flag for updating existing entity.
     */
    async _prepareEntityData_(context, isUpdating = false, isOne = true) {
        const i18n = this.i18n;
        const { name, fields } = this.meta;

        let { raw } = context;
        let latest = {};
        // returned by $getExisting
        let existing = context.options.$existing;
        context.latest = latest;

        if (!context.i18n) {
            context.i18n = i18n;
        }

        const opOptions = context.options;

        if (opOptions.$upsert && typeof opOptions.$upsert === 'object') {
            raw = { ...raw, ...opOptions.$upsert };
        }

        if (isUpdating && isEmpty(existing) && (this._dependsOnExistingData(raw) || opOptions.$getExisting)) {
            await this.ensureTransaction_();

            if (isOne) {
                existing = await this.findOne_({ $where: opOptions.$where });
            } else {
                existing = await this.findAll_({ $where: opOptions.$where });
            }
            context.existing = existing;
        }

        if (opOptions.$getExisting && !opOptions.$existing) {
            opOptions.$existing = existing;
        }

        await this.applyRules_(Rules.RULE_BEFORE_VALIDATION, context);

        await eachAsync_(fields, async (fieldInfo, fieldName) => {
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
                    if (
                        !opOptions.$migration &&
                        (!opOptions.$bypassReadOnly || !opOptions.$bypassReadOnly.has(fieldName))
                    ) {
                        // read only, not allow to set by input value
                        throw new ValidationError(
                            `Read-only field "${fieldName}" is not allowed to be set by manual input.`,
                            {
                                entity: name,
                                fieldInfo: fieldInfo,
                            }
                        );
                    }
                }

                if (isUpdating && fieldInfo.freezeAfterNonDefault) {
                    if (!existing) {
                        throw new Error('"freezeAfterNonDefault" qualifier requires existing data.');
                    }

                    if (existing[fieldName] !== fieldInfo.default) {
                        // freezeAfterNonDefault, not allow to change if value is non-default
                        throw new ValidationError(
                            `"freezeAfterNonDefault" field "${fieldName}" is not allowed to be changed.`,
                            {
                                entity: name,
                                fieldInfo: fieldInfo,
                            }
                        );
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
                } */

                // sanitize first
                if (value == null) {
                    if (fieldInfo.default != null) {
                        // has default setting in meta data
                        latest[fieldName] = fieldInfo.default;
                    } else if (!fieldInfo.optional) {
                        throw new ValidationError(`The "${fieldName}" value of "${name}" entity cannot be null.`, {
                            entity: name,
                            fieldInfo: fieldInfo,
                        });
                    } else {
                        latest[fieldName] = null;
                    }
                } else {
                    if (isPlainObject(value) && value.$xr) {
                        latest[fieldName] = value;

                        return;
                    }

                    try {
                        latest[fieldName] = typeSystem.sanitize(value, fieldInfo, i18n);
                    } catch (error) {
                        throw new ValidationError(`Invalid "${fieldName}" value of "${name}" entity.`, {
                            entity: name,
                            fieldInfo: fieldInfo,
                            value,
                            error: error.stack,
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
                        latest[fieldName] = await defaultGenerator(fieldInfo, i18n);
                        return;
                    }

                    throw new ValidationError(`Field "${fieldName}" of "${name}" entity is required for each update.`, {
                        entity: name,
                        fieldInfo: fieldInfo,
                    });
                }

                return;
            }

            // new record
            if (!fieldInfo.autoByDb) {
                if ('default' in fieldInfo) {
                    // has default setting in meta data
                    latest[fieldName] = fieldInfo.default;
                } else if (fieldInfo.optional) {
                    // ignore
                } else if (fieldInfo.auto) {
                    // automatically generated
                    latest[fieldName] = await defaultGenerator(fieldInfo, i18n);
                } else if (!fieldInfo.hasActivator && !fieldInfo.fillByRule) {
                    // skip those have activators or fill by beforeCreate rule

                    throw new ValidationError(`Field "${fieldName}" of "${name}" entity is required.`, {
                        entity: name,
                        fieldInfo: fieldInfo,
                        raw,
                    });
                }
            } // else default value set by database or by rules
        });

        latest = context.latest = this._translateValue(latest, opOptions);

        await this.applyRules_(Rules.RULE_AFTER_VALIDATION, context);

        if (!opOptions.$skipModifiers) {
            if (opOptions.$skipValidators && Array.isArray(opOptions.$skipValidators)) {
                opOptions.$skipValidators = new Set(opOptions.$skipValidators);
            }
            await this.applyModifiers_(context, isUpdating);
        }

        // final round process before entering database
        context.latest = _.mapValues(latest, (value, key) => {
            if (value == null) return value;

            if (isPlainObject(value) && value.$xr) {
                // there is special input column which maybe a function or an expression
                // postgres only support split columns, i.e. INSERT INTO VALUES
                // mysql support INSERT INTO SET ??
                opOptions.$requireSplitColumns = true;
                return value;
            }

            const fieldInfo = fields[key];

            return this._serializeByTypeInfo(value, fieldInfo);
        });

        opOptions.$data = {
            latest: context.latest,
            raw: context.raw,
        };

        if (isUpdating) {
            opOptions.$data.existing = existing;
        }
    }

    _dependencyChanged(fieldName, context) {
        if (this.meta.fieldDependencies) {
            const deps = this.meta.fieldDependencies[fieldName];

            return _.find(deps, (d) =>
                isPlainObject(d) ? d.reference !== fieldName && _.hasIn(context, d.reference) : _.hasIn(context, d)
            );
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
        const deps = this.meta.fieldDependencies;
        let hasDepends = false;

        if (deps) {
            const nullDepends = new Set();

            hasDepends = _.find(deps, (dep, fieldName) =>
                _.find(dep, (d) => {
                    if (isPlainObject(d)) {
                        if (d.whenNull) {
                            if (input[fieldName] == null) {
                                nullDepends.add(dep);
                            }

                            return false;
                        }

                        if (d.reference === fieldName) return false;

                        d = d.reference;
                    }

                    return (
                        (fieldName in input && !this._referenceExist(input, d)) ||
                        (this._referenceExist(input, d) && !(fieldName in input))
                    );
                })
            );

            if (hasDepends) {
                return true;
            }

            for (const dep of nullDepends) {
                if (_.find(dep, (d) => !this._referenceExist(input, d.reference))) {
                    return true;
                }
            }
        }

        // check by special rules
        const atLeastOneNotNull = this.meta.features.atLeastOneNotNull;
        if (atLeastOneNotNull) {
            hasDepends = _.find(atLeastOneNotNull, (fields) =>
                _.find(fields, (field) => field in input && input[field] == null)
            );
            if (hasDepends) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if the given object contains reserved keys.
     * @param {*} obj
     * @returns {boolean}
     */
    _hasReservedKeys(obj) {
        return _.find(obj, (v, k) => k[0] === '$');
    }

    /**
     * Normalize options including moving entries with key not starting with '$' into $where, interpolating variables and building relationship structure.
     * @param {object} options
     * @param {boolean} [isOne=false]
     * @returns {object}
     */
    _normalizeQuery(options, isOne = false) {
        if (!isPlainObject(options)) {
            if (isOne && options == null) {
                throw new InvalidArgument(
                    'Primary key value or at least one unique key value pair is required for single record operation.',
                    {
                        entity: this.meta.name,
                    }
                );
            }

            // in this case, options is the value of primary key, check for combined primary key
            if (Array.isArray(this.meta.keyField)) {
                throw new InvalidArgument(
                    'Cannot use a singular value as condition to query against an entity with combined primary key.',
                    {
                        entity: this.meta.name,
                        keyFields: this.meta.keyField,
                    }
                );
            }

            // single key
            return options != null
                ? {
                      $where: {
                          [this.meta.keyField]: options,
                      },
                  }
                : {};
        }

        const qOptions = { $ctx: options.$ctx };
        const query = {};

        // move non-reserved keys to $where
        _.forOwn(options, (v, k) => {
            if (k[0] === '$') {
                qOptions[k] = v;
            } else {
                query[k] = v;
            }
        });

        qOptions.$where = { ...query, ...qOptions.$where };

        let relFromSelect = new Set();

        if (qOptions.$select) {
            const converted = new Set();

            qOptions.$select.forEach((value) => {
                if (typeof value === 'string') {
                    let fpos = value.indexOf('* -');
                    if (fpos >= 0) {
                        // exclude syntax
                        const parts = value.split(' -');                        
                        const baseAssoc = parts[0];
                        value = {
                            $xr: 'ExclusiveSelect',
                            columnSet: baseAssoc,
                            excludes: parts.slice(1),
                        };
                    } else {
                        let pos;

                        if ((pos = value.lastIndexOf('.')) > 0) {
                            // auto-add relation if select includes a field from related entity
                            relFromSelect.add(value.substring(0, pos));
                        }

                        converted.add(value);
                        return;
                    }
                }

                if (isPlainObject(value) && value.$xr === 'ExclusiveSelect') {
                    this._translateExclSelect(value).forEach((v) => {
                        let pos;

                        if ((pos = v.lastIndexOf('.')) > 0) {
                            // auto-add relation if select includes a field from related entity
                            relFromSelect.add(v.substring(0, pos));
                        }

                        converted.add(v);
                    });
                    return;
                }

                converted.add(this._translateValue(value, qOptions));
            });

            qOptions.$select = converted; // will be unique in prepareAssociations
        }

        if (relFromSelect.size) {
            // merge with existing relations
            if (qOptions.$relation) {
                qOptions.$relation.forEach((rel) => relFromSelect.add(rel));
            }
            qOptions.$relation = Array.from(relFromSelect);
        }

        return qOptions;
    }

    _preProcessOptions(qOptions, isOne) {
        const extraSelect = [];
        qOptions.$where = this._translateValue(qOptions.$where, qOptions, true, extraSelect);
        if (extraSelect.length) {
            qOptions.$select || (qOptions.$select = new Set(['*']));
            if (!qOptions.$select.has('*')) {
                extraSelect.forEach((v) => qOptions.$select.add(v));
            }
        }

        if (isOne && !qOptions.$skipUniqueCheck) {
            this._ensureContainsUniqueKey(qOptions.$where);
        }

        if (qOptions.$groupBy) {
            qOptions.$skipOrm = true; // no orm for grouping
            if (isPlainObject(qOptions.$groupBy)) {
                if (qOptions.$groupBy.having) {
                    qOptions.$groupBy.having = this._translateValue(qOptions.$groupBy.having, qOptions, true);
                }
            }
        }

        if (qOptions.$relation) {
            if (qOptions.$assoc) {
                throw new Error('To be implemented');
            }

            qOptions.$assoc = this._prepareAssociations(qOptions);
        }
    }

    _translateExclSelect(value) {
        const { columnSet, excludes } = value;

        if (columnSet === '*') {
            return Object.keys(_.omit(this.meta.fields, excludes));
        }

        const base = columnSet.split('.');
        const right = base.pop();

        if (right !== '*') {
            throw new ApplicationError('Invalid column set syntax in exclusive select: ' + columnSet);
        }

        const basePrefix = base.join('.');
        const targetEntity = this.getChainedRelatedEntity(base);

        return Object.keys(_.omit(targetEntity.meta.fields, excludes)).map((f) => basePrefix + '.' + f);
    }

    /**
     * Pre create processing, return false to stop upcoming operation.
     * @param {*} context
     */
    async beforeCreate_(context) {
        return true;
    }

    /**
     * Pre update processing, return false to stop upcoming operation.
     * @param {*} context
     */
    async beforeUpdate_(context) {
        return true;
    }

    /**
     * Pre update processing, multiple records, return false to stop upcoming operation.
     * @param {*} context
     */
    async beforeUpdateMany_(context) {
        return true;
    }

    /**
     * Pre delete processing, return false to stop upcoming operation.
     * @param {*} context
     */
    async beforeDelete_(context) {
        return true;
    }

    /**
     * Pre delete processing, multiple records, return false to stop upcoming operation.
     * @param {*} context
     */
    async beforeDeleteMany_(context) {
        return true;
    }

    /**
     * Post create processing.
     * @param {*} context
     */
    async afterCreate_(context) {}

    /**
     * Post update processing.
     * @param {*} context
     */
    async afterUpdate_(context) {}

    /**
     * Post update processing, multiple records
     * @param {*} context
     */
    async afterUpdateMany_(context) {}

    /**
     * Post delete processing.
     * @param {*} context
     */
    async afterDelete_(context) {}

    /**
     * Post delete processing, multiple records
     * @param {*} context
     */
    async afterDeleteMany_(context) {}

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
     * @param {object} opPayload
     * @param {boolean} arrayToInOperator - Convert an array value to { $in: array }
     * @returns {*}
     */
    _translateValue(value, opPayload, arrayToInOperator, extraSelect) {
        if (isPlainObject(value)) {
            if (value.$xr) {
                // todo: check if any properties need translate
                switch (value.$xr) {
                    case 'Column':
                        if (extraSelect) {
                            extraSelect.push(value.name);
                        }
                        return;

                    case 'Function':
                        if (value.args) {
                            return { ...value, args: this._translateValue(value.args, opPayload, false, extraSelect) };
                        }
                        return;

                    case 'BinExpr':
                        return {
                            ...value,
                            left: this._translateValue(value.left, opPayload, false, extraSelect),
                            right: this._translateValue(value.right, opPayload, false, extraSelect),
                        };

                    case 'Request': {
                        const ctx = opPayload.$ctx;

                        if (ctx == null) {
                            throw new InvalidArgument(
                                'Request reference requires the Http `ctx` object to be passed as `$ctx` in the operation options.',
                                {
                                    entity: this.meta.name,
                                    value,
                                }
                            );
                        }

                        const reqValue = _get(ctx, value.name);

                        if (reqValue == null && !value.optional) {
                            const errArgs = [];
                            if (value.missingMessage) {
                                errArgs.push(value.missingMessage);
                            }
                            if (value.missingStatus) {
                                errArgs.push(value.missingStatus || HttpCode.BAD_REQUEST);
                            }

                            throw new ValidationError(...errArgs);
                        }

                        return reqValue;
                    }

                    case 'Symbol':
                        return this._translateSymbolToken(value.name);

                    case 'Data':
                        if (opPayload.$data == null) {
                            throw new InvalidArgument(
                                '`$data` field is required for "latest|existing|raw" value reference.',
                                {
                                    entity: this.meta.name,
                                    value,
                                }
                            );
                        }
                        return _get(opPayload.$data, value.name);

                    case 'Query':
                    case 'DataSet':
                    case 'Raw':
                        return value;
                }

                throw new Error('Not implemented yet. ' + value.$xr);
            }

            return _.mapValues(value, (v, k) => {
                const keyword = k[0] === '$';
                if (extraSelect && !keyword) {
                    extraSelect.push(k);
                }

                return this._translateValue(v, opPayload, arrayToInOperator && !keyword, extraSelect);
            });
        }

        if (Array.isArray(value)) {
            return arrayToInOperator
                ? { $in: value }
                : // $and, $or, $not array
                  value.map((v) => this._translateValue(v, opPayload, arrayToInOperator, extraSelect));
        }

        return value;
    }
}

export default EntityModel;
