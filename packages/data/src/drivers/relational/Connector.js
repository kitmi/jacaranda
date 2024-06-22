import ntol from 'number-to-letter';
import { isPlainObject, isEmpty, snakeCase, isInteger, _ } from '@kitmi/utils';
import { ApplicationError, InvalidArgument } from '@kitmi/types';

import Connector from '../../Connector';
import { isRawSql, extractRawSql } from '../../helpers';

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
     * @param {object|array|string} condition - The condition object
     * @param {array} params - The parameters array
     * @param {string} joinOperator - 'AND' or 'OR'
     * @param {string} mainEntity - The entity name that has joining
     * @param {object} aliasMap - The alias map, dot separated key -> alias
     * @returns {string}
     */
    _joinCondition(condition, params, joinOperator, mainEntity, aliasMap) {
        if (Array.isArray(condition)) {
            if (!joinOperator) {
                joinOperator = 'OR';
            }
            return condition
                .map((c) => '(' + this._joinCondition(c, params, null, mainEntity, aliasMap) + ')')
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
                        throw new Error('"$and" operator value should be an array or plain object.');
                    }

                    return '(' + this._joinCondition(value, params, 'AND', mainEntity, aliasMap) + ')';
                }

                if (key === '$any' || key === '$or' || key.startsWith('$or_')) {
                    // for avoiding dupliate, $or_1, $or_2 is valid
                    if (!Array.isArray(value) && !isPlainObject(value)) {
                        throw new Error('"$or" operator value should be an array or plain object.');
                    }

                    return '(' + this._joinCondition(value, params, 'OR', mainEntity, aliasMap) + ')';
                }

                if (key === '$not' || key.startsWith('$not_')) {
                    if (Array.isArray(value)) {
                        if (value.length === 0) {
                            throw new Error('"$not" operator value should be non-empty.');
                        }

                        return 'NOT (' + this._joinCondition(value, params, null, mainEntity, aliasMap) + ')';
                    }

                    if (isPlainObject(value)) {
                        if (isEmpty(value)) {
                            throw new Error('"$not" operator value should be non-empty.');
                        }

                        return 'NOT (' + this._joinCondition(value, params, null, mainEntity, aliasMap) + ')';
                    }

                    if (typeof value !== 'string') {
                        throw new Error('Unsupported condition!');
                    }

                    return 'NOT (' + condition + ')';
                }

                if ((key === '$expr' || key.startsWith('$expr_')) && value.$xr && value.$xr === 'BinExpr') {
                    const left = this._packValue(value.left, params, mainEntity, aliasMap);
                    const right = this._packValue(value.right, params, mainEntity, aliasMap);
                    return left + ` ${value.op} ` + right;
                }

                return this._wrapCondition(key, value, params, mainEntity, aliasMap);
            }).join(` ${joinOperator} `);
        }

        if (typeof condition !== 'string') {
            throw new Error('Unsupported condition!\n Value: ' + JSON.stringify(condition));
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
                sql = ` OFFSET ${this.specParamToken(params.length)} LIMIT ${this.specParamToken(params.length + 1)}`;
                params.push($limit);
            } else {
                params.push($limit);
                sql = ` LIMIT ${this.specParamToken(params.length)}`;
            }
        } else if (isInteger($offset) && $offset > 0) {
            params.push($offset);
            sql = ` OFFSET ${this.specParamToken(params.length)}`;
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
    _replaceFieldNameWithAlias(fieldName, mainEntity, aliasMap) {
        if (fieldName.startsWith('::')) {
            // ::fieldName for skipping alias padding
            return this.escapeId(fieldName.substring(2));
        }

        const rpos = fieldName.lastIndexOf('.');
        if (rpos > 0) {
            const actualFieldName = fieldName.substring(rpos + 1);

            const aliasKey = mainEntity + '.' + fieldName.substring(0, rpos);

            return this._buildAliasedColumn(aliasMap, aliasMap[aliasKey], mainEntity, fieldName, actualFieldName);
        }

        if (aliasMap[fieldName] === fieldName) {
            throw new Error('To be reviewed.');
            return this.escapeId(fieldName);
        }

        return this._buildAliasedColumn(aliasMap, aliasMap[mainEntity], mainEntity, fieldName, fieldName);
    }

    _buildAliasedColumn(aliasMap, alias, mainEntity, fieldName, actualFieldName) {
        if (!alias) {
            throw new InvalidArgument(`Column reference "${fieldName}" not found in populated associations.`, {
                entity: mainEntity,
                aliasMap,
            });
        }

        if (isPlainObject(alias)) {
            return (
                alias.outer + '.' + (actualFieldName === '*' ? '*' : this.escapeId(`${alias.inner}_${actualFieldName}`))
            );
        }

        return alias + '.' + (actualFieldName === '*' ? '*' : this.escapeId(actualFieldName));
    }

    /**
     * Escape the field name with alias, skip if the field name is "*"
     * @param {string} fieldName
     * @param {string} mainEntity
     * @param {object} aliasMap
     * @returns {string}
     */
    _escapeIdWithAlias(fieldName, mainEntity, aliasMap) {
        if (mainEntity) {
            return this._replaceFieldNameWithAlias(fieldName, mainEntity, aliasMap);
        }

        return fieldName === '*' ? fieldName : this.escapeId(fieldName);
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
                        return value.value;

                    case 'Query':
                        return this._joinCondition(value.query, params, null, mainEntity, aliasMap);

                    case 'BinExpr': {
                        const left = this._packValue(value.left, params, mainEntity, aliasMap);
                        const right = this._packValue(value.right, params, mainEntity, aliasMap);
                        return left + ` ${value.op} ` + right;
                    }

                    default:
                        throw new Error(`Unknown xeml runtime type: ${value.$xr}, value: ${JSON.stringify(value)}`);
                }
            }

            value = JSON.stringify(value);
        }

        params.push(value);
        return this.specParamToken(params.length);
    }

    /**
     * Wrap a condition clause
     *
     * Value can be a literal or a plain condition object.
     *   1. fieldName, <literal>
     *   2. fieldName, { normal object }
     *
     * @param {string} fieldName - The field name in a condition object.
     * @param {*} value
     * @param {array} params - The parameters array
     * @param {string} mainEntity - The entity name that has joining
     * @param {object} aliasMap - The alias map, dot separated key -> alias
     * @param {boolean} [inject=false] - Whether to inject the value directly
     * @returns {string}
     */
    _wrapCondition(fieldName, value, params, mainEntity, aliasMap, inject) {
        if (value == null) {
            return this._escapeIdWithAlias(fieldName, mainEntity, aliasMap) + ' IS NULL';
        }

        if (Array.isArray(value)) {
            return this._wrapCondition(fieldName, { $in: value }, params, mainEntity, aliasMap, inject);
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
                            case '$exist':
                            case '$exists':
                                return (
                                    this._escapeIdWithAlias(fieldName, mainEntity, aliasMap) +
                                    (v ? ' IS NOT NULL' : 'IS NULL')
                                );

                            case '$eq':
                            case '$equal':
                                return this._wrapCondition(fieldName, v, params, mainEntity, aliasMap, inject);

                            case '$ne':
                            case '$neq':
                            case '$notEqual':
                                if (v == null) {
                                    return this._escapeIdWithAlias(fieldName, mainEntity, aliasMap) + ' IS NOT NULL';
                                }

                                if (inject) {
                                    return this._escapeIdWithAlias(fieldName, mainEntity, aliasMap) + ' <> ' + v;
                                }

                                return (
                                    this._escapeIdWithAlias(fieldName, mainEntity, aliasMap) +
                                    ` <> ${this._packValue(v, params, mainEntity, aliasMap)}`
                                );

                            case '$>':
                            case '$gt':
                            case '$greaterThan':
                                if (inject) {
                                    return this._escapeIdWithAlias(fieldName, mainEntity, aliasMap) + ' > ' + v;
                                }

                                return (
                                    this._escapeIdWithAlias(fieldName, mainEntity, aliasMap) +
                                    ` > ${this._packValue(v, params, mainEntity, aliasMap)}`
                                );

                            case '$>=':
                            case '$gte':
                            case '$greaterThanOrEqual':
                                if (inject) {
                                    return this._escapeIdWithAlias(fieldName, mainEntity, aliasMap) + ' >= ' + v;
                                }

                                return (
                                    this._escapeIdWithAlias(fieldName, mainEntity, aliasMap) +
                                    ` >= ${this._packValue(v, params, mainEntity, aliasMap)}`
                                );

                            case '$<':
                            case '$lt':
                            case '$lessThan':
                                if (inject) {
                                    return this._escapeIdWithAlias(fieldName, mainEntity, aliasMap) + ' < ' + v;
                                }

                                return (
                                    this._escapeIdWithAlias(fieldName, mainEntity, aliasMap) +
                                    ` < ${this._packValue(v, params, mainEntity, aliasMap)}`
                                );

                            case '$<=':
                            case '$lte':
                            case '$lessThanOrEqual':
                                if (inject) {
                                    return this._escapeIdWithAlias(fieldName, mainEntity, aliasMap) + ' <= ' + v;
                                }

                                return (
                                    this._escapeIdWithAlias(fieldName, mainEntity, aliasMap) +
                                    ` <= ${this._packValue(v, params, mainEntity, aliasMap)}`
                                );

                            case '$in':
                                if (isPlainObject(v) && v.$xr === 'DataSet') {
                                    const sqlInfo = this.buildQuery(v.model, v.query);
                                    sqlInfo.params && sqlInfo.params.forEach((p) => params.push(p));

                                    return (
                                        this._escapeIdWithAlias(fieldName, mainEntity, aliasMap) +
                                        ` IN (${sqlInfo.sql})`
                                    );
                                } else {
                                    if (!Array.isArray(v)) {
                                        throw new Error(
                                            'The value should be a dataset or an array when using "$in" operator.'
                                        );
                                    }

                                    if (inject) {
                                        return this._escapeIdWithAlias(fieldName, mainEntity, aliasMap) + ` IN (${v})`;
                                    }

                                    params.push(v);
                                    return (
                                        this._escapeIdWithAlias(fieldName, mainEntity, aliasMap) +
                                        this.specInClause(params.length)
                                    );
                                }

                            case '$nin':
                            case '$notIn':
                                if (isPlainObject(v) && v.$xr === 'DataSet') {
                                    const sqlInfo = this.buildQuery(v.model, v.query);
                                    sqlInfo.params && sqlInfo.params.forEach((p) => params.push(p));

                                    return (
                                        this._escapeIdWithAlias(fieldName, mainEntity, aliasMap) +
                                        ` NOT IN (${sqlInfo.sql})`
                                    );
                                } else {
                                    if (!Array.isArray(v)) {
                                        throw new Error('The value should be an array when using "$in" operator.');
                                    }

                                    if (inject) {
                                        return (
                                            this._escapeIdWithAlias(fieldName, mainEntity, aliasMap) + ` NOT IN (${v})`
                                        );
                                    }

                                    params.push(v);
                                    return (
                                        this._escapeIdWithAlias(fieldName, mainEntity, aliasMap) +
                                        this.specNotInClause(params.length)
                                    );
                                }

                            case '$startWith':
                            case '$startsWith':
                                if (typeof v !== 'string') {
                                    throw new Error('The value should be a string when using "$startWith" operator.');
                                }

                                params.push(`${v}%`);
                                return this._escapeIdWithAlias(fieldName, mainEntity, aliasMap) + ' LIKE ?';

                            case '$endWith':
                            case '$endsWith':
                                if (typeof v !== 'string') {
                                    throw new Error('The value should be a string when using "$endWith" operator.');
                                }

                                params.push(`%${v}`);
                                return this._escapeIdWithAlias(fieldName, mainEntity, aliasMap) + ' LIKE ?';

                            case '$like':
                            case '$likes':
                                if (typeof v !== 'string') {
                                    throw new Error('The value should be a string when using "$like" operator.');
                                }

                                params.push(`%${v}%`);
                                return this._escapeIdWithAlias(fieldName, mainEntity, aliasMap) + ' LIKE ?';

                            default:
                                throw new Error(`Unsupported condition operator: "${k}"!`);
                        }
                    } else {
                        throw new Error('Operator should not be mixed with condition value.');
                    }
                }).join(' AND ');
            }

            params.push(JSON.stringify(value));
            return (
                this._escapeIdWithAlias(fieldName, mainEntity, aliasMap) + ' = ' + this.specParamToken(params.length)
            );
        }

        if (inject) {
            return this._escapeIdWithAlias(fieldName, mainEntity, aliasMap) + ' = ' + value;
        }

        params.push(value);
        return this._escapeIdWithAlias(fieldName, mainEntity, aliasMap) + ' = ' + this.specParamToken(params.length);
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
        return _.map(_.castArray(columns), (col) => this._buildColumn(col, params, mainEntity, aliasMap)).join(', ');
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

        if (isPlainObject(col) && col.$xr) {
            if (col.alias) {
                /*
                const lastDotIndex = col.alias.lastIndexOf('.');                
                let alias = lastDotIndex > 0 ? col.alias.substring(lastDotIndex + 1) : col.alias;

                if (lastDotIndex > 0) {
                    throw new Error('Not implemented yet!');

                    if (!mainEntity) {
                        throw new InvalidArgument(
                            'Cascade alias is not allowed when the query has no associated entity populated.',
                            {
                                alias: col.alias,
                            }
                        );
                    }

                    const fullPath = mainEntity + '.' + col.alias.substring(0, lastDotIndex);
                    const aliasPrefix = aliasMap[fullPath];
                    if (!aliasPrefix) {
                        throw new InvalidArgument(`Invalid cascade alias. "${fullPath}" not found in associations.`, {
                            alias: col.alias,
                        });
                    }

                    alias = aliasPrefix + '_' + alias;
                }

                aliasMap[col.alias] = alias;
                */

                return (
                    this._buildColumn(_.omit(col, ['alias']), params, mainEntity, aliasMap) +
                    ' AS ' +
                    this.escapeId(col.alias)
                );
            }

            if (col.$xr.startsWith('Fun')) {
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
            }

            // Condition
            if (col.$xr.startsWith('Con')) {
                return this._joinCondition(col.expr, params, null, mainEntity, aliasMap);
            }

            // Column
            if (col.$xr.startsWith('Col')) {
                return this._escapeIdWithAlias(col.name, mainEntity, aliasMap);
            }
        }

        throw new ApplicationError(`Unknow column syntax: ${JSON.stringify(col)}`);
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
     * @param {object|array|string} groupBy
     * @property {array} [groupBy.columns] - The columns to group by
     * @property {object} [groupBy.having] - The having condition
     * @param {*} params
     * @param {string} [mainEntity] - The entity name that has joining
     * @param {*} aliasMap
     * @returns {string}
     */
    _buildGroupBy(groupBy, params, mainEntity, aliasMap) {
        if (isPlainObject(groupBy)) {
            const { columns, having } = groupBy;

            if (!columns || !Array.isArray(columns)) {
                throw new ApplicationError(`Invalid group by syntax: ${JSON.stringify(groupBy)}`);
            }

            let groupByClause = this._buildGroupByList(columns, mainEntity, aliasMap);
            const havingCluse = having && this._joinCondition(having, params, null, mainEntity, aliasMap);
            if (havingCluse) {
                groupByClause += ' HAVING ' + havingCluse;
            }

            return groupByClause;
        }

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
            return 'ORDER BY ' + this._escapeIdWithAlias(orderBy, mainEntity, aliasMap);
        }

        if (Array.isArray(orderBy))
            return 'ORDER BY ' + orderBy.map((by) => this._escapeIdWithAlias(by, mainEntity, aliasMap)).join(', ');

        if (isPlainObject(orderBy)) {
            return (
                'ORDER BY ' +
                _.map(
                    orderBy,
                    (asc, col) =>
                        this._escapeIdWithAlias(col, mainEntity, aliasMap) +
                        (asc === false || asc === -1 ? ' DESC' : '')
                ).join(', ')
            );
        }

        throw new ApplicationError(`Unknown ORDER BY syntax: ${JSON.stringify(orderBy)}`);
    }
}

export default RelationalConnector;
