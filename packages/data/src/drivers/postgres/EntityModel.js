import { _, get as _get, set as _set } from '@kitmi/utils';
import EntityModel from '../relational/EntityModel';
import { ApplicationError } from '@kitmi/types';
import { Types } from '@kitmi/validators/allSync';

import { xrCall } from '../../helpers';

const defaultNestedKeyGetter = (anchor) => ':' + anchor;

/**
 * PostgresEntityModel entity model class.
 */
class PostgresEntityModel extends EntityModel {
    get errCodeDuplicate() {
        return '23505';
    }

    /**
     * [override] Serialize value into database acceptable format.
     * @param {object} name - Name of the symbol token
     */
    _translateSymbolToken(name) {
        if (name === 'NOW') {
            return xrCall('NOW');
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

        //console.log(fields, aliasMap);

        const mainIndex = {};
        const self = this;

        // map postgres fields result into array of { table <table alias>, name: <column name> }
        const columns = fields.map((col) => {
            const l = col.name.length - 1;
            if (col.name[l] === '$') {
                return {
                    table: col.name.substring(0, l),
                };
            }

            return {
                table: 'A',
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
                if (_.isNil(rowKeyValue)) {
                    if (list && rowKeyValue == null) {
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

                    // many to *
                    if (subObject[key] == null) {
                        // when custom projection is used
                        subObject = null;
                        rowObject[objKey] = [];
                    } else {
                        rowObject[objKey] = [subObject];
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

        // process each row
        data.forEach((row) => {
            const tableCache = {}; // from alias to child prop of rowObject

            // hash-style data row
            const rowObject = row.reduce((result, value, colIdx) => {
                const col = columns[colIdx];

                if (col.table === 'A') {
                    result[col.name] = value;
                } else {
                    // avoid a object with all null value exists
                    tableCache[col.table] = value;
                }

                return result;
            }, {});

            _.forOwn(tableCache, (obj, table) => {
                const nodePath = aliasMap[table];
                let node = rowObject;
                for (let i = 0; i < nodePath.length; i++) {
                    const objKey = nodePath[i];
                    node = node[objKey] = node[objKey] || {};
                }
                Object.assign(node, obj);
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
}

export default PostgresEntityModel;
