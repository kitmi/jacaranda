import { _, pushIntoBucket, get as _get, set as _set, isPlainObject, isEmpty } from '@kitmi/utils';
import EntityModel from '../relational/EntityModel';
import { ApplicationError, InvalidArgument } from '@kitmi/types';
import { Types } from '@kitmi/validators/allSync';
import { extractTableAndField } from '../../helpers';

const defaultNestedKeyGetter = (anchor) => ':' + anchor;

const MainTableAsRoot = Symbol('MainTableAsRoot');

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

    /**
     * Split select fields into main table and joining table.
     * @param {*} select
     * @returns {array} [ mianTable, joiningTable ]
     *
     *
     */
    _buildSelectTable(select) {
        if (select == null) {
            return [['*'], { '*': true }];
        }

        const mainTable = [];
        const joiningTable = {};
        select.forEach(processField);

        return [mainTable, joiningTable];

        function getShortestCommon(args) {
            let shortestCommon;

            args.find((arg) => {
                if (typeof arg === 'object' && arg.$xr) {
                    const root = getXrFieldRootTable(arg);
                    if (root == null) return false;

                    if (root === MainTableAsRoot) {
                        shortestCommon = MainTableAsRoot;
                        return true;
                    }

                    if (!shortestCommon) {
                        shortestCommon = root;
                        return false;
                    }

                    if (shortestCommon.startsWith(root)) {
                        shortestCommon = root;
                        return false;
                    }

                    return false;
                }
            });

            return shortestCommon;
        }

        function getXrFieldRootTable(xrField) {
            let tableKey;

            switch (xrField.$xr) {
                case 'Column':
                    if (xrField.name.indexOf('.') === -1) {
                        return MainTableAsRoot;
                    }

                    [tableKey] = extractTableAndField(xrField.name);
                    return tableKey + '$';

                case 'Function':
                    if (xrField.args) {
                        return getShortestCommon(xrField.args);
                    }
                    return null;

                case 'BinExpr':
                    return getShortestCommon([xrField.left, xrField.right]);
            }

            throw new Error('Not supported xrField: ' + xrField.$xr);
        }

        function processField(field) {
            if (typeof field === 'object') {
                if (!field.$xr) {
                    throw new InvalidArgument('Invalid field in $select clause.', { field });
                }

                const root = getXrFieldRootTable(field);
                if (root != null) {
                    if (root === MainTableAsRoot) {
                        mainTable.push(field);
                        return;
                    }

                    let existing = _get(joiningTable, root);
                    if (!existing) {
                        existing = new Set();
                        _set(joiningTable, root, existing);
                    }
                    existing.add(fieldName);
                    return;
                }

                mainTable.push(field);
                return;
            }

            if (field.indexOf('.') === -1) {
                mainTable.push(field);
                return;
            }

            let [tableKey, fieldName] = extractTableAndField(field);
            tableKey += '$';

            let existing = _get(joiningTable, tableKey);
            if (!existing) {
                existing = new Set();
                _set(joiningTable, tableKey, existing);
            } else if (existing.has('*')) {
                // ignore if already select all
                return;
            } else if (fieldName === '*') {
                // select all fields
                const newSet = new Set();
                newSet.add('*');
                // copy existing fields if the field is an object. i.e { $xr }
                existing.forEach((f) => {
                    if (typeof f === 'object') newSet.add(f);
                });
                _set(joiningTable, tableKey, newSet);
                return;
            }

            existing.add(fieldName);
            return;
        }
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
        const associations = this._uniqueRelations(findOptions.$relation);

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
            if (typeof assoc === 'object') {
                const { anchor, alias, select, ...override } = assoc;
                if (anchor) {                    
                    this._buildAssocTable(assocTable, cache, anchor, anchor, selectTable, orderByTable, override);
                    return;
                }

                if (!alias) {
                    throw new InvalidArgument('Missing "alias" for custom association.', {
                        entity: this.meta.name,
                        assoc,
                    });
                }

                if (alias in this.meta.associations) {
                    throw new InvalidArgument(`Alias "${alias}" conflicts with a predefined association.`, {
                        entity: this.meta.name,
                        alias,
                    });
                }

                if (!assoc.entity) {
                    throw new InvalidArgument('Missing "entity" for custom association.', {
                        entity: this.meta.name,
                        alias,
                    });
                }

                const result = {
                    ...assoc   
                };  

                cache[alias] = result;
                
                assocTable.$join || (assocTable.$join = {});                
                assocTable.$join[alias] = result;
            } else {
                this._buildAssocTable(assocTable, cache, assoc, assoc, selectTable, orderByTable);
            }
        });

        //console.dir(selectTable, { depth: 10 });
        //console.dir(assocTable, { depth: 10 });       

        return assocTable;
    }

    _pushJoinFields(selects, joinsOn, assoc) {
        const prefix = assoc + '.';
        _.each(joinsOn, (value, key) => {
            if (key.startsWith(prefix)) {
                key = key.substring(prefix.length);
                selects.add(key);
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
    _buildAssocTable(parentTable, cache, assoc, fullPath, selectTable, orderByTable, override) {
        if (cache[fullPath]) return cache[fullPath];

        const lastPos = assoc.lastIndexOf('.');

        if (lastPos === -1) {
            // direct association
            const assocInfo = { ...this.meta.associations[assoc], ...override };
            if (isEmpty(assocInfo)) {
                throw new InvalidArgument(`Entity "${this.meta.name}" does not have the association "${assoc}".`);
            }

            cache[fullPath] = assocInfo;

            const bucketKey = fullPath + '$';
            const hasSelect = _get(selectTable, bucketKey) ?? (selectTable['*'] ? new Set(['*']) : false);
            const mergeSelect = new Set();

            if (hasSelect) {
                const targetEntity = this.db.entity(assocInfo.entity);

                hasSelect.forEach((field) => {
                    if (field === '*') {
                        Object.keys(targetEntity.meta.fields).forEach((f) => mergeSelect.add(f));
                        return;
                    }

                    mergeSelect.add(field);
                });
            }

            mergeSelect.add(assocInfo.key);
            this._pushJoinFields(mergeSelect, assocInfo.on, assoc);

            const hasOrderBy = _get(orderByTable, bucketKey); // array of { f, o, d }
            if (hasOrderBy) {
                assocInfo.$order = hasOrderBy;
            }

            // same level joining
            if (assocInfo.type) {
                assocInfo.$select = [...mergeSelect];
                parentTable.$join || (parentTable.$join = {});
                parentTable.$join[assoc] = assocInfo;
            } else {
                mergeSelect.add(assocInfo.field);
                assocInfo.$select = [...mergeSelect];
                parentTable.$agg || (parentTable.$agg = {});
                parentTable.$agg[assoc] = assocInfo;
            }

            return assocInfo;
        }

        const base = assoc.substring(0, lastPos);
        const remain = assoc.substring(lastPos + 1);

        let baseNode = cache[base];
        if (!baseNode) {
            baseNode = this._buildAssocTable(parentTable, cache, base, base, selectTable, orderByTable);
        }

        const baseEntity = this.db.entity(baseNode.entity);
        return baseEntity._buildAssocTable(baseNode, cache, remain, fullPath, selectTable, orderByTable, override);
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

                const currentPath = [...nodePath, anchor];

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
