import { _, eachAsync_, isPlainObject, isEmpty } from '@kitmi/utils';
import EntityModel from '../../EntityModel';
import { ApplicationError, ReferencedNotExistError, ValidationError, InvalidArgument } from '@kitmi/types';

import { getValueFromAny } from '../../helpers';

const defaultNestedKeyGetter = (anchor) => ':' + anchor;

/**
 * Relational entity model class.
 */
class RelationalEntityModel extends EntityModel {
    /**
     * [specific] Check if this entity has auto increment feature.
     */
    get hasAutoIncrement() {
        const autoId = this.meta.features.autoId;
        return autoId && this.meta.fields[autoId.field].autoIncrementId;
    }

    /**
     *
     * @param {*} findOptions
     */
    _prepareAssociations(findOptions) {
        const [normalAssocs, customAssocs] = _.partition(findOptions.$relation, (assoc) => typeof assoc === 'string');

        const associations = _.uniq(normalAssocs).sort().concat(customAssocs);
        const assocTable = {};
        let counter = 0;
        const cache = {};

        associations.forEach((assoc) => {
            if (isPlainObject(assoc)) {
                assoc = this._translateSchemaNameToDb(assoc);

                let alias = assoc.alias;
                if (!assoc.alias) {
                    alias = ':join' + ++counter;
                }

                assocTable[alias] = {
                    entity: assoc.entity,
                    joinType: assoc.type,
                    output: assoc.output,
                    key: assoc.key,
                    alias,
                    on: assoc.on,
                    ...(assoc.dataset
                        ? this.db.connector.buildQuery(
                              assoc.entity,
                              assoc.model._prepareQueries({
                                  ...assoc.dataset,
                                  $variables: findOptions.$variables,
                              })
                          )
                        : {}),
                };
            } else {
                this._loadAssocIntoTable(assocTable, cache, assoc);
            }
        });

        return assocTable;
    }

    /**
     *
     * @param {*} assocTable - Hierarchy with subAssocs
     * @param {*} cache - Dotted path as key
     * @param {*} assoc - Dotted path
     */
    _loadAssocIntoTable(assocTable, cache, assoc) {
        if (cache[assoc]) return cache[assoc];

        const lastPos = assoc.lastIndexOf('.');
        let result;

        if (lastPos === -1) {
            // direct association
            const assocInfo = { ...this.meta.associations[assoc] };
            if (isEmpty(assocInfo)) {
                throw new InvalidArgument(`Entity "${this.meta.name}" does not have the association "${assoc}".`);
            }

            result = cache[assoc] = assocTable[assoc] = { ...this._translateSchemaNameToDb(assocInfo) };
        } else {
            const base = assoc.substr(0, lastPos);
            const last = assoc.substr(lastPos + 1);

            let baseNode = cache[base];
            if (!baseNode) {
                baseNode = this._loadAssocIntoTable(assocTable, cache, base);
            }

            const entity = baseNode.model || this.db.entity(baseNode.entity);
            const assocInfo = { ...entity.meta.associations[last] };
            if (isEmpty(assocInfo)) {
                throw new InvalidArgument(`Entity "${entity.meta.name}" does not have the association "${assoc}".`);
            }

            result = { ...entity._translateSchemaNameToDb(assocInfo, this.db) };

            if (!baseNode.subAssocs) {
                baseNode.subAssocs = {};
            }

            cache[assoc] = baseNode.subAssocs[last] = result;
        }

        if (result.assoc) {
            this._loadAssocIntoTable(assocTable, cache, assoc + '.' + result.assoc);
        }

        return result;
    }

    _translateSchemaNameToDb(assoc, currentDb) {
        if (!assoc.entity) {
            throw new ApplicationError('"entity" is required in the association object.');
        }

        if (assoc.entity.indexOf('.') > 0) {
            const [schemaName, entityName] = assoc.entity.split('.', 2);

            const app = this.db.app;

            const refDb = app.db(schemaName);
            if (!refDb) {
                throw new ApplicationError(
                    `The referenced schema "${schemaName}" does not have db model in the same application.`
                );
            }

            assoc.entity = refDb.connector.database + '.' + entityName;
            assoc.model = refDb.entity(entityName);

            if (!assoc.model) {
                throw new ApplicationError(`Failed load the entity model "${schemaName}.${entityName}".`);
            }
        } else {
            assoc.model = this.db.entity(assoc.entity);

            if (currentDb && currentDb !== this.db) {
                assoc.entity = this.db.connector.database + '.' + assoc.entity;
            }
        }

        if (!assoc.key) {
            assoc.key = assoc.model.meta.keyField;
        }

        return assoc;
    }

    _mapRecordsToObjects([rows, columns, aliasMap], hierarchy, nestedKeyGetter) {
        nestedKeyGetter == null && (nestedKeyGetter = defaultNestedKeyGetter);
        aliasMap = _.mapValues(aliasMap, (chain) => chain.map((anchor) => nestedKeyGetter(anchor)));

        const mainIndex = {};
        const self = this;

        // map mysql column result into array of { table <table alias>, name: <column name> }
        columns = columns.map((col) => {
            if (col.table === '') {
                const pos = col.name.indexOf('$');
                if (pos > 0) {
                    return {
                        table: col.name.substr(0, pos),
                        name: col.name.substr(pos + 1),
                    };
                }

                return {
                    table: 'A',
                    name: col.name,
                };
            }

            return {
                table: col.table,
                name: col.name,
            };
        });

        // map flat record into hierachy
        function mergeRecord(existingRow, rowObject, associations, nodePath) {
            return _.each(associations, ({ sql, key, list, subAssocs }, anchor) => {
                if (sql) return;

                const currentPath = nodePath.concat();
                currentPath.push(anchor);

                const objKey = nestedKeyGetter(anchor);
                const subObj = rowObject[objKey];

                if (!subObj) {
                    // associated entity not in result set, probably when custom projection is used
                    return;
                }

                const subIndexes = existingRow.subIndexes[objKey];

                // joined an empty record
                const rowKeyValue = subObj[key];
                if (rowKeyValue == null) {
                    if (list) {
                        if (existingRow.rowObject[objKey]) {
                            existingRow.rowObject[objKey].push(subObj);
                        } else {
                            existingRow.rowObject[objKey] = [subObj];
                        }
                    }

                    return;
                }

                const existingSubRow = subIndexes && subIndexes[rowKeyValue];
                if (existingSubRow) {
                    if (subAssocs) {
                        return mergeRecord(existingSubRow, subObj, subAssocs, currentPath);
                    }
                } else {
                    if (!list) {
                        throw new ApplicationError(
                            `The structure of association "${currentPath.join('.')}" with [key=${key}] of entity "${
                                self.meta.name
                            }" should be a list.`,
                            { existingRow, rowObject }
                        );
                    }

                    if (existingRow.rowObject[objKey]) {
                        existingRow.rowObject[objKey].push(subObj);
                    } else {
                        existingRow.rowObject[objKey] = [subObj];
                    }

                    const subIndex = {
                        rowObject: subObj,
                    };

                    if (subAssocs) {
                        subIndex.subIndexes = buildSubIndexes(subObj, subAssocs);
                    }

                    if (!subIndexes) {
                        throw new ApplicationError(
                            `The subIndexes of association "${currentPath.join('.')}" with [key=${key}] of entity "${
                                self.meta.name
                            }" does not exist.`,
                            { existingRow, rowObject }
                        );
                    }

                    subIndexes[rowKeyValue] = subIndex;
                }
            });
        }

        // build sub index for list member
        function buildSubIndexes(rowObject, associations) {
            const indexes = {};

            _.each(associations, ({ sql, key, list, subAssocs }, anchor) => {
                if (sql) {
                    return;
                }

                const objKey = nestedKeyGetter(anchor);
                let subObject = rowObject[objKey];
                const subIndex = {
                    rowObject: subObject,
                };

                if (list) {
                    if (!subObject) {
                        // associated entity not in result set, probably when custom projection is used
                        rowObject[objKey] = [];
                        return;
                    }

                    rowObject[objKey] = [subObject];

                    // many to *
                    if (subObject[key] == null) {
                        // when custom projection is used
                        subObject = null;
                    }
                }

                if (subObject) {
                    if (subAssocs) {
                        subIndex.subIndexes = buildSubIndexes(subObject, subAssocs);
                    }

                    indexes[objKey] = subObject[key]
                        ? {
                              [subObject[key]]: subIndex,
                          }
                        : {};
                }
            });

            return indexes;
        }

        const arrayOfObjs = [];

        // build the result object skeleton
        const tableTemplate = columns.reduce((result, col) => {
            if (col.table !== 'A') {
                const bucket = result[col.table];
                if (bucket) {
                    bucket[col.name] = null;
                } else {
                    result[col.table] = { [col.name]: null };
                }
            }

            return result;
        }, {});

        // process each row
        rows.forEach((row) => {
            const tableCache = {}; // from alias to child prop of rowObject

            // hash-style data row
            const rowObject = row.reduce((result, value, colIdx) => {
                const col = columns[colIdx];

                if (col.table === 'A') {
                    result[col.name] = value;
                } else if (value != null) {
                    // avoid a object with all null value exists
                    const bucket = tableCache[col.table];
                    if (bucket) {
                        // already nested inside
                        bucket[col.name] = value;
                    } else {
                        tableCache[col.table] = {
                            ...tableTemplate[col.table],
                            [col.name]: value,
                        };
                    }
                }

                return result;
            }, {});

            _.forOwn(tableCache, (obj, table) => {
                const nodePath = aliasMap[table];
                _.set(rowObject, nodePath, obj);
            });

            const rowKey = rowObject[self.meta.keyField];
            const existingRow = mainIndex[rowKey];
            if (existingRow) {
                return mergeRecord(existingRow, rowObject, hierarchy, []);
            }

            arrayOfObjs.push(rowObject);
            mainIndex[rowKey] = {
                rowObject,
                subIndexes: buildSubIndexes(rowObject, hierarchy),
            };
        });

        return arrayOfObjs;
    }

    /**
     * Pre-process assoicated db operation
     * @param {*} data
     * @param {*} isNew - New record flag, true for creating, false for updating
     * @returns {Array} [raw, assocs, refs];
     */
    _extractAssociations(data, isNew) {
        const raw = {};
        const assocs = {};
        const refs = {};
        const meta = this.meta.associations;

        _.forOwn(data, (v, k) => {
            if (k[0] === ':') {
                // cascade update
                const anchor = k.substr(1);
                const assocMeta = meta[anchor];
                if (!assocMeta) {
                    throw new ValidationError(`Unknown association "${anchor}" of entity "${this.meta.name}".`);
                }

                if (isNew && (assocMeta.type === 'refersTo' || assocMeta.type === 'belongsTo') && anchor in data) {
                    throw new ValidationError(
                        `Association data ":${anchor}" of entity "${this.meta.name}" conflicts with input value of field "${anchor}".`
                    );
                }

                assocs[anchor] = v;
            } else if (k[0] === '@') {
                // update by reference
                const anchor = k.substr(1);
                const assocMeta = meta[anchor];
                if (!assocMeta) {
                    throw new ValidationError(`Unknown association "${anchor}" of entity "${this.meta.name}".`);
                }

                if (assocMeta.type !== 'refersTo' && assocMeta.type !== 'belongsTo') {
                    throw new ValidationError(
                        `Association type "${assocMeta.type}" cannot be used for update by reference.`,
                        {
                            entity: this.meta.name,
                            data,
                        }
                    );
                }

                if (isNew && anchor in data) {
                    throw new ValidationError(
                        `Association reference "@${anchor}" of entity "${this.meta.name}" conflicts with input value of field "${anchor}".`
                    );
                }

                const assocAnchor = ':' + anchor;
                if (assocAnchor in data) {
                    throw new ValidationError(
                        `Association reference "@${anchor}" of entity "${this.meta.name}" conflicts with association data "${assocAnchor}".`
                    );
                }

                if (v == null) {
                    raw[anchor] = null;
                } else {
                    refs[anchor] = v;
                }
            } else {
                raw[k] = v;
            }
        });

        return [raw, assocs, refs];
    }

    async _populateReferences_(context, references) {
        const meta = this.meta.associations;

        await eachAsync_(references, async (refQuery, anchor) => {
            const assocMeta = meta[anchor];
            const ReferencedEntity = this.db.entity(assocMeta.entity);

            const { result: created } = await ReferencedEntity.findOne_({ ...refQuery, $select: [assocMeta.field] });

            if (created == null) {
                throw new ReferencedNotExistError(
                    `Referenced entity "${ReferencedEntity.meta.name}" with ${JSON.stringify(refQuery)} not exist.`
                );
            }

            context.raw[anchor] = created[assocMeta.field];
        });
    }

    async _createAssocs_(context, assocs, beforeEntityCreate) {
        const meta = this.meta.associations;
        let keyValue;

        if (!beforeEntityCreate) {
            keyValue = context.result.data[this.meta.keyField];

            if (keyValue == null) {
                if (context.result.affectedRows === 0) {
                    // insert ignored

                    const query = this.getUniqueKeyValuePairsFrom(context.result.data);
                    context.return = await this.findOne_({ $query: query }, context.connOptions);
                    if (!context.return) {
                        throw new ApplicationError(
                            'The parent entity is duplicated on unique keys different from the pair of keys used to query',
                            {
                                query,
                                data: context.return,
                                associations: assocs,
                            }
                        );
                    }
                }

                keyValue = context.result.data[this.meta.keyField];

                if (keyValue == null) {
                    throw new ApplicationError('Missing required primary key field value. Entity: ' + this.meta.name, {
                        data: context.return,
                        associations: assocs,
                    });
                }
            }
        }

        const pendingAssocs = {};
        const finished = {};

        // todo: double check to ensure including all required options
        const passOnOptions = _.pick(context.options, [
            '$skipModifiers',
            '$migration',
            '$variables',
            '$upsert',
            '$dryRun',
        ]);

        await eachAsync_(assocs, async (data, anchor) => {
            const assocMeta = meta[anchor];

            if (beforeEntityCreate && assocMeta.type !== 'refersTo' && assocMeta.type !== 'belongsTo') {
                pendingAssocs[anchor] = data;
                return;
            }

            const assocModel = this.db.entity(assocMeta.entity);

            if (assocMeta.list) {
                data = _.castArray(data);

                if (!assocMeta.field) {
                    throw new ApplicationError(
                        `Missing "field" property in the metadata of association "${anchor}" of entity "${this.meta.name}".`
                    );
                }

                return eachAsync_(data, (item) =>
                    assocModel.create_({ ...item, [assocMeta.field]: keyValue }, passOnOptions)
                );
            } else if (!isPlainObject(data)) {
                if (Array.isArray(data)) {
                    throw new ApplicationError(
                        `Invalid type of associated entity (${assocMeta.entity}) data triggered from "${this.meta.name}" entity. Singular value expected (${anchor}), but an array is given instead.`
                    );
                }

                if (!assocMeta.assoc) {
                    throw new ApplicationError(
                        `The associated field of relation "${anchor}" does not exist in the entity meta data.`
                    );
                }

                data = { [assocMeta.assoc]: data };
            }

            if (!beforeEntityCreate && assocMeta.field) {
                // hasMany or hasOne
                data = { ...data, [assocMeta.field]: keyValue };
            }

            let created = await assocModel.create_(data, passOnOptions, context.connOptions);
            
            if (
                created.affectedRows === 0 ||
                (assocModel.hasAutoIncrement && created.insertId === 0)
            ) {
                // insert ignored or upserted

                const assocQuery = assocModel.getUniqueKeyValuePairsFrom(data);

                created = await assocModel.findOne_({ $query: assocQuery }, context.connOptions);
                if (!created) {
                    throw new ApplicationError(
                        'The assoicated entity is duplicated on unique keys different from the pair of keys used to query',
                        {
                            query: assocQuery,
                            data,
                        }
                    );
                }
            }

            finished[anchor] = beforeEntityCreate ? created.data[assocMeta.field] : created.data[assocMeta.key];
        });

        if (beforeEntityCreate) {
            _.forOwn(finished, (refFieldValue, localField) => {
                context.raw[localField] = refFieldValue;
            });
        }

        return pendingAssocs;
    }

    async _updateAssocs_(context, assocs, beforeEntityUpdate, forSingleRecord) {
        const meta = this.meta.associations;

        let currentKeyValue;

        if (!beforeEntityUpdate) {
            currentKeyValue = getValueFromAny([context.options.$query, context.return], this.meta.keyField);
            if (currentKeyValue == null) {
                // should have in updating
                throw new ApplicationError('Missing required primary key field value. Entity: ' + this.meta.name);
            }
        }

        const pendingAssocs = {};

        // todo: double check to ensure including all required options
        const passOnOptions = _.pick(context.options, ['$skipModifiers', '$migration', '$variables', '$upsert']);

        await eachAsync_(assocs, async (data, anchor) => {
            const assocMeta = meta[anchor];

            if (beforeEntityUpdate && assocMeta.type !== 'refersTo' && assocMeta.type !== 'belongsTo') {
                pendingAssocs[anchor] = data;
                return;
            }

            const assocModel = this.db.entity(assocMeta.entity);

            if (assocMeta.list) {
                data = _.castArray(data);

                if (!assocMeta.field) {
                    throw new ApplicationError(
                        `Missing "field" property in the metadata of association "${anchor}" of entity "${this.meta.name}".`
                    );
                }

                const assocKeys = mapFilter(
                    data,
                    (record) => record[assocMeta.key] != null,
                    (record) => record[assocMeta.key]
                );
                const assocRecordsToRemove = {
                    [assocMeta.field]: currentKeyValue,
                };
                if (assocKeys.length > 0) {
                    assocRecordsToRemove[assocMeta.key] = { $notIn: assocKeys };
                }

                await assocModel.deleteMany_(assocRecordsToRemove, context.connOptions);

                return eachAsync_(data, (item) =>
                    item[assocMeta.key] != null
                        ? assocModel.updateOne_(
                              {
                                  ..._.omit(item, [assocMeta.key]),
                                  [assocMeta.field]: currentKeyValue,
                              },
                              {
                                  $query: {
                                      [assocMeta.key]: item[assocMeta.key],
                                  },
                                  ...passOnOptions,
                              },
                              context.connOptions
                          )
                        : assocModel.create_(
                              { ...item, [assocMeta.field]: currentKeyValue },
                              passOnOptions,
                              context.connOptions
                          )
                );
            } else if (!isPlainObject(data)) {
                if (Array.isArray(data)) {
                    throw new ApplicationError(
                        `Invalid type of associated entity (${assocMeta.entity}) data triggered from "${this.meta.name}" entity. Singular value expected (${anchor}), but an array is given instead.`
                    );
                }

                if (!assocMeta.assoc) {
                    throw new ApplicationError(
                        `The associated field of relation "${anchor}" does not exist in the entity meta data.`
                    );
                }

                // connected by
                data = { [assocMeta.assoc]: data };
            }

            if (beforeEntityUpdate) {
                if (isEmpty(data)) return;

                // refersTo or belongsTo
                let destEntityId = getValueFromAny([context.existing, context.options.$query, context.raw], anchor);

                if (destEntityId == null) {
                    if (isEmpty(context.existing)) {
                        context.existing = await this.findOne_(context.options.$query, context.connOptions);
                        if (!context.existing) {
                            throw new ValidationError(`Specified "${this.meta.name}" not found.`, {
                                query: context.options.$query,
                            });
                        }
                        destEntityId = context.existing[anchor];
                    }

                    if (destEntityId == null) {
                        if (!(anchor in context.existing)) {
                            throw new ApplicationError(
                                'Existing entity record does not contain the referenced entity id.',
                                {
                                    anchor,
                                    data,
                                    existing: context.existing,
                                    query: context.options.$query,
                                    raw: context.raw,
                                }
                            );
                        }

                        // to create the associated, existing is null

                        let created = await assocModel.create_(data, passOnOptions, context.connOptions);

                        if (created.affectedRows === 0) {
                            // insert ignored

                            const assocQuery = assocModel.getUniqueKeyValuePairsFrom(data);
                            created = await assocModel.findOne_({ $query: assocQuery }, context.connOptions);
                            if (!created) {
                                throw new ApplicationError(
                                    'The assoicated entity is duplicated on unique keys different from the pair of keys used to query',
                                    {
                                        query: assocQuery,
                                        data,
                                    }
                                );
                            }
                        }

                        context.raw[anchor] = created[assocMeta.field];
                        return;
                    }
                }

                if (destEntityId) {
                    return assocModel.updateOne_(
                        data,
                        { [assocMeta.field]: destEntityId, ...passOnOptions },
                        context.connOptions
                    );
                }

                // nothing to do for null dest entity id
                return;
            }

            await assocModel.deleteMany_({ [assocMeta.field]: currentKeyValue }, context.connOptions);

            if (forSingleRecord) {
                return assocModel.create_(
                    { ...data, [assocMeta.field]: currentKeyValue },
                    passOnOptions,
                    context.connOptions
                );
            }

            throw new Error('update associated data for multiple records not implemented');

            // return assocModel.replaceOne_({ ...data, ...(assocMeta.field ? { [assocMeta.field]: keyValue } : {}) }, null, context.connOptions);
        });

        return pendingAssocs;
    }
}

export default RelationalEntityModel;
