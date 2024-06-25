import { _, pushIntoBucket, get as _get, set as _set, isPlainObject, isEmpty } from '@kitmi/utils';
import EntityModel from '../relational/EntityModel';
import { ApplicationError, InvalidArgument } from '@kitmi/types';
import { Types } from '@kitmi/validators/allSync';
import { extractTableAndField } from '../../helpers';

const defaultNestedKeyGetter = (anchor) => ':' + anchor;

/**
 * PostgresEntityModel entity model class.
 */
class PostgresEntityModel extends EntityModel {
    /**
     * [override] Serialize value into database acceptable format.
     * @param {object} name - Name of the symbol token
     */
    _translateSymbolToken(name) {
        if (name === 'NOW') {
            return this.db.connector.raw('NOW()');
        }

        throw new Error('not support: ' + name);
    }

    /**
     * [override]
     * @param {*} value
     * @param {*} info
     */
    _serializeByTypeInfo(value, info) {
        if (info.type === 'boolean') {
            return value ? true : false;
        }

        if (info.type === 'datetime') {
            return Types.DATETIME.serialize(value);
        }

        if (info.type === 'array' && Array.isArray(value)) {
            if (info.csv) {
                return Types.ARRAY.toCsv(value);
            } else {
                return value;
            }
        }

        /* postgres support jsonb
        if (info.type === 'object') {
            return Types.OBJECT.serialize(value);
        }
        */

        return value;
    }

    _buildSelectTable(select) {
        if (select == null) {
            return [['*'], { '*': true }];
        }

        const mainTable = [];
        const joiningTable = {};
        select.forEach((field) => {
            if (field.indexOf('.') === -1) {
                mainTable.push(field);
                return;
            }

            let [tableKey, fieldName] = extractTableAndField(field);
            tableKey += '$';

            if (fieldName === '*') {
                _set(joiningTable, tableKey, '*');
                return;
            }

            let existing = _get(joiningTable, tableKey);
            if (!existing) {
                existing = [];
            } else if (existing === '*') {
                return;
            }

            existing.push(fieldName);
            _set(joiningTable, tableKey, existing);
            return;
        }, {});

        return [mainTable, joiningTable];
    }

    // f for field, o for order, d for direction
    _buildOrderByTable(orderBy) {
        let i = 0;

        if (orderBy == null) {
            return [[], {}];
        }

        if (typeof orderBy === 'string') {
            // only one field
            const info = { o: i++, d: true };
            if (orderBy.indexOf('.') === -1) {
                info.f = orderBy;
                return [[info], {}];
            }
            const table = {};
            let [tableKey, fieldName] = extractTableAndField(orderBy);
            info.f = fieldName;
            _set(table, tableKey + '$', [info]);
            return [[], table];
        }

        let mainTable = [];

        if (Array.isArray(orderBy)) {
            const joiningTable = orderBy.reduce((result, by) => {
                const info = { o: i++, d: true };

                if (by.indexOf('.') === -1) {
                    info.f = by;
                    mainTable.push(info);
                    return result;
                }

                let [tableKey, fieldName] = extractTableAndField(by);
                info.f = fieldName;
                pushIntoBucket(result, tableKey + '$', info);
                return result;
            }, {});

            return [mainTable, joiningTable];
        }

        if (isPlainObject(orderBy)) {
            const joiningTable = _.reduce(
                orderBy,
                (result, direction, by) => {
                    direction = direction === false || direction === -1 ? false : true;
                    const info = { o: i++, d: direction };

                    if (by.indexOf('.') === -1) {
                        info.f = by;
                        mainTable.push(info);
                        return result;
                    }

                    let [tableKey, fieldName] = extractTableAndField(by);
                    info.f = fieldName;
                    pushIntoBucket(result, tableKey + '$', info);
                    return result;
                },
                {}
            );

            return [mainTable, joiningTable];
        }

        throw new InvalidArgument('Invalid orderBy clause.', { orderBy });
    }

    /**
     * Preprocess relationships.
     * @param {*} findOptions
     */
    _prepareAssociations(findOptions) {
        const [normalAssocs, customAssocs] = _.partition(findOptions.$relation, (assoc) => typeof assoc === 'string');

        const associations = _.uniq(normalAssocs).sort().concat(customAssocs);
        let counter = 0;
        const cache = {};
        const [mainSelectTable, selectTable] = this._buildSelectTable(findOptions.$select);
        const [mainOrderTable, orderByTable] = this._buildOrderByTable(findOptions.$orderBy);
        const assocTable = {
            $select: mainSelectTable.length ? mainSelectTable : [this.meta.keyField],
            $order: mainOrderTable,
        };

        if (mainSelectTable.length === 1 && mainSelectTable[0] === '*' && isEmpty(selectTable)) {
            selectTable['*'] = true;
        }

        associations.forEach((assoc) => {
            if (isPlainObject(assoc)) {
                throw new Error('To be implemented.');
                // todo: to review later
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
                              assoc.model._normalizeQuery({
                                  ...assoc.dataset,
                                  $variables: findOptions.$variables,
                              })
                          )
                        : {}),
                };
            } else {
                this._buildAssocTable(assocTable, cache, assoc, assoc, selectTable, orderByTable);
            }
        });

        //console.dir(assocTable, { depth: 10 });

        return assocTable;
    }

    _pushJoinFields(selects, joinsOn, assoc) {
        const prefix = assoc + '.';
        _.each(joinsOn, (value, key) => {
            if (key.startsWith(prefix)) {
                key = key.substring(prefix.length);
                if (!selects.includes(key)) {
                    selects.push(key);
                }
            }
        });
    }

    /**
     * Load association from meta into table.
     * @param {*} parentTable - [out] Hierarchy with subAssocs as children
     * @param {*} cache - Dotted path as key
     * @param {*} assoc - Dotted path
     * @param {*} selectTable - Select table
     * @param {*} orderByTable - Order by table
     * @return {object} Association info of the specified assoc
     */
    _buildAssocTable(parentTable, cache, assoc, fullPath, selectTable, orderByTable) {
        if (cache[fullPath]) return cache[fullPath];

        const firstPos = assoc.indexOf('.');

        if (firstPos === -1) {
            // direct association
            const assocInfo = { ...this.meta.associations[assoc] };
            if (isEmpty(assocInfo)) {
                throw new InvalidArgument(`Entity "${this.meta.name}" does not have the association "${assoc}".`);
            }

            cache[fullPath] = assocInfo;

            const bucketKey = fullPath + '$';
            const hasSelect = _get(selectTable, bucketKey) ?? (selectTable['*'] ? '*' : false);

            if (hasSelect) {
                const targetEntity = this.db.entity(assocInfo.entity);

                if (hasSelect === '*') {
                    assocInfo.$select = Object.keys(targetEntity.meta.fields);
                } else {
                    // hasSelect [ f1, f2 ]
                    // does not check if the field is valid
                    assocInfo.$select = hasSelect;
                    if (!hasSelect.includes(assocInfo.key)) {
                        assocInfo.$select.push(assocInfo.key);
                    }
                    this._pushJoinFields(assocInfo.$select, assocInfo.on, assoc);
                }
            } else {
                assocInfo.$select = [assocInfo.key];
                this._pushJoinFields(assocInfo.$select, assocInfo.on, assoc);
            }

            const hasOrderBy = _get(orderByTable, bucketKey); // array of { f, o, d }
            if (hasOrderBy) {
                assocInfo.$order = hasOrderBy;
            }

            // same level joining
            if (assocInfo.type) {
                parentTable.$join || (parentTable.$join = {});
                parentTable.$join[assoc] = assocInfo;
            } else {
                if (!assocInfo.$select.includes(assocInfo.field)) {
                    assocInfo.$select.push(assocInfo.field);
                }

                parentTable.$agg || (parentTable.$agg = {});
                parentTable.$agg[assoc] = assocInfo;
            }

            return assocInfo;
        }

        const base = assoc.substr(0, firstPos);
        const remain = assoc.substr(firstPos + 1);

        let baseNode = cache[base];
        if (!baseNode) {
            baseNode = this._buildAssocTable(parentTable, cache, base, base, selectTable, orderByTable);
        }

        const baseEntity = this.db.entity(baseNode.entity);
        return baseEntity._buildAssocTable(baseNode, cache, remain, fullPath, selectTable, orderByTable);
    }

    /**
     *
     * @param {Object} result
     * @param {*} hierarchy
     * @param {*} nestedKeyGetter
     * @returns {*}
     */
    _mapRecordsToObjects(result, hierarchy, nestedKeyGetter) {
        const { data, fields, aliases } = result;

        nestedKeyGetter == null && (nestedKeyGetter = defaultNestedKeyGetter);
        const aliasMap = _.mapValues(aliases, (chain) => chain.map((anchor) => nestedKeyGetter(anchor)));

        const mainIndex = {};
        const self = this;

        // map postgres fields result into array of { table <table alias>, name: <column name> }
        const columns = fields.map((col) => {
            //if (col.table === '') {
            const pos = col.name.indexOf('_');
            if (pos > 0) {
                return {
                    table: col.name.substring(0, pos),
                    name: col.name.substring(pos + 1),
                };
            }

            return {
                table: 'A',
                name: col.name,
            };
        });

        // map flat record into hierachy
        function mergeRecord(existingRow, rowObject, associations, nodePath) {            
            return _.each(associations, ({ sql, key, list, $agg, $join }, anchor) => {
                if (sql) return;                

                const currentPath = [ ...nodePath, anchor ];

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
                    if ($agg) {
                        mergeRecord(existingSubRow, subObj, $agg, currentPath);
                    }

                    if ($join) {
                        mergeRecord(existingSubRow, subObj, $join, currentPath);
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

                    if ($agg) {
                        subIndex.subIndexes = buildSubIndexes(subObj, $agg);
                    }

                    if ($join) {
                        subIndex.subIndexes = { ...subIndex.subIndexes, ...buildSubIndexes(subObj, $join) };
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
            if (!associations) {
                return indexes;
            }

            _.each(associations, ({ sql, key, list, $agg, $join }, anchor) => {
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
                    if ($agg) {
                        subIndex.subIndexes = buildSubIndexes(subObject, $agg);
                    }

                    if ($join) {
                        subIndex.subIndexes = { ...subIndex.subIndexes, ...buildSubIndexes(subObject, $join) };
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
        data.forEach((row) => {
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

            _.each(tableCache, (obj, table) => {
                const nodePath = aliasMap[table];
                _.set(rowObject, nodePath, obj);
            });

            const rowKey = rowObject[self.meta.keyField];
            const existingRow = mainIndex[rowKey];
            if (existingRow) {
                if (hierarchy.$agg) {
                    mergeRecord(existingRow, rowObject, hierarchy.$agg, []);
                }
                if (hierarchy.$join) {
                    mergeRecord(existingRow, rowObject, hierarchy.$join, []);
                }
                return;
            }

            arrayOfObjs.push(rowObject);
            mainIndex[rowKey] = {
                rowObject,
                subIndexes: {
                    ...buildSubIndexes(rowObject, hierarchy.$agg),
                    ...buildSubIndexes(rowObject, hierarchy.$join),
                },
            };
        });

        return arrayOfObjs;
    }
}

export default PostgresEntityModel;
