import ntol from 'number-to-letter';
import { _, isEmpty, prefixKeys } from '@kitmi/utils';
import { InvalidArgument, ApplicationError } from '@kitmi/types';
import { runtime, NS_MODULE } from '@kitmi/jacaranda';

import { connectionStringToObject } from '../../Connector';
import RelationalConnector from '../relational/Connector';

import { isRawSql, extractRawSql, concateParams } from '../../helpers';

const pg = runtime.get(NS_MODULE, 'pg');
if (!pg) {
    throw new Error('The `pg` module is required for the `postgres` connector.');
}

pg.types.setTypeParser(pg.types.builtins.TIMESTAMP, stringValue => stringValue?.split(' ').join('T'));

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

    get specInClause() {
        /*
         * @see https://github.com/brianc/node-postgres/wiki/FAQ#11-how-do-i-build-a-where-foo-in--query-to-find-rows-matching-an-array-of-values
         */
        return ` = ANY (${this.specParamToken})`; // mysql ' IN (?)'
    }

    get specNotInClause() {
        return ` <> ALL (${this.specParamToken})`; // mysql ' NOT IN (?)'
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
        if (options) {
            delete options.$entity;
        }

        if (params && params.length) {
            sql = this._replaceParamToken(sql, params);
        }

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

                this.app.log('info', _.truncate(sql, { length: 1000 }), meta);
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
        let params = [];

        _.each(data, (v, k) => {
            columns += this.escapeId(k) + ',';
            values += this._packValue(v, params) + ',';
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
     * Create a new entity from a select result.
     * @param {string} model
     * @param {object} data
     * @param {object} options
     * @param {Client} connection
     * @returns {object}
     */
    async createFrom_(model, findOptions, insertColumns, connection) {
        const sqlInfo = this.buildQuery(model, findOptions);

        let columns = '';

        _.each(insertColumns, (v) => {
            columns += this.escapeId(v) + ',';
        });

        let sql = `INSERT INTO ${this.escapeId(model)} (${columns.slice(0, -1)}) ${sqlInfo.sql}`;

        if (findOptions.$getCreated) {
            sql += ` RETURNING ${findOptions.$getCreated
                .map((col) => (col === '*' ? '*' : this.escapeId(col)))
                .join(', ')}`;
        }

        return this.execute_(sql, sqlInfo.params, findOptions, connection);
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
        let conflicts = '';
        let values = '';
        let params = [];

        _.each(data, (v, k) => {
            columns += this.escapeId(k) + ',';
            values += this._packValue(v, params) + ',';
        });

        uniqueKeys.forEach((k) => {
            conflicts += this.escapeId(k) + ',';
        });

        let sql = `INSERT INTO ${this.escapeId(model)} (${columns.slice(0, -1)}) VALUES (${values.slice(0, -1)})`;
        sql += ` ON CONFLICT (${conflicts.slice(0, -1)}) DO UPDATE SET ` + this._splitColumnsAsInput(dataWithoutUK, params).join(', ');

        if (options.$getCreated) {
            sql += ` RETURNING ${options.$getCreated
                .map((col) => (col === '*' ? '*' : this.escapeId(col)))
                .join(', ')}`;
        }

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
                options,
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
        const whereClause = this._joinCondition(options, options.$where, whereParams, null, mainEntityForJoin, aliasMap);
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
                options,
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
        const whereClause = this._joinCondition(options, options.$where, whereParams, null, mainEntityForJoin, aliasMap);
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

    _buildOrmColumns(columns, params, mainEntity, aliasMap) {
        const columnsSet = { _: [] };
        columns.forEach((col) => this._buildOrmColumn(col, mainEntity, aliasMap, columnsSet));
        const columnList = [];

        columnsSet._.forEach((col) => {
            if (typeof col === 'string') {
                columnList.push(col);
            } else {
                columnList.push(col.clause);
                params.push(...col.params);
            }
        });
        delete columnsSet._;

        _.each(columnsSet, (cols, alias) => {
            if (cols.has('*')) {
                columnList.push(`row_to_json(${alias}.*) AS ${this.escapeId(alias+'$')}`);
                return;
            }

            const list = [];

            cols.forEach((col) => {
                list.push(`'${col}', ${alias}.${this.escapeId(col)}`);
            });

            const fieldSelect = `json_build_object(${list.join(', ')}) AS ${this.escapeId(alias+'$')}`;
            columnList.push(fieldSelect);
        });

        return columnList.join(', ');
    }

    _buildOrmColumn(col, mainEntity, aliasMap, columnsSet) {
        if (typeof col === 'string') {
            // it's a string if it's quoted when passed in
            if (isRawSql(col)) {
                columnsSet._.push(extractRawSql(col));
                return;
            }

            const [alias, fieldName] = this._getFieldNameWithAlias(col, mainEntity, aliasMap);
            if (alias === '_') {
                columnsSet._.push(fieldName);
                return;
            }

            columnsSet[alias] || (columnsSet[alias] = new Set());
            if (fieldName === '*' && columnsSet[alias].size > 0) {
                columnsSet[alias] = new Set();
            } else if (columnsSet[alias].has('*')) {
                return;
            }
            columnsSet[alias].add(fieldName);
            return;
        }

        if (typeof col === 'number') {
            throw new InvalidArgument('Number literal is not supported in ORM query.');
        }

        if (typeof col === 'object' && col.$xr) {
            if (col.alias) {
                const params = [];
                const fieldSelect =
                    this._buildColumn(_.omit(col, ['alias']), params, mainEntity, aliasMap) +
                    ' AS ' +
                    this.escapeId(col.alias);
                columnsSet._.push({ clause: fieldSelect, params });
                return;
            }

            throw new InvalidArgument('Column object without an alias is not supported in ORM query.');
        }

        throw new ApplicationError(`Unknown column syntax: ${JSON.stringify(col)}`);
    }

    _getFieldNameWithAlias(fieldName, mainEntity, aliasMap) {
        if (fieldName.startsWith('::')) {
            // ::fieldName for skipping alias padding
            return ['_', this.escapeId(fieldName.substring(2))];
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

            const alias = aliasMap[aliasKey];

            if (!alias) {
                throw new InvalidArgument(`Column reference "${fieldName}" not found in populated associations.`, {
                    entity: mainEntity,
                    aliasMap,
                });
            }

            return [alias, actualFieldName];
        }

        if (mainEntity) {
            return ['_', aliasMap[mainEntity] + '.' + (fieldName === '*' ? '*' : this.escapeId(fieldName))];
        }

        return ['_', fieldName === '*' ? '*' : this.escapeId(fieldName)];
    }

    _replaceParamToken(sql, params) {
        return params.reduce((_sql, p, i) => {
            return _sql.replace(`$?`, `$${i + 1}`);
        }, sql);
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

        let options = queryOptions;

        if (query.hasJoining && !queryOptions.$skipOrm) {
            // force to return as array
            options.$asArray = true;

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
                        ); /* .map(n => ':' + n) changed to be padding by orm and can be customized with other key getter */
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
