import { _, isEmpty } from '@kitmi/utils';
import { InvalidArgument } from '@kitmi/types';
import { runtime, NS_MODULE } from '@kitmi/jacaranda';

import { connectionStringToObject } from '../../Connector';
import RelationalConnector from '../relational/Connector';

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

    typeCast(value) {
        const t = typeof value;

        if (t === 'boolean') return value ? 1 : 0;

        if (t === 'object') {
            if (value != null && value.isLuxonDateTime) {
                return value.toISO({ includeOffset: false });
            }
        }

        return value;
    }

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

    specParamToken(index) {
        return `$${index}`;
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
            const connProps = {};

            if (options.createDatabase) {
                // remove the database from connection
                if (!this.options.adminCredential) {
                    throw new InvalidArgument(
                        `"dataSource.postgres.${this.options.connectorName}.adminCredential" is required to connect with "createDatabase" option.`
                    );
                }

                connProps.username = this.options.adminCredential.username;
                connProps.password = this.options.adminCredential.password;
                connProps.database = 'postgres';
            }

            const csKey = _.isEmpty(connProps) ? null : this.makeNewConnectionString(connProps);

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
        this.app.log('verbose', `Begins a new transaction [id: ${tid}].`);
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
            const tid = client[tranSym];
            this.app.log('verbose', `Commits a transaction [id: ${tid}].`);
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
        const { $preparedKey, $asArray, $getFields, ...connOptons } = options ?? {};

        try {
            conn = connection ?? (await this.connect_(connOptons));

            const query = {
                text: sql,
                values: params,
            };

            if (this.options.logStatement) {
                const meta = { ...options, params };
                if (connection) {
                    meta.transaction = connection[tranSym];
                }

                this.app.log('verbose', sql, meta);
            }

            if ($preparedKey) {
                if (typeof $preparedKey !== 'string') {
                    throw new InvalidArgument(
                        'The `postgres` connector requires `$preparedKey` to be a string as a unique name of the query.'
                    );
                }

                query.name = $preparedKey;

                if ($asArray) {
                    query.rowMode = 'array';
                }
            }

            const res = await conn.query(query);
            this.executedCount++;

            const adapted = {
                op: res.command,
                data: res.rows,
                affectedRows: res.rowCount,                
            };

            if ($getFields) {
                adapted.fields = res.fields;
            }

            return adapted;
        } catch (err) {
            err.info || (err.info = {});
            Object.assign(err.info, options);
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
            sql += ` RETURNING ${options.$getCreated.map((col) => this.escapeId(col)).join(', ')}`;
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
    async upsertOne_(model, data, uniqueKeys, options, dataOnInsert) {
        if (!data || _.isEmpty(data)) {
            throw new ApplicationError(`Creating with empty "${model}" data.`);
        }

        const dataWithoutUK = _.omit(data, uniqueKeys);
        const insertData = { ...data, ...dataOnInsert };

        if (_.isEmpty(dataWithoutUK)) {
            // if dupliate, dont need to update
            return this.create_(model, insertData, {
                ...options,
                insertIgnore: true,
            });
        }

        const sql = `INSERT INTO ?? SET ? ON DUPLICATE KEY UPDATE ?`;
        const params = [model];
        params.push(insertData);
        params.push(dataWithoutUK);

        const result = await this.execute_(sql, params, options);

        return {
            upsert: true,
            ...result,
        };
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
        if (!dataArrayOnInsert || _.isEmpty(dataArrayOnInsert)) {
            throw new ApplicationError(`Upserting with empty "${model}" insert data.`);
        }

        if (!Array.isArray(dataArrayOnInsert)) {
            throw new ApplicationError('"data" to bulk upsert should be an array of records.');
        }

        if (!dataExprOnUpdate || _.isEmpty(dataExprOnUpdate)) {
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
        if (!data || _.isEmpty(data)) {
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
     * @param {*} query
     * @param {*} queryOptions
     * @property {object} [queryOptions.$relationships] - Parsed relatinships
     * @property {boolean} [queryOptions.$requireSplitColumn] - Whether to use set field=value
     * @property {integer} [queryOptions.$limit]
     * @param {*} connOptions
     * @return {object}
     */
    async update_(model, data, query, queryOptions, connOptions) {
        if (_.isEmpty(data)) {
            throw new InvalidArgument('Data record is empty.', {
                model,
                query,
            });
        }

        const params = [];
        const aliasMap = { [model]: 'A' };
        let joinings;
        let hasJoining = false;
        const joiningParams = [];

        if (queryOptions && queryOptions.$relationships) {
            joinings = this._joinAssociations(queryOptions.$relationships, model, aliasMap, 1, joiningParams);
            hasJoining = model;
        }

        let sql = 'UPDATE ' + mysql.escapeId(model);

        if (hasJoining) {
            joiningParams.forEach((p) => params.push(p));
            sql += ' A ' + joinings.join(' ');
        }

        if ((queryOptions && queryOptions.$requireSplitColumns) || hasJoining) {
            sql += ' SET ' + this._splitColumnsAsInput(data, params, hasJoining, aliasMap).join(',');
        } else {
            params.push(data);
            sql += ' SET ?';
        }

        let hasWhere = false;

        if (query) {
            const whereClause = this._joinCondition(query, params, null, hasJoining, aliasMap);
            if (whereClause) {
                sql += ' WHERE ' + whereClause;
                hasWhere = true;
            }
        }

        if (!hasWhere) {
            throw new ApplicationError('Update without where clause is not allowed.');
        }

        if (connOptions && connOptions.returnUpdated) {
            if (connOptions.connection) {
                throw new ApplicationError(
                    'Since "returnUpdated" will create a new connection with "multipleStatements" enabled, it cannot be used within a transaction.'
                );
            }

            connOptions = { ...connOptions, multipleStatements: 1 };

            let { keyField } = connOptions.returnUpdated;
            keyField = this.escapeId(keyField);

            if (queryOptions && _.isInteger(queryOptions.$limit)) {
                sql += ` AND (SELECT @key := ${keyField})`;
                sql += ` LIMIT ${queryOptions.$limit}`;
                sql = `SET @key := null; ${sql}; SELECT @key;`;

                const [_1, _result, [_changedKeys]] = await this.execute_(sql, params, connOptions);

                return [_result, _changedKeys['@key']];
            }

            const { separator = ',' } = connOptions.returnUpdated;
            const quotedSeparator = this.escape(separator);

            sql += ` AND (SELECT find_in_set(${keyField}, @keys := CONCAT_WS(${quotedSeparator}, ${keyField}, @keys)))`;
            sql = `SET @keys := null; ${sql}; SELECT @keys;`;

            const [_1, _result, [_changedKeys]] = await this.execute_(sql, params, connOptions);

            return [_result, _changedKeys['@keys'] ? _changedKeys['@keys'].toString().split(separator) : []];
        }

        if (queryOptions && _.isInteger(queryOptions.$limit)) {
            sql += ` LIMIT ${queryOptions.$limit}`;
        }

        return this.execute_(sql, params, connOptions);
    }

    updateOne_ = this.update_;

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
     * @param {*} query
     * @param {*} deleteOptions
     * @param {*} options
     */
    async delete_(model, query, deleteOptions, options) {
        const params = [model];
        const aliasMap = { [model]: 'A' };
        let joinings;
        let hasJoining = false;
        const joiningParams = [];

        if (deleteOptions && deleteOptions.$relationships) {
            joinings = this._joinAssociations(deleteOptions.$relationships, model, aliasMap, 1, joiningParams);
            hasJoining = model;
        }

        let sql;

        if (hasJoining) {
            joiningParams.forEach((p) => params.push(p));
            sql = 'DELETE A FROM ?? A ' + joinings.join(' ');
        } else {
            sql = 'DELETE FROM ??';
        }

        const whereClause = this._joinCondition(query, params, null, hasJoining, aliasMap);
        if (whereClause) {
            sql += ' WHERE ' + whereClause;
        }

        return this.execute_(sql, params, options);
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
}

PostgresConnector.driverLib = pg;

export default PostgresConnector;
