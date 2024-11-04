import { ApplicationError, InvalidArgument, ValidationError, HttpCode } from '@kitmi/types';
import { _, eachAsync_, isPlainObject, isEmpty, get as _get } from '@kitmi/utils';
import typeSystem from '@kitmi/validators/allSync';
import * as Features from './entityFeatures';
import Rules from './Rules';
import defaultGenerator from './TypeGenerators';
import { hasValueInAny, xrDataSet, xrSql } from './helpers';
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

export const FLAG_DRY_RUN_IGNORE = Symbol('dryRun');

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
     * Get a map of fields schema by predefined input set.
     * @param {string} datasetName - Input set name, predefined in geml
     * @return {object} Schema object
     */
    datasetSchema(datasetName) {
        const creator = this.meta.schemas[datasetName];
        if (creator == null) {
            throw new InvalidArgument(`Unknown dataset "${datasetName}" of entity "${this.meta.name}".`);
        }
        return creator();
    }

    /**
     * Remove readonly fields from data record.
     * @param {Object} data
     * @returns {Object}
     */
    omitReadOnly(data) {
        return _.omitBy(data, (value, key) => !this.meta.fields[key] || this.meta.fields[key].readOnly);
    }

    /**
     * Get related entity model by anchor.
     * @param {string} anchor
     * @returns {EntityModel}
     */
    getRelatedEntity(anchor) {
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
            base = base.getRelatedEntity(dotPath.shift());
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

    applyRulesSync(ruleName, context) {
        for (const featureName in this.meta.features) {
            const key = featureName + '.' + ruleName + 'Sync';
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

                action(featureInfo, this, context);
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
     * @property {string} [findOptions.$countBy] - Return totalCount
     * @property {bool} [findOptions.$includeDeleted=false] - Include those marked as logical deleted.
     * @property {bool} [findOptions.$skipOrm=false] - Skip ORM mapping
     * @returns {array}
     */
    async findMany_(findOptions) {
        return this._find_(findOptions, false);
    }

    /**
     * Find records matching the condition and returns page by page.
     * @param {object} findOptions
     * @param {integer} page
     * @param {integer} rowsPerPage
     * @returns {array}
     */
    async findManyByPage_(findOptions, page, rowsPerPage) {
        return this.findMany_({ ...findOptions, $limit: rowsPerPage, $offset: (page - 1) * rowsPerPage });
    }

    findSql(findOptions) {
        findOptions = this._wrapCtx(findOptions);
        findOptions = this._normalizeQuery(findOptions, false /* for multiple record */);
        findOptions.$skipOrm = true;
        findOptions.$sqlOnly = true;

        const context = {
            op: 'find',
            options: findOptions,
            isOne: false,
        };

        const opOptions = context.options;

        this.applyRulesSync(Rules.RULE_BEFORE_FIND, context);

        this._preProcessOptions(opOptions, false /* for multiple record */);

        return this.db.connector.buildQuery(this.meta.name, opOptions);
    }

    async _find_(findOptions, isOne) {
        findOptions = this._wrapCtx(findOptions);
        findOptions = this._tryUseView(findOptions);
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

    async _rollbackOwnedTransaction_(error) {
        if (this.db.transaction) {
            // exception safe
            await this.db.connector.rollback_(this.db.transaction, error);
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

        let ownedTransaction = this.db.transaction == null;

        try {
            this._safeFlag = true;
            const result = await executor();

            // if the executor have initiated a transaction
            if (ownedTransaction) {
                await this._commitOwnedTransaction_();
            }

            return result;
        } catch (error) {
            if (error instanceof OpCompleted) {
                if (ownedTransaction) {
                    await this._commitOwnedTransaction_();
                }
                return error.payload;
            }

            if (ownedTransaction) {
                await this._rollbackOwnedTransaction_(error);
            }
            throw error;
        } finally {
            this._safeFlag = false;
        }
    }

    _tryUseView(findOptions) {
        if (findOptions.$view) {
            const baseView = this.meta.views[findOptions.$view];
            if (baseView == null) {
                throw new InvalidArgument(
                    `View "${findOptions.$view}" not found, available: ${Object.keys(this.meta.views)}`
                );
            }

            return { ...baseView, ...findOptions };
        }

        return findOptions;
    }

    /**
     * Normalize the `$getXXXed` query options.
     * @param {object} opOptions - [out]
     */
    _normalizeReturning(opOptions, returningKey) {
        const returningFields = opOptions[returningKey];

        if (returningFields) {
            const t = typeof returningFields;

            if (t === 'string') {
                // todo: check '.'
                if (returningFields.indexOf('.') !== -1) {
                    throw new InvalidArgument(`"${returningKey}" does not support retrieving with associations.`);
                }
                opOptions[returningKey] = [returningFields];
                return;
            }

            if (t === 'boolean') {
                opOptions[returningKey] = ['*'];
                return;
            }

            if (t === 'object') {
                if (Array.isArray(returningFields)) {
                    if (returningFields.every((v) => v.indexOf('.') === -1)) {
                        return;
                    }

                    throw new InvalidArgument(`"${returningKey}" does not support retrieving with associations.`);
                }
            }

            throw new InvalidArgument(
                `Invalid value for "${returningKey}", expected: column, column array or boolean for returning all.`,
                {
                    [returningKey]: returningFields,
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
        this._normalizeReturning(opOptions, '$getCreated');
        this._ensureReturningAutoId(opOptions);

        // overrided by the genreated entity model
        if (!(await this.beforeCreate_(context))) {
            return context.result;
        }

        await this._safeExecute_(async () => {
            // use foreign data as input
            if (!isEmpty(references)) {
                if (!opOptions.$dryRun) {
                    await this.ensureTransaction_();
                }
                await this._populateReferences_(context, references);
            }

            let needCreateAssocs = !isEmpty(associations);
            if (needCreateAssocs) {
                if (!opOptions.$dryRun) {
                    await this.ensureTransaction_();
                }

                associations = await this._createAssocs_(context, associations, true /* before create */);
                // check any other associations left
                needCreateAssocs = !isEmpty(associations);
            }

            if (opOptions.$dryRun) {
                await this._prepareEntityDataDryRun_(context);
            } else {
                await this._prepareEntityData_(context);
            }

            await this.applyRules_(Rules.RULE_BEFORE_CREATE, context);

            if (!opOptions.$dryRun) {
                let shouldUpsert = false;
                let dataForUpdating;
                let uniqueKeys;

                if (opOptions.$upsert) {
                    dataForUpdating = _.pick(context.latest, Object.keys(context.raw)); // only update the raw part
                    uniqueKeys = this.getUniqueKeyFieldsFrom(context.latest);
                    if (!isEmpty(_.pick(context.latest, uniqueKeys))) {
                        shouldUpsert = true;
                    }
                }

                if (shouldUpsert) {
                    let result = await this.db.connector.upsert_(
                        this.meta.name,
                        typeof opOptions.$upsert === 'object'
                            ? { ...dataForUpdating, ...opOptions.$upsert }
                            : dataForUpdating,
                        uniqueKeys,
                        context.latest,
                        opOptions,
                        this.db.transaction
                    );

                    if (result.affectedRows === 0) {
                        // insert ignored
                        const _data = await this.findOne_({ $where: _.pick(context.latest, uniqueKeys) });
                        result = { data: [_data], affectedRows: 0 };
                    }

                    context.result = result;
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
     * Create a new entity with selecting data from database and return the created entity.
     * @param {object} findOptions
     * @param {object} columnMapping - Column mapping from the selected data to the input of new entity
     * @returns {object} { data, affectedRows }
     */
    async createFrom_(findOptions, columnMapping) {
        findOptions = this._wrapCtx(findOptions);
        findOptions = this._normalizeQuery(findOptions, false /* for single record */);

        const context = {
            op: 'find',
            options: findOptions,
            isOne: false,
        };

        const opOptions = context.options;
        opOptions.$skipOrm = true;
        opOptions.$skipOrmWarn = true;
        this._normalizeReturning(opOptions, '$getCreated');

        await this.applyRules_(Rules.RULE_BEFORE_FIND, context);

        this._preProcessOptions(opOptions, false /* for single record */);

        let uniqueKeys;

        _.each(columnMapping, (v, key) => {
            if (!key.startsWith('::') && !opOptions.$select.has(key)) {
                throw new InvalidArgument('Column mapping key not found in the select list.', {
                    key,
                    select: opOptions.$select,
                });
            }
        });

        if (opOptions.$upsert) {
            uniqueKeys = this.getUniqueKeyFieldsFrom(_.invert(columnMapping));
        }

        return this._safeExecute_(async () => {
            context.result = await this.db.connector.createFrom_(
                this.meta.name,
                opOptions,
                columnMapping,
                uniqueKeys,
                this.db.transaction
            );
            context.latest = context.result.data;
            delete context.result.fields;
            return context.result;
        }, context);
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

        // see if there is associated entity data provided together
        let [raw, associations, references] = this._extractAssociations(data);
        const isOne = true;

        const context = {
            op: 'update',
            raw,
            options: this._normalizeQuery(updateOptions, isOne /* for single record */),
            isOne,
        };

        // see if there is any runtime feature stopping the update
        const toUpdate = await this.beforeUpdate_(context);

        if (!toUpdate) {
            return context.result;
        }

        const opOptions = context.options;
        this._normalizeReturning(opOptions, '$getUpdated');
        this._preProcessOptions(opOptions, isOne /* for single record */);

        await this._safeExecute_(async () => {
            if (!isEmpty(references)) {
                if (!opOptions.$dryRun) {
                    await this.ensureTransaction_();
                }
                await this._populateReferences_(context, references);
            }

            let needUpdateAssocs = !isEmpty(associations);
            let doneUpdateAssocs;

            if (needUpdateAssocs) {
                if (!opOptions.$dryRun) {
                    await this.ensureTransaction_();
                }

                associations = await this._updateAssocs_(context, associations, true /* before update */, isOne);
                needUpdateAssocs = !isEmpty(associations);
                doneUpdateAssocs = true;
            }

            if (opOptions.$dryRun) {
                await this._prepareEntityDataDryRun_(context, true /* is updating */, isOne);
            } else {
                await this._prepareEntityData_(context, true /* is updating */, isOne);
            }

            await this.applyRules_(Rules.RULE_BEFORE_UPDATE, context);

            if (isEmpty(context.latest)) {
                if (!doneUpdateAssocs && !needUpdateAssocs) {
                    throw new InvalidArgument('Cannot do the update with empty record. Entity: ' + this.meta.name);
                }

                const data = await this.findOne_(opOptions.$where);
                context.result = { data, affectedRows: 0 };
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

                if (!opOptions.$limit) {
                    opOptions.$limit = 1;
                }

                context.result = await this.db.connector.update_(
                    this.meta.name,
                    context.latest,
                    opOptions,
                    this.db.transaction
                );

                context.result.data = context.result.data[0] ?? {};
                delete context.result.fields;
            }

            await this.applyRules_(Rules.RULE_AFTER_UPDATE, context);

            delete opOptions.$data;

            if (needUpdateAssocs) {
                await this._updateAssocs_(context, associations, false, isOne);
            }
        }, context);

        if (!opOptions.$dryRun) {
            await this.afterUpdate_(context);
        }

        return context.result;
    }

    /**
     * Update many existing entites with given data.
     * @param {*} data
     * @param {*} updateOptions
     * @returns {object}
     */
    async updateMany_(data, updateOptions) {
        updateOptions = this._wrapCtx(updateOptions);
        this._ensureNoAssociations(data);

        const isOne = false;

        const context = {
            op: 'update',
            raw: data,
            options: this._normalizeQuery(updateOptions, isOne /* for single record */),
            isOne,
        };

        // see if there is any runtime feature stopping the update
        const toUpdate = await this.beforeUpdateMany_(context);

        if (!toUpdate) {
            return context.result;
        }

        const opOptions = context.options;
        this._normalizeReturning(opOptions, '$getUpdated');
        this._preProcessOptions(opOptions, isOne /* for single record */);

        await this._safeExecute_(async () => {
            if (opOptions.$dryRun) {
                await this._prepareEntityDataDryRun_(context, true /* is updating */, isOne);
            } else {
                await this._prepareEntityData_(context, true /* is updating */, isOne);
            }

            await this.applyRules_(Rules.RULE_BEFORE_UPDATE, context);

            if (isEmpty(context.latest)) {
                throw new InvalidArgument('Cannot do the update with empty record. Entity: ' + this.meta.name);
            }

            context.result = await this.db.connector.update_(
                this.meta.name,
                context.latest,
                opOptions,
                this.db.transaction
            );

            context.result.data = context.result.data ?? [];
            delete context.result.fields;

            await this.applyRules_(Rules.RULE_AFTER_UPDATE, context);
            delete opOptions.$data;
        }, context);

        if (!opOptions.$dryRun) {
            await this.afterUpdateMany_(context);
        }

        return context.result;
    }

    /**
     * Remove an existing entity with given data.
     * @param {object} [deleteOptions] - Update options
     * @property {object} [deleteOptions.$where] - Extra condition
     * @property {bool} [deleteOptions.$getDeleted=false] - Retrieve the deleted entity from database
     * @property {bool} [deleteOptions.$physical=false] - When $physical = true, deletetion will not take into account logicaldeletion feature
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
     * @property {bool} [deleteOptions.$physical=false] - When $physical = true, deletetion will not take into account logicaldeletion feature
     * @property {bool} [deleteOptions.$deleteAll=false] - When $deleteAll = true, the operation will proceed even empty condition is given
     */
    async deleteMany_(deleteOptions) {
        deleteOptions = this._wrapCtx(deleteOptions);
        return this._delete_(deleteOptions, false);
    }

    async deleteAll_(deleteOptions) {
        return this.deleteMany_({ ...deleteOptions, $deleteAll: true });
    }

    /**
     * Remove an existing entity with given data.
     * @param {object} [deleteOptions] - Update options
     * @property {object} [deleteOptions.$where] - Extra condition
     * @property {bool} [deleteOptions.$getDeleted=false] - Retrieve the deleted entity from database
     * @property {bool} [deleteOptions.$physical=false] - When $physical = true, deletetion will not take into account logicaldeletion feature
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
        this._normalizeReturning(opOptions, '$getDeleted');
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

        let existing = context.existing;
        context.latest = latest;

        if (!context.i18n) {
            context.i18n = i18n;
        }

        const opOptions = context.options;

        if (opOptions.$upsert && typeof opOptions.$upsert === 'object') {
            raw = { ...raw, ...opOptions.$upsert };
        }

        if (isUpdating && isEmpty(existing) && this._dependsOnExistingData(raw)) {
            await this.ensureTransaction_();

            if (isOne) {
                existing = await this.findOne_({ $where: opOptions.$where, $ctx: opOptions.$ctx });
            } else {
                throw new InvalidArgument('Cannot access existing record in multiple update.');
            }

            context.existing = existing;
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
                    if (typeof value === 'object' && (value.$xr || value.$set || value.$setAt || value.$setSlice)) {
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
                            error: error.message,
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
            if (opOptions.$skipProcessors && Array.isArray(opOptions.$skipProcessors)) {
                opOptions.$skipProcessors = new Set(opOptions.$skipProcessors);
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
                //opOptions.$requireSplitColumns = true;
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

    async _prepareEntityDataDryRun_(context, isUpdating = false, isOne = true) {
        const i18n = this.i18n;
        const { name, fields } = this.meta;

        let { raw } = context;
        let latest = {};

        let existing = context.existing;
        context.latest = latest;

        if (!context.i18n) {
            context.i18n = i18n;
        }

        const errors = [];

        const opOptions = context.options;

        if (opOptions.$upsert && typeof opOptions.$upsert === 'object') {
            raw = { ...raw, ...opOptions.$upsert };
        }

        if (isUpdating && isEmpty(existing) && this._dependsOnExistingData(raw)) {
            if (isOne) {
                existing = await this.findOne_({ $where: opOptions.$where, $ctx: opOptions.$ctx });
            } else {
                throw new InvalidArgument('Cannot access existing record in multiple update.');
            }

            context.existing = existing;
        }

        try {
            await this.applyRules_(Rules.RULE_BEFORE_VALIDATION, context);
        } catch (error) {
            errors.push(error);
        }

        await eachAsync_(fields, async (fieldInfo, fieldName) => {
            try {
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
                                    field: fieldName,
                                    value,
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
                                    field: fieldName,
                                    value,
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
                                field: fieldName,
                            });
                        } else {
                            latest[fieldName] = null;
                        }
                    } else {
                        if (typeof value === 'object' && value.$xr) {
                            latest[fieldName] = value;
                            return;
                        }

                        if (value === FLAG_DRY_RUN_IGNORE) {
                            return;
                        }

                        try {
                            latest[fieldName] = typeSystem.sanitize(value, fieldInfo, i18n);
                        } catch (error) {
                            throw new ValidationError(`Invalid "${fieldName}" value of "${name}" entity.`, {
                                entity: name,
                                field: fieldName,
                                value,
                                error: error.message,
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

                        throw new ValidationError(
                            `Field "${fieldName}" of "${name}" entity is required for each update.`,
                            {
                                entity: name,
                                field: fieldName,
                                fieldInfo: fieldInfo,
                            }
                        );
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
                            field: fieldName,
                            fieldInfo: fieldInfo,
                            raw,
                        });
                    }
                } // else default value set by database or by rules
            } catch (error) {
                errors.push(error);
            }
        });

        latest = context.latest = this._translateValue(latest, opOptions);

        try {
            await this.applyRules_(Rules.RULE_AFTER_VALIDATION, context);
        } catch (error) {
            errors.push(error);
        }

        try {
            if (!opOptions.$skipModifiers) {
                if (opOptions.$skipValidators && Array.isArray(opOptions.$skipValidators)) {
                    opOptions.$skipValidators = new Set(opOptions.$skipValidators);
                }
                if (opOptions.$skipProcessors && Array.isArray(opOptions.$skipProcessors)) {
                    opOptions.$skipProcessors = new Set(opOptions.$skipProcessors);
                }
                await this.applyModifiers_(context, isUpdating);

                if (opOptions.$errors) {
                    errors.push(...opOptions.$errors);
                    delete opOptions.$errors;
                }
            }

            // final round process before entering database
            context.latest = _.mapValues(latest, (value, key) => {
                if (value == null) return value;

                if (isPlainObject(value) && value.$xr) {
                    // there is special input column which maybe a function or an expression
                    // postgres only support split columns, i.e. INSERT INTO VALUES
                    // mysql support INSERT INTO SET ??
                    //opOptions.$requireSplitColumns = true;
                    return value;
                }

                const fieldInfo = fields[key];

                return this._serializeByTypeInfo(value, fieldInfo);
            });
        } catch (error) {
            errors.push(error);
        }

        if (errors.length > 0) {
            throw new ValidationError('Error preparing entity data.', {
                errors,
            });
        }

        opOptions.$data = {
            latest: context.latest,
            raw: context.raw,
        };

        if (isUpdating) {
            opOptions.$data.existing = existing;
        }
    }

    _noDependencyOrExist(fieldName, context) {
        if (!this.meta.fieldDependencies || !this.meta.fieldDependencies[fieldName]) {
            return true;
        }

        return this._dependencyExist(fieldName, context);
    }

    _dependencyExist(fieldName, context) {
        if (this.meta.fieldDependencies) {
            const deps = this.meta.fieldDependencies[fieldName];

            return _.find(deps, (d) =>
                typeof d === 'object' ? d.reference !== fieldName && _.hasIn(context, d.reference) : _.hasIn(context, d)
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
                            if (fieldName in input && input[fieldName] == null) {
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
        qOptions.$where = this._translateValue(qOptions.$where, qOptions, true);
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

            //qOptions.$assoc = qOptions.$skipOrm ? this._prepareAssociations(qOptions) : this._prepareAssociations(qOptions);
            qOptions.$assoc = this._prepareAssociations(qOptions);
        }

        if (qOptions.$hasSubQuery) {
            qOptions.$entity = this;
        }

        qOptions.$key = this.meta.keyField;
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
    _translateValue(value, opPayload, arrayToInOperator) {
        if (isPlainObject(value)) {
            if (value.$xr) {
                switch (value.$xr) {
                    case 'Function':
                        if (value.args) {
                            return { ...value, args: this._translateValue(value.args, opPayload, false) };
                        }
                        return value;

                    case 'BinExpr':
                        return {
                            ...value,
                            left: this._translateValue(value.left, opPayload, false),
                            right: this._translateValue(value.right, opPayload, false),
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

                    case 'DataSet':
                        opPayload.$hasSubQuery = true;
                        return value;

                    case 'Raw':
                    case 'OpGet':
                    case 'Column':
                        return value;
                }

                throw new Error('Not implemented yet. ' + value.$xr);
            }

            return _.mapValues(value, (v, k) => {
                const keyword = k[0] === '$';
                return this._translateValue(v, opPayload, arrayToInOperator && !keyword);
            });
        }

        if (Array.isArray(value)) {
            return arrayToInOperator
                ? { $in: value }
                : // $and, $or, $not array
                  value.map((v) => this._translateValue(v, opPayload, arrayToInOperator));
        }

        return value;
    }
}

export default EntityModel;
