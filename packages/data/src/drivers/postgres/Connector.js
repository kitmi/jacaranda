import { _, isEmpty, isInteger } from '@kitmi/utils';
import { InvalidArgument } from '@kitmi/types';
import { runtime, NS_MODULE } from '@kitmi/jacaranda';

import { connectionStringToObject } from '../../Connector';
import RelationalConnector from '../relational/Connector';

import { xrCol, concateParams } from '../../helpers';

const pg = runtime.get(NS_MODULE, 'pg');
if (!pg) {
    throw new Error('The `pg` module is required for the `postgres` connector.');
}

const { Pool, Client, escapeLiteral, escapeIdentifier } = pg;

const connSym = Symbol.for('conn');
const tranSym = Symbol.for('tran');

/**
 * SQL execution sequence
 * FROM clause
 * WHERE clause
 * GROUP BY clause
 * HAVING clause
 * SELECT clause
 * ORDER BY clause
 */

/**
 * Postgres data storage connector.
 * @class
 * @extends Connector
 */
class PostgresConnector extends RelationalConnector {
    static windowFunctions = new Set([
        'CUME_DIST',
        'DENSE_RANK',
        'FIRST_VALUE',
        'LAG',
        'LAST_VALUE',
        'LEAD',
        'NTH_VALUE',
        'NTILE',
        'PERCENT_RANK',
        'RANK',
        'ROW_NUMBER',
    ]);

    static windowableFunctions = new Set([
        'AVG',
        'BIT_AND',
        'BIT_OR',
        'BIT_XOR',
        'COUNT',
        'JSON_ARRAYAGG',
        'JSON_OBJECTAGG',
        'MAX',
        'MIN',
        'STDDEV_POP',
        'STDDEV',
        'STD',
        'STDDEV_SAMP',
        'SUM',
        'VAR_POP',
        'VARIANCE',
        'VAR_SAMP',
    ]);

    escapeValue = escapeLiteral;
    escapeId = escapeIdentifier;

    /**
     * Create a new instance of the connector.
     * @param {App} app
     * @param {string} connectionString
     * @param {object} options
     */
    constructor(app, connectionString, options) {
        super(app, 'postgres', connectionString, options);

        this.acitveClients = new WeakSet();
        this.executedCount = 0;
        this.transactionId = 0;
    }

    /**
     * [override] Database sub-collection.
     * @member {string}
     */
    get collection() {
        if (!this._dbSchema) {
            this._dbSchema = new URL(this.connectionString).searchParams.get('schema') || 'public';
        }

        return this._dbSchema;
    }

    /**
     * [override] Get the db name to be used in cross-db join.
     * @member {string}
     */
    get crossJoinDbName() {
        return this.collection;
    }

    specParamToken(index) {
        return `$?`;
    }

    specInClause(index) {
        /*
         * @see https://github.com/brianc/node-postgres/wiki/FAQ#11-how-do-i-build-a-where-foo-in--query-to-find-rows-matching-an-array-of-values
         */
        return ` = ANY ($${index})`; // mysql ' IN (?)'
    }

    specNotInClause(index) {
        return ` <> ALL ($${index})`; // mysql ' NOT IN (?)'
    }

    specCsvSetHas(fieldName, value) {
        // mysql 'FIND_IN_SET(?, ?) > 0'
        return `(${fieldName} @> ARRAY[${value}])`;
    }

    /**
     * Close all connection initiated by this connector.
     */
    async end_() {
        if (this.acitveClients.size > 0) {
            for (const client of this.acitveClients) {
                await this.disconnect_(client);
            }
        }

        if (this.pool) {
            await this.pool.end();
            if (this.options.logConnection) {
                this.app.log('info', `Close connection pool "${this.pool[connSym]}".`);
            }
            delete this.pool[connSym];
            delete this.pool;
        }
    }

    /**
     * Create a database connection based on the default connection string of the connector and given options.
     * @param {Object} [options] - Extra options for the connection, optional.
     * @property {bool} [options.createDatabase=false] - Flag to used when creating a database.
     * @returns {Promise.<Client>}
     */
    async connect_(options) {
        if (options) {
            let connProps;

            if (options.createDatabase) {
                // remove the database from connection
                if (!this.options.adminCredential) {
                    throw new InvalidArgument(
                        `"dataSource.postgres.${this.options.connectorName}.adminCredential" is required to connect with "createDatabase" option.`
                    );
                }

                connProps = {
                    username: this.options.adminCredential.username,
                    password: this.options.adminCredential.password,
                    database: 'postgres',
                };
            }

            const csKey = connProps ? this.makeNewConnectionString(connProps) : null;

            if (csKey && csKey !== this.connectionString) {
                // create standalone connection
                const client = new Client(connectionStringToObject(csKey, this.driver));
                await client.connect();

                if (this.options.logConnection) {
                    const connStrForDisplay = this.getConnectionStringWithoutCredential(csKey);
                    client[connSym] = connStrForDisplay;

                    this.app.log('info', `Create non-pool connection to "${connStrForDisplay}".`);
                }

                return client;
            }
        }

        if (!this.pool) {
            this.pool = new Pool(connectionStringToObject(this.connectionString));

            this.pool.on('error', (err) => {
                this.app.logError(err, 'Unexpected error on idle postgres client');
            });

            if (this.options.logConnection) {
                const connStrForDisplay = this.getConnectionStringWithoutCredential();
                this.pool[connSym] = connStrForDisplay;

                this.pool.on('connect', () => {
                    this.app.log('info', 'info', `Create connection pool to "${connStrForDisplay}".`, {
                        connections: this.pool.totalCount,
                    });
                });
            }
        }

        const client = await this.pool.connect();
        this.acitveClients.add(client);

        if (this.options.logConnection) {
            this.app.log('info', `Get connection from pool "${this.pool[connSym]}".`);
        }

        return client;
    }

    /**
     * Close a database connection.
     * @param {Client} client - Postgres client connection.
     */
    async disconnect_(client) {
        delete client[tranSym];

        if (this.acitveClients.has(client)) {
            if (this.options.logConnection) {
                this.app.log('info', `Release connection to pool "${this.pool[connSym]}".`);
            }
            this.acitveClients.delete(client);

            return client.release();
        } else {
            if (this.options.logConnection) {
                this.app.log('info', `Disconnect non-pool connection to "${client[connSym]}".`);
            }

            delete client[connSym];

            // not created by pool
            return client.end();
        }
    }

    /**
     * Start a transaction. Must catch error and rollback if failed!
     * @returns {Promise.<Client>}
     */
    async beginTransaction_() {
        const client = await this.connect_();
        const tid = (client[tranSym] = ++this.transactionId);
        if (this.options.logTransaction) {
            this.app.log('info', `Begins a new transaction [id: ${tid}].`);
        }
        await client.query('BEGIN');
        return client;
    }

    /**
     * Commit a transaction. [exception safe]
     * @param {Client} client - Postgres client connection.
     */
    async commit_(client) {
        try {
            await client.query('COMMIT');
            if (this.options.logTransaction) {
                const tid = client[tranSym];
                this.app.log('info', `Commits a transaction [id: ${tid}].`);
            }
        } finally {
            this.disconnect_(client);
        }
    }

    /**
     * Rollback a transaction. [exception safe]
     * @param {Client} client - Postgres client connection.
     */
    async rollback_(client) {
        try {
            await client.query('ROLLBACK;');
            const tid = client[tranSym];
            this.app.log('error', `Rollbacked a transaction [id: ${tid}].`);
        } finally {
            this.disconnect_(client);
        }
    }

    /**
     * Execute the sql statement.
     *
     * @param {String} sql - The SQL statement to execute.
     * @param {object} params - Parameters to be placed into the SQL statement.
     * @param {object} [options] - Execution options.
     * @property {string} [options.$preparedKey] - Whether to use prepared statement which is cached and re-used by connection.
     * @property {boolean} [options.$asArray] - To receive rows as array of columns instead of hash with column name as key.
     * @param {Client} [connection] - Existing connection.
     * @returns {Promise.<object>}
     */
    async execute_(sql, params, options, connection) {
        let conn;
        const { $preparedKey, $asArray, ...connOptions } = options ?? {};

        try {
            conn = connection ?? (await this.connect_(connOptions));

            const query = {
                text: sql,
                values: params,
            };

            if (this.options.logStatement && !connOptions.createDatabase) {
                const meta = { ..._.omit(options, ['$assoc', '$data']), params };
                if (connection) {
                    meta.transactionId = connection[tranSym];
                }

                this.app.log('info', sql, meta);
            }

            if ($preparedKey) {
                if (typeof $preparedKey !== 'string') {
                    throw new InvalidArgument(
                        'The `postgres` connector requires `$preparedKey` to be a string as a unique name of the query.'
                    );
                }

                query.name = $preparedKey;                
            }

            if ($asArray) {
                query.rowMode = 'array';
            }

            const res = await conn.query(query);
            this.executedCount++;

            const adapted = {
                op: res.command,
                data: res.rows,
                fields: res.fields,
                affectedRows: res.rowCount,
            };

            return adapted;
        } catch (err) {
            err.info || (err.info = {});
            Object.assign(err.info, _.omit(options, ['$assoc']));
            err.info.sql = sql;
            err.info.params = params;

            throw err;
        } finally {
            if (conn && !connection) {
                await this.disconnect_(conn);
            }
        }
    }

    /**
     * Ping the database to check if it is alive.
     * @returns {Promise.<boolean>}
     */
    async ping_() {
        const res = await this.execute_('SELECT 1 AS result');
        return res && res.data[0] === 1;
    }

    /**
     * Create a new entity.
     * @param {string} model
     * @param {object} data
     * @param {object} options
     * @param {Client} connection
     * @returns {object}
     */
    async create_(model, data, options, connection) {
        if (!data || isEmpty(data)) {
            throw new InvalidArgument(`Creating with empty "${model}" data.`);
        }

        let columns = '';
        let values = '';
        let counter = 1;
        let params = [];

        _.each(data, (v, k) => {
            columns += this.escapeId(k) + ',';
            values += `$${counter++},`;
            params.push(v);
        });

        let sql = `INSERT INTO ${this.escapeId(model)} (${columns.slice(0, -1)}) VALUES (${values.slice(0, -1)})`;
        if (options.$ignore) {
            sql += ' ON CONFLICT DO NOTHING';
        }

        if (options.$getCreated) {
            sql += ` RETURNING ${options.$getCreated
                .map((col) => (col === '*' ? '*' : this.escapeId(col)))
                .join(', ')}`;
        }

        return this.execute_(sql, params, options, connection);
    }

    /**
     * Create a new entity or update the old one if duplicate key found.
     * @param {*} model
     * @param {*} data
     * @param {*} uniqueKeys
     * @param {*} options
     * @param {object} dataOnInsert - When no duplicate record exists, extra data for inserting
     * @returns {object}
     */
    async upsert_(model, data, uniqueKeys, dataOnInsert, options, connection) {
        if (!data || isEmpty(data)) {
            throw new InvalidArgument(`Creating with empty "${model}" data.`);
        }

        const dataWithoutUK = _.omit(data, uniqueKeys);
        const insertData = { ...data, ...dataOnInsert };

        if (isEmpty(dataWithoutUK)) {
            // if dupliate, dont need to update
            return this.create_(model, insertData, { ...options, $ignore: true }, connection);
        }

        let columns = '';
        let values = '';
        let params = [];

        _.each(insertData, (v, k) => {
            columns += this.escapeId(k) + ',';
            values += `$?,`;
            params.push(v);
        });

        let sql = `INSERT INTO ${this.escapeId(model)} (${columns.slice(0, -1)}) VALUES (${values.slice(0, -1)})`;
        sql += ' ON CONFLICT DO UPDATE SET ' + this._splitColumnsAsInput(dataWithoutUK, params).join(', ');

        if (options.$getCreated) {
            sql += ` RETURNING ${options.$getCreated
                .map((col) => (col === '*' ? '*' : this.escapeId(col)))
                .join(', ')}`;
        }

        sql = this._replaceParamToken(sql, params);

        return this.execute_(sql, params, options, connection);
    }

    /**
     * Insert many records or update existings if duplicate key found.
     * @param {*} model
     * @param {array} dataArrayOnInsert
     * @param {*} uniqueKeys
     * @param {*} options
     * @param {object} dataExprOnUpdate - When duplicate record exists, the actual data used for updating
     * @returns {object}
     */
    async upsertMany_(model, fieldsOnInsert, dataArrayOnInsert, dataExprOnUpdate, options) {
        if (!dataArrayOnInsert || isEmpty(dataArrayOnInsert)) {
            throw new ApplicationError(`Upserting with empty "${model}" insert data.`);
        }

        if (!Array.isArray(dataArrayOnInsert)) {
            throw new ApplicationError('"data" to bulk upsert should be an array of records.');
        }

        if (!dataExprOnUpdate || isEmpty(dataExprOnUpdate)) {
            throw new ApplicationError(`Upserting with empty "${model}" update data.`);
        }

        if (!Array.isArray(fieldsOnInsert)) {
            throw new ApplicationError('"fields" to bulk upsert should be an array of field names.');
        }

        const sql = `INSERT INTO ?? (${fieldsOnInsert
            .map((f) => this.escapeId(f))
            .join(', ')}) VALUES ? ON DUPLICATE KEY UPDATE ?`;
        const params = [model];
        params.push(dataArrayOnInsert);
        params.push(dataExprOnUpdate);

        return this.execute_(sql, params, options);
    }

    /**
     * Insert many records in one SQL
     * @param {*} model
     * @param {*} fields
     * @param {*} data
     * @param {*} options
     * @returns {object}
     */
    async insertMany_(model, fields, data, options) {
        if (!data || isEmpty(data)) {
            throw new ApplicationError(`Creating with empty "${model}" data.`);
        }

        if (!Array.isArray(data)) {
            throw new ApplicationError('"data" to bulk insert should be an array of records.');
        }

        if (!Array.isArray(fields)) {
            throw new ApplicationError('"fields" to bulk insert should be an array of field names.');
        }

        const { insertIgnore, ...restOptions } = options || {};

        const sql = `INSERT ${insertIgnore ? 'IGNORE ' : ''}INTO ?? (${fields
            .map((f) => this.escapeId(f))
            .join(', ')}) VALUES ?`;
        const params = [model];
        params.push(data);

        return this.execute_(sql, params, restOptions);
    }

    insertOne_ = this.create_;

    /**
     * Update an existing entity.
     * @param {string} model
     * @param {object} data
     * @param {*} options
     * @property {object} [options.$where] - Where conditions
     * @property {object} [options.$assoc] - Parsed relatinships
     * @property {boolean} [options.$requireSplitColumn] - Whether to use set field=value
     * @property {integer} [options.$limit]
     * @return {object}
     */
    async update_(model, data, options, connection) {
        if (isEmpty(data)) {
            throw new InvalidArgument('Data record is empty.', {
                model,
                options: _.omit(options, ['$assoc']),
            });
        }

        if (!options.$where) {
            throw new InvalidArgument('"$where" is required for updating.', {
                model,
                options: _.omit(options, ['$assoc']),
            });
        }

        const aliasMap = { [model]: 'A' };
        let mainEntityForJoin;

        let childQuery, childJoinings, subJoinings;
        let sql = '';
        let params;

        if (options.$assoc) {
            mainEntityForJoin = model;
            [childQuery, childJoinings, subJoinings] = this._joinAssociations(
                options.$assoc,
                mainEntityForJoin,
                aliasMap,
                aliasMap,
                1
            );

            const [withSql, withParams] = this._joinWithTableClause(childQuery, true);
            sql = withSql;
            params = withParams;
        }

        sql += 'UPDATE ' + this.escapeId(model);

        if (mainEntityForJoin) {
            sql += ' A ';
            if (subJoinings.clause) {
                sql += subJoinings.clause;
            }
            if (childJoinings.clause) {
                sql += childJoinings.clause;
            }
        }

        const updateParams = [];
        sql += ' SET ' + this._splitColumnsAsInput(data, updateParams, mainEntityForJoin, aliasMap).join(', ');

        const whereParams = [];
        const whereClause = this._joinCondition(options.$where, whereParams, null, mainEntityForJoin, aliasMap);
        if (whereClause) {
            sql += ' WHERE ' + whereClause;
        }

        if (options.$getUpdated) {
            let returningFields = options.$getUpdated;

            if (returningFields === true) {
                returningFields = ['*'];
            }

            sql += ` RETURNING ${returningFields.map((col) => (col === '*' ? '*' : this.escapeId(col))).join(', ')}`;
        }

        params = concateParams(params, subJoinings?.params, childJoinings?.params, updateParams, whereParams);

        sql = this._replaceParamToken(sql, params);

        return this.execute_(sql, params, options, connection);
    }

    /**
     * Replace an existing entity or create a new one.
     * @param {string} model
     * @param {object} data
     * @param {*} options
     */
    async replace_(model, data, options) {
        const params = [model, data];

        const sql = 'REPLACE ?? SET ?';

        return this.execute_(sql, params, options);
    }

    /**
     * Remove an existing entity.
     * @param {string} model
     * @param {*} deleteOptions
     * @param {*} options
     */
    async delete_(model, options, connection) {       
        const aliasMap = { [model]: 'A' };
        let mainEntityForJoin;

        let childQuery, childJoinings, subJoinings;
        let sql = '';
        let params;

        if (options.$assoc) {
            mainEntityForJoin = model;
            [childQuery, childJoinings, subJoinings] = this._joinAssociations(
                options.$assoc,
                mainEntityForJoin,
                aliasMap,
                aliasMap,
                1
            );

            const [withSql, withParams] = this._joinWithTableClause(childQuery, true);
            sql = withSql;
            params = withParams;
        }

        sql += 'DELETE FROM ' + this.escapeId(model);

        if (mainEntityForJoin) {
            sql += ' A ';
            if (subJoinings.clause) {
                sql += subJoinings.clause;
            }
            if (childJoinings.clause) {
                sql += childJoinings.clause;
            }
        }

        const whereParams = [];
        const whereClause = this._joinCondition(options.$where, whereParams, null, mainEntityForJoin, aliasMap);
        if (whereClause) {
            sql += ' WHERE ' + whereClause;
        }

        if (options.$getDeleted) {
            let returningFields = options.$getDeleted;

            if (returningFields === true) {
                returningFields = ['*'];
            }

            sql += ` RETURNING ${returningFields.map((col) => (col === '*' ? '*' : this.escapeId(col))).join(', ')}`;
        }

        params = concateParams(params, subJoinings?.params, childJoinings?.params, whereParams);

        sql = this._replaceParamToken(sql, params);

        return this.execute_(sql, params, options, connection);
    }

    /**
     * Perform select operation.
     * @param {string} model
     * @param {object} findOptions
     * @param {Client} connection
     */
    async find_(model, findOptions, connection) {
        const sqlInfo = this.buildQuery(model, findOptions);
        return this._executeQuery_(sqlInfo, findOptions, connection);
    }

    /**
     * Build sql statement
     * @param {string|object} model - Model name or CTE object
     * @param {*} condition
     * @property {object} $assoc
     * @property {object} $where
     * @property {number} $offset - Offset
     * @property {number} $limit - Limit
     * @property {boolean|string} $totalCount - Whether to count the total number of records
     * @returns {object} { sql, params, countSql, countParams, hasJoining, aliasMap }
     */
    buildQuery(model, findOptions) {
        const { $assoc, $where, $groupBy, $offset, $limit, $totalCount } = findOptions;
        const hasTotalCount = $totalCount != null;
        let needDistinctForLimit = ($limit != null && $limit > 0) || ($offset != null && $offset > 0);

        const { fromTable, withTables, model: _model } = this._buildCTEHeader(model);
        model = _model; // replaced with CTE alias

        const aliasMap = { [model]: 'A' };

        let mainEntityForJoin;
        let childQuery, childJoinings, subSelects, subJoinings, orderBys;
        let select;

        if ($assoc) {
            mainEntityForJoin = model;
            [childQuery, childJoinings, subSelects, subJoinings, orderBys] = this._joinAssociations(
                $assoc,
                mainEntityForJoin,
                aliasMap,
                aliasMap,
                1
            );

            select = $assoc.$select;
        } else {
            select = findOptions.$select ? Array.from(findOptions.$select) : '*';
        }

        // count does not require selectParams
        //const countParams = hasTotalCount ? joiningParams.concat() : null;

        // Build select columns
        let { clause: selectClause, params: selectParams } = this._buildSelect(select, mainEntityForJoin, aliasMap, subSelects);

        if (childQuery?.length > 0) {
            selectClause += ', ' + childQuery.map((q) => `${q.alias}.*`).join(', ');
        }

        // Build from clause
        let fromAndJoin = ' FROM ' + fromTable;

        if (mainEntityForJoin) {
            fromAndJoin += ' A ';
            if (subJoinings.clause) {
                fromAndJoin += subJoinings.clause;
            }
            if (childJoinings.clause) {
                fromAndJoin += childJoinings.clause;
            }
        }

        // Build where clause
        let whereClause = '';
        const whereParams = [];

        if ($where) {
            whereClause = this._joinCondition($where, whereParams, null, mainEntityForJoin, aliasMap);

            if (whereClause) {
                whereClause = ' WHERE ' + whereClause;
                /*
                if (countParams) {
                    whereParams.forEach((p) => {
                        countParams.push(p);
                    });
                }
                    */
            }
        }

        // Build group by clause
        let groupByClause = '';
        const groupByParams = [];

        if ($groupBy) {
            groupByClause += ' ' + this._buildGroupBy($groupBy, groupByParams, mainEntityForJoin, aliasMap);
            /*
            if (countParams) {
                groupByParams.forEach((p) => {
                    countParams.push(p);
                });
            }
                */
        }

        let orderByClause = '';

        if ($assoc) {
            this._pushOrderBy($assoc, orderBys, mainEntityForJoin, aliasMap);
            orderByClause = this._sortAndJoinOrderByClause(orderBys);
        } else if (findOptions.$orderBy) {
            orderByClause += ' ' + this._buildOrderBy(findOptions.$orderBy, mainEntityForJoin, aliasMap);
        }

        // Build limit & offset clause
        const limitOffetParams = [];
        let limitOffset = this._buildLimitOffset($limit, $offset, limitOffetParams);

        const result = { aliasMap, hasJoining: mainEntityForJoin != null };

        // The field used as the key of counting or pagination
        let distinctFieldRaw;
        let distinctField;

        if (hasTotalCount || needDistinctForLimit) {
            if (typeof $totalCount !== 'string') {
                throw new InvalidArgument('The "$totalCount" should be a distinct column name for counting.');
            }

            distinctFieldRaw = $totalCount;
            distinctField = this._escapeIdWithAlias(distinctFieldRaw, mainEntity, aliasMap);
        }

        if (hasTotalCount) {
            const countSubject = 'DISTINCT(' + distinctField + ')';

            result.countSql =
                withTables + `SELECT COUNT(${countSubject}) AS count` + fromAndJoin + whereClause + groupByClause;
            result.countParams = countParams;
        }

        if (needDistinctForLimit) {
            const distinctFieldWithAlias = `${distinctField} AS key_`;
            const keysSql = orderByClause
                ? `WITH records_ AS (SELECT ${distinctFieldWithAlias}, ROW_NUMBER() OVER(${orderByClause}) AS row_${fromAndJoin}${whereClause}${groupByClause}) SELECT key_ FROM records_ GROUP BY key_ ORDER BY row_${limitOffset}`
                : `WITH records_ AS (SELECT ${distinctFieldWithAlias}${fromAndJoin}${whereClause}${groupByClause}) SELECT key_ FROM records_ GROUP BY key_${limitOffset}`;

            const keySqlAliasIndex = Object.keys(aliasMap).length;
            const keySqlAnchor = ntol(keySqlAliasIndex);

            this._joinAssociation(
                {
                    sql: keysSql,
                    params: joiningParams.concat(whereParams, groupByParams, limitOffetParams),
                    joinType: 'INNER JOIN',
                    on: {
                        [distinctFieldRaw]: {
                            $xr: 'Column',
                            name: `${keySqlAnchor}.key_`,
                        },
                    },
                    output: true,
                },
                keySqlAnchor,
                joinings,
                model,
                aliasMap,
                keySqlAliasIndex,
                joiningParams
            );

            fromAndJoin = fromClause + ' A ' + joinings.join(' ');

            result.sql =
                withTables + 'SELECT ' + selectClause + fromAndJoin + whereClause + groupByClause + orderByClause;
            result.params = selectParams.concat(joiningParams, whereParams);
        } else {
            const [withSql, withParams] = this._joinWithTableClause(childQuery, !withTables);

            const sql =
                withTables +
                withSql +
                'SELECT ' +
                selectClause +
                fromAndJoin +
                whereClause +
                groupByClause +
                orderByClause +
                limitOffset;

            result.params = concateParams(
                withParams,
                selectParams,
                subJoinings?.params,
                childJoinings?.params,
                whereParams,
                groupByParams,
                limitOffetParams
            );

            result.sql = this._replaceParamToken(sql, result.params);
        }

        return result;
    }

    _replaceParamToken(sql, params) {
        return params.reduce((_sql, p, i) => {
            return _sql.replace(`$?`, `$${i + 1}`);
        }, sql);
    }

    /**
     * Extract associations into joining clauses.
     *  [{
     *      entity: <remote entity>
     *      joinType: 'LEFT JOIN|INNER JOIN|FULL OUTER JOIN'
     *      on: join condition
     *      anchor: 'local property to place the remote entity'
     *      localField: <local field to join>
     *      remoteField: <remote field to join>
     *      $relation: { ... }
     *  }]
     *
     * @param {*} assocInfo
     * @param {*} parentAliasKey
     * @param {*} aliasMap
     * @param {*} startId
     * @returns {array} Array of [childQuery, childJoinings, selects, joinings, orderBys, startId]
     */
    _joinAssociations(assocInfo, parentAliasKey, aliasMap, innerAliasMap, startId) {
        const childQuery = []; // array of { sql, params }
        const childJoinClauses = [];
        const childJoinParams = [];
        const joinClauses = [];
        const joinParams = [];
        const orderBys = []; // array of { clause, order }
        const selectClauses = [];
        const selectParams = [];

        if (assocInfo.$agg) {
            _.each(assocInfo.$agg, (assocInfo, anchor) => {
                const [_childQuery, _childJoinings, nextId] = this._buildWithChildTable(
                    assocInfo,
                    anchor,
                    parentAliasKey,
                    aliasMap,
                    startId
                );

                startId = nextId;
                childQuery.push(..._childQuery);
                childJoinClauses.push(_childJoinings.clause);
                childJoinParams.push(..._childJoinings.params);
            });
        }

        if (assocInfo.$join) {
            _.each(assocInfo.$join, (assocInfo, anchor) => {
                const [_childQuery, _childJoinings, _select, _joinings, _orderBys, nextId] = this._joinAssociation(
                    assocInfo,
                    anchor,
                    parentAliasKey,
                    innerAliasMap,
                    startId
                );

                startId = nextId;
                childQuery.push(..._childQuery);
                childJoinClauses.push(_childJoinings.clause);
                childJoinParams.push(..._childJoinings.params);
                selectClauses.push(_select.clause);
                selectParams.push(..._select.params);
                joinClauses.push(_joinings.clause);
                joinParams.push(..._joinings.params);
                orderBys.push(..._orderBys);
            });
        }

        return [
            childQuery,
            { clause: childJoinClauses.join(''), params: childJoinParams },
            { clause: selectClauses.join(', '), params: selectParams },
            { clause: joinClauses.join(''), params: joinParams },
            orderBys,
            startId,
        ];
    }

    /**
     * Build child table query as CTE dataset.
     * @param {object} assocInfo
     * @property {string} [assocInfo.joinType="LEFT JOIN"] - Join type
     * @property {object} [assocInfo.on] - Join condition
     * @property {string} [assocInfo.alias] - Alias of the association
     * @property {string} [assocInfo.sql] - Explicit SQL statement
     * @property {array} [assocInfo.params] - Parameters for the SQL statement
     * @property {string} [assocInfo.entity] - The entity to join
     * @property {object} [assocInfo.$relation] - Sub-associations
     * @property {boolean} [assocInfo.output] - Whether to output the association
     * @param {string} anchor - The anchor of the association, usually the property name (prefixed by ":") in the parent entity
     * @param {string} parentAliasKey - The parent alias key
     * @param {object} aliasMap - Alias map
     * @param {integer} startId - The starting index for alias generation
     * @returns {array} [childQuery, joinings, startId]
     */
    _buildWithChildTable(assocInfo, anchor, parentAliasKey, aliasMap, startId) {
        const aliasKey = parentAliasKey + '.' + anchor;

        const outerAlias = this._generateAlias(startId++, anchor);
        aliasMap[aliasKey] = outerAlias;

        const alias = assocInfo.alias || this._generateAlias(startId++, anchor);
        const innerAliasMap = { [aliasKey]: alias };

        // Build join
        const [childQuery, childJoinings, extraSelects, subJoinings, orderBys, nextId] = this._joinAssociations(
            assocInfo,
            aliasKey,
            aliasMap,
            innerAliasMap,
            startId
        );
        startId = nextId;

        // Build select
        const { clause: selectClause, params: selectParams } = this._buildSelect(
            assocInfo.$select.map((f) => xrCol(f, `${alias}_${f}`)),
            aliasKey,
            innerAliasMap,
            extraSelects
        );

        // Build from clause
        let fromAndJoin = ' FROM ' + this.escapeId(assocInfo.entity) + ` ${alias} `;
        if (subJoinings.clause) {
            fromAndJoin += subJoinings.clause;
        }

        this._pushOrderBy(assocInfo, orderBys, aliasKey, innerAliasMap);
        const orderByClause = this._sortAndJoinOrderByClause(orderBys);

        const sql = `${outerAlias} AS (SELECT ${selectClause}${fromAndJoin}${orderByClause})`;
        const subParams = [];
        subParams.push(...selectParams);
        subParams.push(...subJoinings.params);
        childQuery.push({ alias: outerAlias, sql, params: subParams });

        aliasMap[aliasKey] = { outer: outerAlias, inner: alias };

        const joinings = this._buildJoin(
            assocInfo,
            outerAlias,
            parentAliasKey,
            aliasMap,
            childJoinings,
            true /*skip entity*/
        );

        _.each(innerAliasMap, (v, k) => {
            if (typeof v === 'string') {
                aliasMap[k] = { outer: outerAlias, inner: v };
            } else {
                if (k in aliasMap && typeof aliasMap[k] !== 'string') {
                    throw new Error('Unexpected alias key conflict.');
                }
                aliasMap[k] = v;
            }
        });        

        return [childQuery, joinings, startId];
    }

    /**
     * Convert an association into joining clause
     * @param {object} assocInfo
     * @property {string} [assocInfo.joinType="LEFT JOIN"] - Join type
     * @property {object} [assocInfo.on] - Join condition
     * @property {string} [assocInfo.alias] - Alias of the association
     * @property {string} [assocInfo.sql] - Explicit SQL statement
     * @property {array} [assocInfo.params] - Parameters for the SQL statement
     * @property {string} [assocInfo.entity] - The entity to join
     * @property {object} [assocInfo.$relation] - Sub-associations
     * @property {boolean} [assocInfo.output] - Whether to output the association
     * @param {string} anchor - The anchor of the association, usually the property name (prefixed by ":") in the parent entity
     * @param {array} joinings - The array to store the joining clauses
     * @param {string} parentAliasKey - The parent alias key
     * @param {object} aliasMap - The alias map
     * @param {integer} startId - The starting index for alias generation
     * @returns {array} [childQuery, childJoinings, selects, joinings, orderBys, startId]
     */
    _joinAssociation(assocInfo, anchor, parentAliasKey, aliasMap, startId) {
        const alias = assocInfo.alias || this._generateAlias(startId++, anchor);
        const aliasKey = parentAliasKey + '.' + anchor;
        aliasMap[aliasKey] = alias;

        if (assocInfo.sql) {
            throw new Error('Not implemented.');
            if (assocInfo.output) {
                aliasMap[parentAliasKey + '.' + alias] = alias;
            }

            assocInfo.params.forEach((p) => params.push(p));
            joinings.push(
                `${joinType} (${assocInfo.sql}) ${alias} ON ${this._joinCondition(
                    on,
                    params,
                    null,
                    parentAliasKey,
                    aliasMap
                )}`
            );

            return startId;
        }

        // Build join
        const [childQuery, childJoinings, subSelects, subJoinings, orderBys, nextId] = this._joinAssociations(
            assocInfo,
            aliasKey,
            aliasMap,
            aliasMap,
            startId
        );
        startId = nextId;

        const selects = this._buildSelect(
            // mark the output columns with the alias
            assocInfo.$select.map((f) => xrCol(f, `${alias}_${f}`)),
            aliasKey,
            aliasMap,
            subSelects
        );

        const joinings = this._buildJoin(assocInfo, alias, parentAliasKey, aliasMap, subJoinings);
        this._pushOrderBy(assocInfo, orderBys, parentAliasKey, aliasMap);

        return [childQuery, childJoinings, selects, joinings, orderBys, startId];
    }

    /**
     * Build join clause.
     * @param {object} assocInfo
     * @param {string} alias
     * @param {string} parentAliasKey
     * @param {object} aliasMap
     * @param {object} extraJoinings
     * @returns {object}
     */
    _buildJoin(assocInfo, alias, parentAliasKey, aliasMap, extraJoinings, skipEntity = false) {
        let { joinType, on, entity } = assocInfo;
        joinType || (joinType = 'LEFT JOIN');

        const joinParams = [];
        let joinClause = `${joinType} ${
            skipEntity ? alias : this.escapeId(entity) + ' ' + alias
        } ON ${this._joinCondition(on, joinParams, null, parentAliasKey, aliasMap)} `;

        if (extraJoinings.clause) {
            joinClause += extraJoinings.clause;
            joinParams.push(...extraJoinings.params);
        }

        return {
            clause: joinClause,
            params: joinParams,
        };
    }

    /**
     * Build select clause.
     * @param {array} selectColumns
     * @param {string} aliasKey
     * @param {object} innerAliasMap
     * @param {object} extraSelects
     * @returns {object}
     */
    _buildSelect(selectColumns, aliasKey, innerAliasMap, extraSelects) {
        const params = [];
        let clause = this._buildColumns(selectColumns, params, aliasKey, innerAliasMap);
        if (extraSelects?.clause) {
            clause += ', ' + extraSelects.clause;
            params.push(...extraSelects.params);
        }
        return { clause, params };
    }

    /**
     * Push order by clause.
     * @param {*} assocInfo
     * @param {*} orderBys
     * @param {*} parentAliasKey
     * @param {*} aliasMap
     */
    _pushOrderBy(assocInfo, orderBys, parentAliasKey, aliasMap) {
        // Build order by clause
        if (assocInfo.$order) {
            orderBys.push(
                ...assocInfo.$order.map(({ f, o, d }) => ({
                    order: o,
                    clause: this._escapeIdWithAlias(f, parentAliasKey, aliasMap) + (d ? ' ASC' : ' DESC'),
                }))
            );
        }
    }

    /**
     * Build order by clause.
     * @param {array} orderBys - Array of { o, s }, o for order, s for statement
     * @param {*} parentAliasKey
     * @param {*} aliasMap
     * @returns {string} Empty string if no order by clause
     */
    _sortAndJoinOrderByClause(orderBys) {
        let orderByClause = '';
        if (orderBys.length) {
            orderByClause =
                ' ORDER BY ' +
                _.sortBy(orderBys, 'order')
                    .map((i) => i.clause)
                    .join(', ');
        }

        return orderByClause;
    }

    _joinWithTableClause(withMoreTables, first) {
        const _params = [];
        return [
            withMoreTables?.length
                ? (first ? 'WITH ' : ', ') +
                  withMoreTables
                      .map(({ sql, params }) => {
                          _params.push(...params);
                          return sql;
                      })
                      .join(', ') +
                  ' '
                : '',
            _params,
        ];
    }

    /**
     * Execute the read query.
     * @param {*} query
     * @param {*} queryOptions
     * @param {*} options
     * @param {*} connection
     * @returns {object} { data, affectedRows, fields, [reverseAliasMap], [totalCount] }
     */
    async _executeQuery_(query, queryOptions, connection) {
        let result, totalCount;

        if (query.countSql) {
            const res = await this.execute_(query.countSql, query.countParams, queryOptions, connection);
            totalCount = res.data[0].count;
        }

        let options;

        if (query.hasJoining) {
            options = { ...queryOptions, $asArray: true };
            //todo: changed to json_build_object
            //const wrappedSql = `SELECT row_to_json(_row) FROM (${query.sql}) _row`;
            result = await this.execute_(query.sql, query.params, options, connection);            

            const reverseAliasMap = _.reduce(
                query.aliasMap,
                (result, alias, nodePath) => {
                    const _path = nodePath
                        .split('.')
                        .slice(
                            1
                        ) /* .map(n => ':' + n) changed to be padding by orm and can be customized with other key getter */;
                    if (typeof alias === 'object') {
                        result[alias.outer] = _path;
                        result[alias.inner] = _path;
                    } else {
                        result[alias] = _path;
                    }
                    return result;
                },
                {}
            );

            if (query.countSql) {
                return { ...result, aliases: reverseAliasMap, totalCount };
            }

            return { ...result, aliases: reverseAliasMap };
        } else if (queryOptions.$skipOrm) {
            options = { ...queryOptions, $asArray: true };
        }

        result = await this.execute_(query.sql, query.params, options, connection);

        if (query.countSql) {
            return { ...result, totalCount };
        }

        return result;
    }
}

PostgresConnector.driverLib = pg;

export default PostgresConnector;
