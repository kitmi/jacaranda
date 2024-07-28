import ntol from 'number-to-letter';
import { isPlainObject, isEmpty, snakeCase, isInteger, _, countOfChar, prefixKeys } from '@kitmi/utils';
import { ApplicationError, InvalidArgument } from '@kitmi/types';

import Connector from '../../Connector';
import { isRawSql, extractRawSql, isSelectAll, xrCol } from '../../helpers';

const buildDataSetQuery = (opOptions, dataSet, aliasMap) => {
    let Entity = opOptions.$entity;
    if (Entity == null) {
        throw new ApplicationError('Entity instance should be prepared in the operation options for delayed DataSet.', {
            dataSet,
        });
    }

    if (Entity.meta.name !== dataSet.model) {
        Entity = Entity.db.entity(dataSet.model);
    }

    return Entity.findSql({ ...dataSet.query, $aliasMap: aliasMap });
};

class RelationalConnector extends Connector {
    /**
     * Create a new instance of the connector.
     * @param {App} app
     * @param {string} connectionString
     * @param {object} options
     * @property {boolean} [options.logStatement] - Flag to log executed SQL statement.
     * @property {boolean} [options.logConnection] - Flag to log connect and disconnect.
     * @property {boolean} [options.logTransaction] - Flag to log connect and disconnect.
     * @property {boolean} [options.verboseAlias] - Flag to use verbose alias.
     */
    constructor(app, driver, connectionString, options) {
        super(app, driver, connectionString, options);

        this.relational = true;
    }

    get specParamToken() {
        return `$?`;
    }

    /**
     * Run aggregate pipeline
     * @param {string} model
     * @param {array} pipeline
     * @param {object} [options]
     * @returns {*}
     */
    async aggregate_(model, pipeline, options, connection) {
        if (!Array.isArray(pipeline) || pipeline.length === 0) {
            throw new InvalidArgument('"pipeline" should be an unempty array.');
        }

        const [startingQuery, ..._pipeline] = pipeline;

        let query = this.buildQuery(model, startingQuery);

        _pipeline.forEach((stage, i) => {
            let _params = query.params;

            query = this.buildQuery(
                {
                    sql: query.sql,
                    alias: `_STAGE_${i}`,
                },
                stage
            );

            query.params = _params.concat(query.params);
        });

        return this._executeQuery_(query, options, connection);
    }

    /**
     * Build sql statement.
     * @param {*} model
     * @param {*} condition
     */
    buildQuery(model, opOptions) {
        let {
            $assoc,
            $select,
            $where,
            $groupBy,
            $orderBy,
            $countBy,
            $offset,
            $limit,
            $hasSubQuery,
            $aliasMap,
            $skipOrm,
        } = opOptions;

        const { fromTable, withTables, model: _model } = this._buildCTEHeader(model);
        model = _model;

        let startId = $aliasMap ? Object.keys($aliasMap).length : 0;
        const mainAlias = ntol(startId++);
        const aliasMap = { ...($aliasMap && prefixKeys($aliasMap, '_.')), [model]: mainAlias };

        let joinings;
        let mainEntityForJoin;
        const joiningParams = [];
        let directJoinings;

        let needDistinctForLimit = false;

        // build alias map first
        // cache params
        if ($assoc) {
            mainEntityForJoin = model;
            let nextId;

            [joinings, directJoinings, nextId] = this._joinAssociations(
                opOptions,
                $assoc,
                mainEntityForJoin,
                aliasMap,
                startId,
                joiningParams
            );
            startId = nextId;

            // when limit or offset is set, distinct is required, otherwise nested records will be also be counted for limit
            needDistinctForLimit = $limit != null || $offset != null;
        } else if ($hasSubQuery) {
            mainEntityForJoin = model;
        }

        // Build select columns
        if (!$skipOrm) {
            if (isSelectAll($select)) {
                const l = model.length + 1;
                $select || ($select = new Set(['*']));
                _.each(aliasMap, (v, k) => {
                    if (k !== model) {
                        $select.add(k.substring(l) + '.*');
                    }
                });
            }
        }
        const selectParams = [];
        const selectColomns = $select
            ? $skipOrm
                ? this._buildColumns($select, selectParams, mainEntityForJoin, aliasMap)
                : this._buildOrmColumns($select, selectParams, mainEntityForJoin, aliasMap)
            : '*';

        // Build from clause
        let fromClause = ' FROM ' + fromTable;
        let fromAndJoin = fromClause;
        if (mainEntityForJoin) {
            fromAndJoin += ` ${mainAlias} `;

            if ($assoc) {
                fromAndJoin = this._concatJoinClauses(fromAndJoin, directJoinings, joinings);
            }
        }

        // Build where clause
        let whereClause = '';
        const whereParams = [];

        if ($where) {
            whereClause = this._joinCondition(opOptions, $where, whereParams, null, mainEntityForJoin, aliasMap);

            if (whereClause) {
                whereClause = ' WHERE ' + whereClause;
            }
        }

        // Build group by clause
        let groupByClause = '';

        if ($groupBy) {
            groupByClause += ' ' + this._buildGroupBy($groupBy, mainEntityForJoin, aliasMap);
        }

        // Build order by clause
        let orderByClause = '';
        if ($orderBy) {
            orderByClause += ' ' + this._buildOrderBy($orderBy, mainEntityForJoin, aliasMap);
        }

        // Build limit & offset clause
        const limitOffetParams = [];
        let limitOffset = this._buildLimitOffset($limit, $offset, limitOffetParams);

        const result = { hasJoining: $assoc != null, aliasMap, startId };

        if (needDistinctForLimit) {
            const pKey = this._escapeIdWithAlias(opOptions.$key, mainEntityForJoin, aliasMap);
            const distinctFieldWithAlias = `DISTINCT(${pKey}) AS key_`;

            const keysSql = orderByClause
                ? `WITH records_ AS (SELECT ${distinctFieldWithAlias}, ROW_NUMBER() OVER(PARTITION BY ${pKey}${orderByClause}) AS row_${fromAndJoin}${whereClause}${groupByClause}) SELECT key_ FROM records_ ORDER BY row_${limitOffset}`
                : `WITH records_ AS (SELECT ${distinctFieldWithAlias}${fromAndJoin}${whereClause}${groupByClause}) SELECT key_ FROM records_ GROUP BY key_${limitOffset}`;

            let _nextId = Object.keys(aliasMap).length;
            const keySqlAnchor = ntol(_nextId++);

            const _joinings = [];
            const _directJoinings = [];
            const _joiningParams = [];

            this._joinAssociation(
                opOptions,
                {
                    alias: keySqlAnchor,
                    sql: keysSql,
                    params: joiningParams.concat(whereParams, limitOffetParams),
                    joinType: 'INNER JOIN',
                    on: {
                        [opOptions.$key]: xrCol(`${keySqlAnchor}.key_`),
                    },
                },
                keySqlAnchor,
                _joinings,
                _directJoinings,
                model,
                aliasMap,
                _nextId,
                _joiningParams
            );

            if (_joinings.length) {
                fromAndJoin += ' ' + _joinings.join(' ');
            }

            result.sql =
                withTables + 'SELECT ' + selectColomns + fromAndJoin + whereClause + groupByClause + orderByClause;
            result.params = selectParams.concat(joiningParams, _joiningParams, whereParams);
        } else {
            result.sql =
                withTables +
                'SELECT ' +
                selectColomns +
                fromAndJoin +
                whereClause +
                groupByClause +
                orderByClause +
                limitOffset;

            result.params = selectParams.concat(joiningParams, whereParams, limitOffetParams);
        }

        if ($countBy) {
            result.countSql =
                withTables +
                `SELECT COUNT(*) AS count FROM (SELECT DISTINCT ` +
                this._escapeIdWithAlias($countBy, mainEntityForJoin, aliasMap) +
                fromAndJoin +
                whereClause +
                groupByClause +
                ')';
            result.countParams = joiningParams.concat(whereParams);
        }

        return result;
    }

    _concatJoinClauses(fromAndJoin, directJoinings, joinings) {
        directJoinings.forEach((dj) => {
            fromAndJoin += `, ${dj.entity ? this.escapeId(dj.entity) : dj.sql} ${dj.alias}`;
        });

        if (joinings.length) {
            fromAndJoin += joinings.join(' ');
        }
        return fromAndJoin;
    }

    /**
     * Build CTE header and return the select from target and CTE header
     * @param {string} model
     * @returns {object} { fromTable, withTables, model }
     */
    _buildCTEHeader(model) {
        let fromTable = this.escapeId(model);
        let withTables = '';

        // CTE, used by aggregation
        if (typeof model === 'object') {
            const { sql: subSql, alias } = model;

            model = alias;
            fromTable = alias;
            withTables = `WITH ${alias} AS (${subSql}) `;
        }

        return { fromTable, withTables, model };
    }

    /**
     * Generate an alias
     * @param {*} index
     * @param {*} anchor
     * @returns {string}
     */
    _generateAlias(index, anchor) {
        if (this.options.verboseAlias) {
            return `${snakeCase(anchor).toUpperCase()}${index}`;
        }

        return ntol(index);
    }

    /**
     * Extract associations into joining clauses.
     *  {
     *      entity: <remote entity>
     *      joinType: 'LEFT JOIN|INNER JOIN|FULL OUTER JOIN'
     *      anchor: 'local property to place the remote entity'
     *      localField: <local field to join>
     *      remoteField: <remote field to join>
     *      subAssocs: { ... }
     *  }
     *
     * @param {*} opOptions
     * @param {*} associations
     * @param {*} parentAliasKey
     * @param {*} aliasMap
     * @param {*} params
     * @param {*} startId
     * @param {*} params
     * @returns {object}
     */
    _joinAssociations(opOptions, associations, parentAliasKey, aliasMap, startId, params) {
        let joinings = [];
        let directJoinings = [];

        _.each(associations, (assocInfo, anchor) => {
            startId = this._joinAssociation(
                opOptions,
                assocInfo,
                anchor,
                joinings,
                directJoinings,
                parentAliasKey,
                aliasMap,
                startId,
                params
            );
        });

        return [joinings, directJoinings, startId];
    }

    _joinAssociation(
        opOptions,
        assocInfo,
        anchor,
        joinings,
        directJoinings,
        parentAliasKey,
        aliasMap,
        startId,
        params
    ) {
        const alias = assocInfo.alias || this._generateAlias(startId++, anchor);
        let { joinType, on } = assocInfo;

        joinType || (joinType = 'LEFT JOIN');

        if (assocInfo.sql) {
            aliasMap[parentAliasKey + '.' + alias] = assocInfo.list ? { list: true, alias } : alias;

            if (assocInfo.params) {
                params.push(...assocInfo.params);
            }

            if (on == null) {
                throw new InvalidArgument('Joining custom SQL relation without "on" is not supported.', {
                    mainEntity: parentAliasKey,
                    sql: assocInfo.sql,
                });
            }

            joinings.push(
                `${joinType} (${assocInfo.sql}) ${alias} ON ${this._joinCondition(
                    opOptions,
                    on,
                    params,
                    null,
                    parentAliasKey,
                    aliasMap
                )}`
            );

            return startId;
        }

        const { entity, subAssocs, list } = assocInfo;
        const aliasKey = parentAliasKey + '.' + anchor;
        aliasMap[aliasKey] = list ? { list, alias } : alias;

        let subJoinings;
        const subJoiningParams = [];

        if (subAssocs) {
            let _directJoinings = [];
            let nextId;

            [subJoinings, _directJoinings, nextId] = this._joinAssociations(
                opOptions,
                subAssocs,
                aliasKey,
                aliasMap,
                startId,
                subJoiningParams
            );
            startId = nextId;

            if (_directJoinings.length) {
                throw new InvalidArgument('Direct joining without "on" is not supported in sub-associations.', {
                    entity: entity,
                    mainEntity: parentAliasKey,
                });
            }
        }

        if (on == null) {
            directJoinings.push({
                entity,
                alias,
            });
        } else {
            joinings.push(
                `${joinType} ${this.escapeId(entity)} ${alias} ON ${this._joinCondition(
                    opOptions,
                    on,
                    params,
                    null,
                    parentAliasKey,
                    aliasMap
                )}`
            );
        }

        if (subJoinings) {
            subJoinings.forEach((sj) => joinings.push(sj));
            params.push(...subJoiningParams);
        }

        return startId;
    }

    /**
     * SQL condition representation
     *   Rules:
     *     default:
     *        array: OR
     *        kv-pair: AND
     *     $all:
     *        array: AND
     *     $any:
     *        kv-pair: OR
     *     $not:
     *        array: not ( or )
     *        kv-pair: not ( and )
     * @param {object} opOptions
     * @param {object|array|string} condition - The condition object
     * @param {array} params - The parameters array
     * @param {string} joinOperator - 'AND' or 'OR'
     * @param {string} mainEntity - The entity name that has joining
     * @param {object} aliasMap - The alias map, dot separated key -> alias
     * @returns {string}
     */
    _joinCondition(opOptions, condition, params, joinOperator, mainEntity, aliasMap) {
        if (Array.isArray(condition)) {
            if (!joinOperator) {
                joinOperator = 'OR';
            }
            return condition
                .map((c) => '(' + this._joinCondition(opOptions, c, params, null, mainEntity, aliasMap) + ')')
                .join(` ${joinOperator} `);
        }

        if (isPlainObject(condition)) {
            if (condition.$xr) {
                return this._packValue(condition, params, mainEntity, aliasMap);
            }

            if (!joinOperator) {
                joinOperator = 'AND';
            }

            return _.map(condition, (value, key) => {
                if (key === '$all' || key === '$and' || key.startsWith('$and_')) {
                    // for avoiding duplicate, $and_1, $and_2 is valid
                    if (!Array.isArray(value) && !isPlainObject(value)) {
                        throw new InvalidArgument('"$and" operator value should be an array or plain object.', {
                            key,
                            value,
                        });
                    }

                    return '(' + this._joinCondition(opOptions, value, params, 'AND', mainEntity, aliasMap) + ')';
                }

                if (key === '$any' || key === '$or' || key.startsWith('$or_')) {
                    // for avoiding dupliate, $or_1, $or_2 is valid
                    if (!Array.isArray(value) && !isPlainObject(value)) {
                        throw new InvalidArgument('"$or" operator value should be an array or plain object.', {
                            key,
                            value,
                        });
                    }

                    return '(' + this._joinCondition(opOptions, value, params, 'OR', mainEntity, aliasMap) + ')';
                }

                if (key === '$not' || key.startsWith('$not_')) {
                    if (Array.isArray(value)) {
                        if (value.length === 0) {
                            throw new InvalidArgument('"$not" operator value should be non-empty.', {
                                key,
                                value,
                            });
                        }

                        return (
                            'NOT (' + this._joinCondition(opOptions, value, params, null, mainEntity, aliasMap) + ')'
                        );
                    }

                    if (isPlainObject(value)) {
                        if (isEmpty(value)) {
                            throw new InvalidArgument('"$not" operator value should be non-empty.', {
                                key,
                                value,
                            });
                        }

                        return (
                            'NOT (' + this._joinCondition(opOptions, value, params, null, mainEntity, aliasMap) + ')'
                        );
                    }

                    if (typeof value !== 'string') {
                        throw new InvalidArgument('Unsupported condition expression!', {
                            key,
                            value,
                        });
                    }

                    return 'NOT (' + condition + ')';
                }

                if ((key === '$expr' || key.startsWith('$expr_')) && typeof value === 'object') {
                    if (value.$xr) {
                        if (value.$xr === 'BinExpr') {
                            const left = this._packValue(value.left, params, mainEntity, aliasMap);
                            const right = this._packValue(value.right, params, mainEntity, aliasMap);
                            return left + ` ${value.op} ` + right;
                        }

                        if (value.$xr === 'Raw') {
                            if (value.params) {
                                const numParamTokens = countOfChar(value.value, this.specParamToken);
                                if (numParamTokens !== value.params.length) {
                                    throw new InvalidArgument(
                                        'Parameter placeholder count mismatch in raw SQL expression.',
                                        {
                                            expected: value.params.length,
                                            actual: numParamTokens,
                                        }
                                    );
                                }

                                params.push(...value.params);
                            }

                            return value.value;
                        }

                        throw new InvalidArgument('Unsupported $xr type in $expr.', {
                            value,
                        });
                    }

                    let dataSet;
                    let exists = true;

                    if (value.$exist || value.$exists) {
                        dataSet = value.$exist || value.$exists;
                    } else if (value.$notExist || value.$notExists) {
                        dataSet = value.$notExist || value.$notExists;
                        exists = false;
                    }

                    if (typeof dataSet === 'object') {
                        if (dataSet.$xr === 'DataSet') {
                            const sqlInfo = buildDataSetQuery(opOptions, dataSet, aliasMap);
                            sqlInfo.params && params.push(...sqlInfo.params);
                            return `(${exists ? 'EXISTS' : 'NOT EXISTS'} (${sqlInfo.sql}))`;
                        }
                    }

                    throw new InvalidArgument('Unsupported $expr value.', {
                        value,
                    });
                }

                return this._packCondition(opOptions, key, value, params, mainEntity, aliasMap);
            }).join(` ${joinOperator} `);
        }

        if (typeof condition !== 'string') {
            throw new InvalidArgument('Unsupported condition!', {
                condition,
            });
        }

        return condition;
    }

    /**
     * Build limit and offset clause
     * @param {*} $limit
     * @param {*} $offset
     * @param {*} params
     * @returns {string} '' or ' LIMIT X OFFSET Y'
     */
    _buildLimitOffset($limit, $offset, params) {
        let sql = '';

        if (isInteger($limit) && $limit > 0) {
            if (isInteger($offset) && $offset > 0) {
                params.push($offset);
                sql = ` OFFSET ${this.specParamToken} LIMIT ${this.specParamToken}`;
                params.push($limit);
            } else {
                params.push($limit);
                sql = ` LIMIT ${this.specParamToken}`;
            }
        } else if (isInteger($offset) && $offset > 0) {
            params.push($offset);
            sql = ` OFFSET ${this.specParamToken}`;
        }

        return sql;
    }

    /**
     * Convert the dot separated field name to alias padded and escaped field name
     * @param {string} fieldName - The dot separate field name or starting with "::" for skipping alias padding
     * @param {string} mainEntity - Only called when mainEntity != null
     * @param {*} aliasMap
     * @returns {string}
     */
    _escapeIdWithAlias(fieldName, mainEntity, aliasMap, dontEscape, disallowList) {
        if (fieldName.startsWith('::')) {
            // ::fieldName for skipping alias padding
            return this.escapeId(fieldName.substring(2));
        }

        const rpos = fieldName.lastIndexOf('.');
        if (rpos > 0) {
            const actualFieldName = fieldName.substring(rpos + 1);
            const basePath = fieldName.substring(0, rpos);

            let aliasKey;

            if (basePath.startsWith('_.')) {
                aliasKey = basePath;
            } else {
                if (!mainEntity) {
                    throw new InvalidArgument(
                        'Cascade alias is not allowed when the query has no associated entity populated.',
                        {
                            alias: fieldName,
                        }
                    );
                }
                aliasKey = mainEntity + '.' + basePath;
            }

            return this._buildAliasedColumn(
                aliasMap,
                aliasMap[aliasKey],
                mainEntity,
                fieldName,
                actualFieldName,
                dontEscape,
                disallowList
            );
        }

        if (!mainEntity) {
            return fieldName === '*' ? '*' : dontEscape ? fieldName : this.escapeId(fieldName);
        }

        return this._buildAliasedColumn(aliasMap, aliasMap[mainEntity], mainEntity, fieldName, fieldName, dontEscape, disallowList);
    }

    _buildAliasedColumn(aliasMap, alias, mainEntity, fieldName, actualFieldName, dontEscape, disallowList) {
        if (!alias) {
            throw new InvalidArgument(`Column reference "${fieldName}" not found in populated associations.`, {
                entity: mainEntity,
                aliasMap,
            });
        }

        if (typeof alias === 'object') {
            if (disallowList && alias.list) {
                throw new InvalidArgument(`Reference to a column "${fieldName}" in a list relation is not allowed.`, {
                    entity: mainEntity,
                    aliasMap,
                })
            }
            alias = alias.alias;
        }

        return (
            alias +
            '.' +
            (actualFieldName === '*' ? '*' : dontEscape ? actualFieldName : this.escapeId(actualFieldName))
        );
    }

    _splitColumnsAsInput(data, params, mainEntity, aliasMap) {
        return _.reduce(
            data,
            (result, v, fieldName) => {
                const _packed = this._packSetValue(fieldName, v, params, mainEntity, aliasMap);
                if (typeof _packed === 'string') {
                    result.push(_packed);
                } else {
                    result.push(..._packed);
                }
                return result;
            },
            []
        );
    }

    /**
     * Pack an array of values into params and return the parameterized string with placeholders
     * @param {*} array
     * @param {*} params
     * @param {*} mainEntity
     * @param {*} aliasMap
     * @returns {string}
     */
    _packArray(array, params, mainEntity, aliasMap) {
        return array.map((value) => this._packValue(value, params, mainEntity, aliasMap)).join(',');
    }

    /**
     * Pack a value into params and return the parameter placeholder
     * @param {*} value
     * @param {*} params
     * @param {*} mainEntity
     * @param {*} aliasMap
     * @returns {string}
     */
    _packValue(value, params, mainEntity, aliasMap) {
        if (isPlainObject(value)) {
            if (value.$xr) {
                switch (value.$xr) {
                    case 'Column':
                        return this._escapeIdWithAlias(value.name, mainEntity, aliasMap);

                    case 'Function':
                        return (
                            value.name +
                            '(' +
                            (value.args ? this._packArray(value.args, params, mainEntity, aliasMap) : '') +
                            ')'
                        );

                    case 'Raw':
                        if (value.params.length > 0) {
                            params.push(...value.params);
                        }
                        return value.value;

                    case 'BinExpr': {
                        const left = this._packValue(value.left, params, mainEntity, aliasMap);
                        const right = this._packValue(value.right, params, mainEntity, aliasMap);
                        return '(' + left + ` ${value.op} ` + right + ')';
                    }

                    default:
                        throw new Error(`Unknown xeml runtime type: ${value.$xr}, value: ${JSON.stringify(value)}`);
                }
            }
        }

        params.push(value);
        return this.specParamToken;
    }

    /**
     * Pack a condition clause
     *
     * Value can be a literal or a plain condition object.
     *   1. fieldName, <literal>
     *   2. fieldName, { normal object }
     *
     * @param {object} opOptions
     * @param {string} fieldName - The field name in a condition object.
     * @param {*} value
     * @param {array} params - The parameters array
     * @param {string} mainEntity - The entity name that has joining
     * @param {object} aliasMap - The alias map, dot separated key -> alias
     * @returns {string}
     */
    _packCondition(opOptions, fieldName, value, params, mainEntity, aliasMap) {
        if (value == null) {
            return this._escapeIdWithAlias(fieldName, mainEntity, aliasMap) + ' IS NULL';
        }

        if (Array.isArray(value)) {
            return this._packCondition(opOptions, fieldName, { $in: value }, params, mainEntity, aliasMap);
        }

        if (typeof value === 'object') {
            if (value.$xr) {
                return (
                    this._escapeIdWithAlias(fieldName, mainEntity, aliasMap) +
                    ' = ' +
                    this._packValue(value, params, mainEntity, aliasMap)
                );
            }

            const hasOperator = _.find(Object.keys(value), (k) => k && k[0] === '$');

            if (hasOperator) {
                return _.map(value, (v, k) => {
                    if (k && k[0] === '$') {
                        // operator
                        switch (k) {
                            case '$exist':
                            case '$exists':
                                return (
                                    this._escapeIdWithAlias(fieldName, mainEntity, aliasMap) +
                                    (v ? ' IS NOT NULL' : 'IS NULL')
                                );

                            case '$notExist':
                            case '$notExists':
                                return (
                                    this._escapeIdWithAlias(fieldName, mainEntity, aliasMap) +
                                    (v ? ' IS NULL' : 'IS NOT NULL')
                                );

                            case '$eq':
                            case '$equal':
                                return this._packCondition(opOptions, fieldName, v, params, mainEntity, aliasMap);

                            case '$ne':
                            case '$neq':
                            case '$notEqual':
                                if (v == null) {
                                    return this._escapeIdWithAlias(fieldName, mainEntity, aliasMap) + ' IS NOT NULL';
                                }

                                return (
                                    this._escapeIdWithAlias(fieldName, mainEntity, aliasMap) +
                                    ` <> ${this._packValue(v, params, mainEntity, aliasMap)}`
                                );

                            case '$>':
                            case '$gt':
                            case '$greaterThan':
                                return (
                                    this._escapeIdWithAlias(fieldName, mainEntity, aliasMap) +
                                    ` > ${this._packValue(v, params, mainEntity, aliasMap)}`
                                );

                            case '$>=':
                            case '$gte':
                            case '$greaterThanOrEqual':
                                return (
                                    this._escapeIdWithAlias(fieldName, mainEntity, aliasMap) +
                                    ` >= ${this._packValue(v, params, mainEntity, aliasMap)}`
                                );

                            case '$<':
                            case '$lt':
                            case '$lessThan':
                                return (
                                    this._escapeIdWithAlias(fieldName, mainEntity, aliasMap) +
                                    ` < ${this._packValue(v, params, mainEntity, aliasMap)}`
                                );

                            case '$<=':
                            case '$lte':
                            case '$lessThanOrEqual':
                                return (
                                    this._escapeIdWithAlias(fieldName, mainEntity, aliasMap) +
                                    ` <= ${this._packValue(v, params, mainEntity, aliasMap)}`
                                );

                            case '$between':
                                if (!Array.isArray(v) || v.length !== 2) {
                                    throw new InvalidArgument(
                                        'The value should be an array with 2 elements when using "$between" operator.',
                                        {
                                            value: v,
                                        }
                                    );
                                }

                                params.push(v[0]);
                                params.push(v[1]);
                                return (
                                    this._escapeIdWithAlias(fieldName, mainEntity, aliasMap) +
                                    ` BETWEEN ${this.specParamToken} AND ${this.specParamToken}`
                                );

                            case '$notBetween':
                                if (!Array.isArray(v) || v.length !== 2) {
                                    throw new InvalidArgument(
                                        'The value should be an array with 2 elements when using "$notBetween" operator.',
                                        {
                                            value: v,
                                        }
                                    );
                                }

                                params.push(v[0]);
                                params.push(v[1]);
                                return (
                                    this._escapeIdWithAlias(fieldName, mainEntity, aliasMap) +
                                    ` NOT BETWEEN ${this.specParamToken} AND ${this.specParamToken}`
                                );

                            case '$in':
                                if (Array.isArray(v)) {
                                    params.push(v);
                                    return this._escapeIdWithAlias(fieldName, mainEntity, aliasMap) + this.specInClause;
                                }

                                if (typeof v === 'object') {
                                    if (v.$xr === 'Raw') {
                                        v.params && v.params.forEach((p) => params.push(p));

                                        return (
                                            this._escapeIdWithAlias(fieldName, mainEntity, aliasMap) +
                                            ` IN (${v.value})`
                                        );
                                    }

                                    if (v.$xr === 'DataSet') {
                                        const sqlInfo = buildDataSetQuery(opOptions, v, aliasMap);
                                        sqlInfo.params && params.push(...sqlInfo.params);

                                        return (
                                            this._escapeIdWithAlias(fieldName, mainEntity, aliasMap) +
                                            ` IN (${sqlInfo.sql})`
                                        );
                                    }
                                }

                                throw new InvalidArgument(
                                    'The value should be a dataset or an array when using "$in" operator.',
                                    {
                                        value: v,
                                    }
                                );

                            case '$nin':
                            case '$notIn':
                                if (Array.isArray(v)) {
                                    params.push(v);
                                    return (
                                        this._escapeIdWithAlias(fieldName, mainEntity, aliasMap) + this.specNotInClause
                                    );
                                }

                                if (typeof v === 'object') {
                                    if (v.$xr === 'Raw') {
                                        v.params && v.params.forEach((p) => params.push(p));

                                        return (
                                            this._escapeIdWithAlias(fieldName, mainEntity, aliasMap) +
                                            ` NOT IN (${v.value})`
                                        );
                                    }

                                    if (v.$xr === 'DataSet') {
                                        const sqlInfo = buildDataSetQuery(opOptions, v, aliasMap);
                                        sqlInfo.params && params.push(...sqlInfo.params);

                                        return (
                                            this._escapeIdWithAlias(fieldName, mainEntity, aliasMap) +
                                            ` NOT IN (${sqlInfo.sql})`
                                        );
                                    }
                                }

                                throw new InvalidArgument(
                                    'The value should be an array when using "$notIn" operator.',
                                    {
                                        value: v,
                                    }
                                );

                            case '$startWith':
                            case '$startsWith':
                                if (typeof v !== 'string') {
                                    throw new InvalidArgument(
                                        'The value should be a string when using "$startWith" operator.',
                                        {
                                            value: v,
                                        }
                                    );
                                }

                                params.push(`${v}%`);
                                return this._escapeIdWithAlias(fieldName, mainEntity, aliasMap) + ' LIKE ?';

                            case '$endWith':
                            case '$endsWith':
                                if (typeof v !== 'string') {
                                    throw new InvalidArgument(
                                        'The value should be a string when using "$endWith" operator.',
                                        {
                                            value: v,
                                        }
                                    );
                                }

                                params.push(`%${v}`);
                                return this._escapeIdWithAlias(fieldName, mainEntity, aliasMap) + ' LIKE ?';

                            case '$like':
                            case '$likes':
                                if (typeof v !== 'string') {
                                    throw new InvalidArgument(
                                        'The value should be a string when using "$like" operator.',
                                        {
                                            value: v,
                                        }
                                    );
                                }

                                params.push(`%${v}%`);
                                return (
                                    this._escapeIdWithAlias(fieldName, mainEntity, aliasMap) +
                                    ' LIKE ' +
                                    this.specParamToken
                                );

                            case '$filter':
                                if (typeof v !== 'object') {
                                    throw new InvalidArgument(
                                        'The value should be an object when using "$filter" operator.',
                                        {
                                            value: v,
                                        }
                                    );
                                }
                                params.push(v);
                                return (
                                    this._escapeIdWithAlias(fieldName, mainEntity, aliasMap) +
                                    ' @> ' +
                                    this.specParamToken
                                );

                            default:
                                break;
                        }

                        throw new InvalidArgument(`Unsupported condition operator: "${k}"!`, {
                            key: fieldName,
                            value: v,
                        });
                    } else {
                        throw new InvalidArgument('Operator should not be mixed with condition value.', {
                            key: fieldName,
                            value,
                        });
                    }
                }).join(' AND ');
            }
        }

        params.push(value);
        return this._escapeIdWithAlias(fieldName, mainEntity, aliasMap) + ' = ' + this.specParamToken;
    }

    _packSetValue(fieldName, value, params, mainEntity, aliasMap) {
        if (value == null) {
            return this._escapeIdWithAlias(fieldName, mainEntity, aliasMap) + ' = NULL';
        }

        if (isPlainObject(value)) {
            if (value.$xr) {
                return (
                    this._escapeIdWithAlias(fieldName, mainEntity, aliasMap) +
                    ' = ' +
                    this._packValue(value, params, mainEntity, aliasMap)
                );
            }

            const hasOperator = _.find(Object.keys(value), (k) => k && k[0] === '$');

            if (hasOperator) {
                return _.map(value, (v, k) => {
                    if (k && k[0] === '$') {
                        // operator
                        switch (k) {
                            case '$set':
                                if (typeof v !== 'object') {
                                    throw new InvalidArgument(
                                        'The value should be an object when using "$set" operator.',
                                        {
                                            value: v,
                                        }
                                    );
                                }

                                params.push(v.value);

                                if (v.at) {
                                    const dontEscape = true;
                                    let index;

                                    if (typeof v.at === 'object') {
                                        if (v.at.$xr !== 'Column') {
                                            throw new InvalidArgument(
                                                'Invalid "$set" operator value. "$at" should be a column reference or one-based index literal.',
                                                {
                                                    value: v,
                                                }
                                            );
                                        }

                                        index = this._escapeIdWithAlias(v.at.name, mainEntity, aliasMap, dontEscape);
                                    } else {
                                        if (v.at <= 0) {
                                            throw new InvalidArgument(
                                                'Invalid "$set" operator value. "$at" should be a positive integer.',
                                                {
                                                    value: v,
                                                }
                                            );
                                        }

                                        index = v.at;
                                    }

                                    return (
                                        this._escapeIdWithAlias(fieldName, mainEntity, aliasMap) +
                                        `[${index}] = ` +
                                        this.specParamToken
                                    );
                                } else if (v.key) {
                                    const accessor = v.key
                                        .split('.')
                                        .map((k) => `[${this.escapeValue(k)}]`)
                                        .join('');

                                    return (
                                        this._escapeIdWithAlias(fieldName, mainEntity, aliasMap) +
                                        accessor +
                                        ' = ' +
                                        this.specParamToken
                                    );
                                }

                                throw new InvalidArgument(
                                    'Invalid "$set" operator value. Either "at" or "key" should be provided.',
                                    {
                                        value: v,
                                    }
                                );

                            default:
                                break;
                        }

                        throw new InvalidArgument(`Unsupported set value operator: "${k}"!`, {
                            key: fieldName,
                            value: v,
                        });
                    } else {
                        throw new InvalidArgument('Operator should not be mixed with condition value.', {
                            key: fieldName,
                            value,
                        });
                    }
                });
            }
        }

        params.push(value);
        return this._escapeIdWithAlias(fieldName, mainEntity, aliasMap) + ' = ' + this.specParamToken;
    }

    /**
     * Build column list
     * @param {array} columns
     * @param {array} params
     * @param {*} mainEntity
     * @param {*} aliasMap
     * @returns {string}
     */
    _buildColumns(columns, params, mainEntity, aliasMap) {
        let colList = '';
        columns.forEach((col) => (colList += this._buildColumn(col, params, mainEntity, aliasMap) + ', '));
        return colList.substring(0, colList.length - 2);
    }

    /**
     *
     * @param {string|number|object} col - The column object or string, quoted string will be treated as raw SQL
     * @property {string} [col.alias] - The alias of the column, can be a dot separated string
     * @property {string} [col.$xr] - The type of the column, "function" | "func", "expression" | "expr, "column" | "col"
     * @property {string} [col.name] - The column name
     * @property {string} [col.prefix] - The prefix of the function, like DISTINCT
     * @property {array} [col.args] - The arguments of the function
     * @property {object} [col.over] - The window function over clause
     * @property {array} [col.over.$partitionBy] - The partition by clause
     * @property {array} [col.over.$orderBy] - The order by clause
     * @property {string} [col.over.$nulls] - The nulls clause, FIRST | LAST
     * @param {*} params
     * @param {*} mainEntity
     * @param {*} aliasMap
     * @returns {string}
     */
    _buildColumn(col, params, mainEntity, aliasMap) {
        if (typeof col === 'string') {
            // it's a string if it's quoted when passed in
            return isRawSql(col) ? extractRawSql(col) : this._escapeIdWithAlias(col, mainEntity, aliasMap);
        }

        if (typeof col === 'number') {
            return col;
        }

        if (typeof col === 'object' && col.$xr) {
            if (col.alias) {
                return (
                    this._buildColumn(_.omit(col, ['alias']), params, mainEntity, aliasMap) +
                    ' AS ' +
                    this.escapeId(col.alias)
                );
            }

            switch (col.$xr) {
                // Function
                case 'Function':
                    const name = col.name.toUpperCase();
                    if (name === 'COUNT' && col.args.length === 1 && col.args[0] === '*') {
                        return 'COUNT(*)';
                    }

                    if (this.constructor.windowFunctions.has(name)) {
                        if (!col.over) {
                            throw new InvalidArgument(`"${name}" window function requires over clause.`);
                        }
                    } else if (!this.constructor.windowableFunctions.has(name) && col.over) {
                        throw new InvalidArgument(`"${name}" function does not support over clause.`);
                    }

                    let funcClause =
                        name +
                        '(' +
                        (col.prefix ? `${col.prefix.toUpperCase()} ` : '') +
                        (col.args ? this._buildColumns(col.args, params, mainEntity, aliasMap) : '') +
                        ')';

                    if (col.over) {
                        funcClause += ' OVER(';
                        if (col.over.$partitionBy) {
                            funcClause += this._buildPartitionBy(col.over.$partitionBy, mainEntity, aliasMap);
                        }

                        if (col.over.$orderBy) {
                            if (!funcClause.endsWith('(')) {
                                funcClause += ' ';
                            }
                            funcClause += this._buildOrderBy(col.over.$orderBy, mainEntity, aliasMap);
                        }

                        if (col.over.$nulls) {
                            funcClause += ' NULLS ' + col.over.$nulls; // FIRST | LAST
                        }

                        funcClause += ')';
                    }

                    return funcClause;

                // BinExpr
                case 'BinExpr':
                    return this._packValue(col, params, mainEntity, aliasMap);

                // Column
                case 'Column':
                    return this._escapeIdWithAlias(col.name, mainEntity, aliasMap);

                case 'OpGet':
                    const accessor =
                        typeof col.key === 'string'
                            ? col.key
                                  .split('.')
                                  .map((k) => `[${this.escapeValue(k)}]`)
                                  .join('')
                            : `[${col.key}]`;
                    return this._escapeIdWithAlias(col.field, mainEntity, aliasMap) + accessor;
            }
        }

        throw new ApplicationError(`Unknown column syntax: ${JSON.stringify(col)}`);
    }

    /**
     * Build group by column
     * @param {string|object} groupBy
     * @param {*} mainEntity
     * @param {*} aliasMap
     * @returns {string}
     */
    _buildGroupByColumn(groupBy, mainEntity, aliasMap) {
        if (typeof groupBy === 'string') {
            return isRawSql(groupBy) ? extractRawSql(groupBy) : this._escapeIdWithAlias(groupBy, mainEntity, aliasMap);
        }

        if (typeof groupBy === 'object') {
            if (groupBy.alias) {
                return this._escapeIdWithAlias(groupBy.alias, mainEntity, aliasMap);
            }
        }

        throw new ApplicationError(`Unknown GROUP BY syntax: ${JSON.stringify(groupBy)}`);
    }

    /**
     * Build group by column list
     * @param {array|string} groupBy
     * @param {*} mainEntity
     * @param {*} aliasMap
     * @returns {string}
     */
    _buildGroupByList(groupBy, mainEntity, aliasMap) {
        if (Array.isArray(groupBy)) {
            return 'GROUP BY ' + groupBy.map((by) => this._buildGroupByColumn(by, mainEntity, aliasMap)).join(', ');
        }

        return 'GROUP BY ' + this._buildGroupByColumn(groupBy, mainEntity, aliasMap);
    }

    /**
     * Build group by clause from groupBy object
     * @param {array|string} groupBy
     * @param {string} [mainEntity] - The entity name that has joining
     * @param {*} aliasMap
     * @returns {string}
     */
    _buildGroupBy(groupBy, mainEntity, aliasMap) {
        return this._buildGroupByList(groupBy, mainEntity, aliasMap);
    }

    /**
     * Build partition by clause
     * @param {*} partitionBy
     * @param {*} mainEntity
     * @param {*} aliasMap
     * @returns {string}
     */
    _buildPartitionBy(partitionBy, mainEntity, aliasMap) {
        if (typeof partitionBy === 'string') {
            return 'PARTITION BY ' + this._escapeIdWithAlias(partitionBy, mainEntity, aliasMap);
        }

        if (Array.isArray(partitionBy)) {
            return (
                'PARTITION BY ' + partitionBy.map((by) => this._escapeIdWithAlias(by, mainEntity, aliasMap)).join(', ')
            );
        }

        throw new ApplicationError(`Unknown PARTITION BY syntax: ${JSON.stringify(partitionBy)}`);
    }

    /**
     * Build order by clause
     * @param {string|array|object} orderBy
     * @param {*} mainEntity
     * @param {*} aliasMap
     * @returns {string}
     *
     * @example
     * $orderBy: 'name' => 'ORDER BY A.name'
     * $orderBy: ['name', 'age'] => 'ORDER BY A.name, A.age'
     * $orderBy: { name: -1, age: 1 } => 'ORDER BY A.name DESC, A.age ASC'
     */
    _buildOrderBy(orderBy, mainEntity, aliasMap) {
        if (typeof orderBy === 'string') {
            return 'ORDER BY ' + this._escapeIdWithAlias(orderBy, mainEntity, aliasMap, null, true);
        }

        if (Array.isArray(orderBy))
            return 'ORDER BY ' + orderBy.map((by) => this._escapeIdWithAlias(by, mainEntity, aliasMap, null, true)).join(', ');

        if (isPlainObject(orderBy)) {
            return (
                'ORDER BY ' +
                _.map(
                    orderBy,
                    (asc, col) =>
                        this._escapeIdWithAlias(col, mainEntity, aliasMap, null, true) +
                        (asc === false || asc === -1 ? ' DESC' : '')
                ).join(', ')
            );
        }

        throw new ApplicationError(`Unknown ORDER BY syntax: ${JSON.stringify(orderBy)}`);
    }
}

export default RelationalConnector;
